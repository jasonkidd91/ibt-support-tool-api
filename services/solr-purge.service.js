'use strict';
/**
 * Declaration
 */
const Constants = require('../constants/constants');
const sshProvider = require('../providers/ssh.provider');
const MemorySpike = require('../core/memory-spike')
const moment = require('moment');
const http = require('../providers/http.provider');
const Reponse = require('../core/response');
/**
 * Run archiver
 */
exports.ARCHIVER = async function (purge) {
    try {
        let response = new Reponse();
        let command = sshProvider.buildCommand(
            `cd /brandtology/solrDataArchiver`,
            './runArchiver.sh'
            // 'sleep 3'
        );
        let config = { host: '192.168.50.73', port: 22, username: 'cocktail', password: 'pAss123' };
        await executeSSH(config, command).then(async () => {
            let res = await this.ARCHIVER_VERIFIER(purge);
            if (res.Error()) response.Reject(res.data);
            else response.Resolve(res.data);
        }, err => response.Reject(err));
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to run archiver');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Post archiver verifier
 */
exports.ARCHIVER_VERIFIER = async function (purge) {
    try {
        let response = new Reponse();
        let data = {};
        let startdate = data.startdate = purge.startdate;
        let enddate = data.enddate = purge.enddate;
        let error = false;
        try {
            await archiverQuery(purge).then(res => {
                data.pre = res;
            }, err => { throw err; });
            /**
             * Determine if update is required
             */
            data.updateRequired = (startdate != data.pre.startdate || enddate != data.pre.enddate);
            /**
             * Perform Update
             */
            if (!error && purge.config.updateOnVerify && data.updateRequired) {
                let command = sshProvider.buildCommand(
                    'cd /brandtology/config/zookeeper',
                    `sed -i 's/${data.pre.startdate}/${purge.startdate}/' articlecomment.xml`,
                    `sed -i 's/${data.pre.enddate}/${purge.enddate}/' articlecomment.xml`
                );
                let config = { host: '192.168.50.65', port: 22, username: 'cocktail', password: 'pAss123' };
                await executeSSH(config, command).then(async () => {
                    data.updateCompleted = true;
                    const $http = new http('http://192.168.51.81:8000/index_service/config/refreshZKConfig');
                    await $http.get().then(async () => {
                        await archiverQuery(purge).then(res => {
                            if (res.startdate != purge.startdate || res.enddate != purge.enddate) {
                                throw Error('Update doesn\'t take effect yet!');
                            } else {
                                data.post = res;
                            }
                        }, err => { throw err; });
                    });
                }, err => {
                    data.updateCompleted = false;
                    throw err;
                });
            }
        } catch (e) {
            error = true;
            data.errorMessage = e.toString();
        }
        if (!error) response.Resolve(data);
        else response.Reject(data);
        return response;
    } catch (e) {
        console.error('ERROR >> Failed while performing post archiver verification');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Backup and stop target server
 */
exports.STOP_TARGET = async function (purge) {
    try {
        let response = new Reponse();
        let error = false;
        let data = [];
        const $target = purge.$target;
        const successHandler = (res) => {
            res.step = data.length + 1;
            data.push(res.data);
            if (res.Error()) throw Error('Process Terminated due to some error occured');
        };
        try {
            await Promise.resolve()
                .then(await $target.moveFile().then(successHandler))
                .then(await $target.dataSync().then(successHandler))
                .then(await $target.stopServer().then(successHandler));
        } catch (e) {
            console.error('ERROR >> Process Terminated');
            console.error('Cause:', e);
            error = true;
        }
        if (!error) response.Resolve(data);
        else response.Reject(data);
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to stop target');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Update data import file
 */
exports.DATAIMPORT = async function (purge) {
    try {
        let response = new Reponse();
        let date = moment();
        let dateString = `${date.format('YYYY-MM-DD')} ${date.format('HH')}\\\\:${date.format('mm')}\\\\:${date.format('ss')}`;
        let command = sshProvider.buildCommand(
            `cd /opt/solrEnt/config/`,
            `sed -i '1s/^.*$/c${purge.index}.last_index_time=${dateString}/g' dataimport.properties`,
            `sed -i '2s/^.*$/last_index_time=${dateString}/g' dataimport.properties`,
            `sed -i '3s/^.*$/a${purge.index}.last_index_time=${dateString}/g' dataimport.properties`
        );
        let config = { host: '192.168.51.76', port: 22, username: 'solr', password: 'Solr!@312' };
        await executeSSH(config, command).then(async () => {
            let res = await this.DATAIMPORT_VERIFIER(purge);
            if (res.Error()) response.Reject(res.data);
            else response.Resolve(res.data);
        }, err => response.Reject(err));
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to update data import');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Perform post update data import file verfication and run java configuration to update value
 */
exports.DATAIMPORT_VERIFIER = async function (purge) {
    try {
        let response = new Reponse();
        let data = {};
        let error = false;
        let command = sshProvider.buildCommand(
            `cd /opt/solrEnt/config/`,
            `tail -3 dataimport.properties`
        );
        let config = { 
            host: '<<ipaddress>>', 
            port: 22, 
            username: '<<username>>', 
            password: '<<password>>' 
        };
        await executeSSH(config, command).then((res) => {
            let r = res.split('\n').filter(x => x);
            data.reponse = r;
            /**
             * Check if value updated correctly
             */
            let pass = purge.$target.servers.reduce((a, b) => new RegExp(a.prefix + purge.index).test(r) && new RegExp(b.prefix + purge.index).test(r));
            data.pass = pass;
        }, err => {
            error = true;
            data.response = err.toString();
        });
        /**
         * Run java config to update data import value
         */
        if (!error && purge.config.updateOnDataImport) {
            if (!data.pass) error = true;
            else {
                let command2 = sshProvider.buildCommand(
                    `cd /opt/solrEnt/config/`,
                    `java -classpath /opt/solrEnt/solr-home-440/solr-webapp/webapp/WEB-INF/lib/*:/opt/solrEnt/solr-home-440/lib/*.jar: org.apache.solr.cloud.ZkCLI -cmd upconfig -zkhost 192.168.51.75:2181,192.168.51.76:2181,192.168.51.77:2181,192.168.51.78:2181 -confdir /opt/solrEnt/config -confname ac${purge.index}`,
                    'sleep 3',
                    `java -classpath /opt/solrEnt/solr-home-440/solr-webapp/webapp/WEB-INF/lib/*:/opt/solrEnt/solr-home-440/lib/*.jar: org.apache.solr.cloud.ZkCLI -cmd linkconfig -zkhost 192.168.51.75:2181,192.168.51.76:2181,192.168.51.77:2181,192.168.51.78:2181 -collection ac${purge.index} -confname ac${purge.index}`
                );
                await executeSSH(config, command2).then(res => data.java_response = res, err => {
                    error = true;
                    data.java_response = err.toString();
                });
            }
        };
        if (!error) response.Resolve(data);
        else response.Reject(data);
        return response;
    } catch (e) {
        console.error('ERROR >> Failed while performing data import verification');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Copy new data import properties file, remove cache, start server, and restore data import properties file
 */
exports.RESUME_TARGET = async function (purge) {
    try {
        let $target = purge.$target;
        let data = [];
        let error = false;
        /**
         * Remove cache and copy new data import properties file
         */
        let response = new Reponse();
        let preProcess = [];
        try {
            for (let server of $target.servers) {
                let res = { server: server.host, ready: false };
                let command = sshProvider.buildCommand(
                    `cd ${$target.solrPath}/nodes/conf-extras/dataimportschedule/bkup`,
                    `cp dataimportSchedule.properties.${server.prefix}${purge.index} ../`,
                    `cd ${$target.solrPath}/nodes/conf-extras/dataimportschedule/tmp`,
                    `rm "$(ls -t | grep dataimportSchedule.properties | tail -1)"`,
                    `cd /opt/solrEnt/post/ac${purge.index}/nodes/`,
                    // `cd ${$target.solrPath}/nodes/`,
                    `rm -rf data/*`
                );
                let config = { host: server.host, port: 22, username: 'solr', password: 'Solr!@312' };
                await executeSSH(config, command).then(() => {
                    res.ready = true;
                    preProcess.push(res);
                }, err => {
                    res.errorMessage = err.toString();
                    preProcess.push(err);
                    throw err;
                });
            }
        } catch (e) {
            console.error('ERROR >> Failed on Stop Server Pre-Process');
            console.error('Cause:', e);
            error = true;
        }
        response.step = data.length + 1;
        if (!error) response.Resolve(preProcess);
        else response.Reject(preProcess);
        data.push(response);
        /**
         * Start server and restore file
         */
        if (!error) {
            try {
                const successHandler = (res) => {
                    res.step = data.length + 1;
                    data.push(res);
                    if (res.Error()) throw Error('Automation Terminated due to there are some problem happening in the process');
                }
                Promise.resolve()
                    .then(await $target.startServer().then(successHandler))
                    .then(await $target.restoreFile().then(successHandler));
            } catch (e) {
                console.error('ERROR >> Failed on Start Server');
                console.error('Cause:', e);
            }
        }
        return data;
    } catch (e) {
        console.error('ERROR >> Failed to update and resume server');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Automate Solr Purge Process
 */
exports.AUTOMATE = async function (purge) {
    try {
        /**
         * Declaration
         */
        let data = [];
        const successHandler = (res) => {
            res.step = data.length + 1;
            data.push(res);
            if (res.Error()) throw Error('Automation Terminated due to there are some problem happening in the process');
        }
        /**
         * Automation Start
         */
        try {
            purge.cofig.updateOnVerify = true;
            purge.config.updateOnDataImport = true;
            await Promise.resolve()
                .then(await this.ARCHIVER(purge).then(successHandler))
                .then(await this.STOP_TARGET(purge).then(successHandler))
                .then(await this.DATAIMPORT(purge).then(successHandler))
                .then(await this.RESUME_TARGET(purge).then(successHandler));
        } catch (e) {
            console.error('ERROR >> Automation Terminated');
            console.error('Cause:', e);
        }
        data.push(`${data.length + 1}: Login workbench server solr@192.168.51.81 to sudo service tomcat6 restart`);
        purge.$target.servers.forEach(s => data.push(`${data.length + 1}: Verify in http://${s.host}:${purge.$target.port}/solr/#/ac${purge.index}_s1`));
        return data;
    } catch (e) {
        console.error('ERROR >> Failed to automate solr purge');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Query zookeeper xml for post archiver verification
 * @param {*} purge 
 */
var archiverQuery = async function (purge) {
    return new Promise(async (resolve, reject) => {
        let url = 'http://192.168.50.65:8000/index_server/config/getZKConfig?name=articlecomment.xml';
        try {
            const $http = new http(url);
            await $http.get().then(res => {
                var parseString = require('xml2js').parseString;
                parseString(res, function (err, result) {
                    if (err) { throw err; }
                    else {
                        // console.dir(JSON.stringify(result));
                        let r = result.servers.collection.find(c => c.id.some(i => i === purge.indexCore));
                        if (!r) { throw new Error('Failed to extract data'); }
                        else { resolve({ id: r.id[0], startdate: r.startdate[0], enddate: r.enddate[0] }); }
                    }
                });
            }, err => { throw err; });
        } catch (e) {
            console.error('ERROR >> Failed on parsing XML of url: ' + url);
            console.error('Cause:', e);
            reject(e);
        }
    });
}
/**
 * Execute SSH command
 * @param {String} command 
 */
var executeSSH = async function (config, command) {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await sshProvider.run(config, command).then((res) => {
                return res;
            }, err => { throw err });
            resolve(res)
        } catch (e) {
            console.error('ERROR >> Failed to execute SSH');
            console.error('Cause:', e);
            reject(e.toString());
        }
    });
}
/**
 * Core Object
 */
var Purge = (function () {
    /**
     * Constructor
     */
    function Purge(config) {
        this.currentDate = moment();
        this.currentMonth = this.currentDate.month() + 1;
        this.currentDay = this.currentDate.date();
        this.index = null;
        this.indexCore = null;
        this.startdate = null;
        this.enddate = null;
        this.$target = null;
        this.config = config ? config : { updateOnVerify: false, updateOnDataImport: false };
        /**
         * Perform logic to init next index data
         */
        let nextIndex = nextIndexFn.call(this);
        if (nextIndex) {
            this.index = nextIndex.index;
            this.indexCore = 'ac' + nextIndex.index;
            this.startdate = nextIndex.startdate;
            this.enddate = nextIndex.enddate;
            let s = Constants.SolrServers.find(s => s.index === nextIndex.index);
            this.$target = new MemorySpike(s.core);
        }
        if (!this.index || !this.$target || !this.startdate || !this.enddate) throw Error('Failed to construct Purge');
    }
    /**
     * Determine the index of the next purge core target
     */
    var nextIndexFn = function () {
        const month = this.currentMonth;
        const day = this.currentDay;
        const handler = (indexes) => {
            const dt = this.currentDate;
            const dateFormat = 'YYYY-MM-DD';
            if (day >= 1 && day <= 8) {
                return {
                    startdate: dt.date(9).format(dateFormat),
                    enddate: dt.date(16).format(dateFormat),
                    index: indexes[0]
                }
            } else if (day >= 9 && day <= 16) {
                return {
                    startdate: dt.date(17).format(dateFormat),
                    enddate: dt.date(24).format(dateFormat),
                    index: indexes[1]
                }
            } else if (day >= 17 && day <= 24) {
                return {
                    startdate: dt.date(25).format(dateFormat),
                    enddate: dt.endOf('month').format(dateFormat),
                    index: indexes[2]
                }
            }
            else if (day >= 25 && day <= 31) {
                return {
                    startdate: dt.add(1, 'month').startOf('month').format(dateFormat),
                    enddate: dt.date(8).format(dateFormat),
                    index: indexes[3]
                }
            }
        };
        /**
         * Condition handler
         */
        if (month == 1) return handler([2, 3, 4, 5]);
        else if (month == 2) return handler([6, 7, 8, 9]);
        else if (month == 3) return handler([10, 11, 12, 13]);
        else if (month == 4) return handler([14, 15, 16, 17]);
        else if (month == 5) return handler([18, 19, 20, 21]);
        else if (month == 6) return handler([22, 23, 24, 25]);
        else if (month == 7) return handler([26, 27, 28, 29]);
        else if (month == 8) return handler([30, 31, 32, 33]);
        else if (month == 9) return handler([34, 35, 36, 37]);
        else if (month == 10) return handler([38, 39, 40, 41]);
        else if (month == 11) return handler([42, 43, 44, 45]);
        else if (month == 12) return handler([46, 47, 48, 1]);
        return null;
    }
    /**
     * EOF
     */
    return Purge;
})();
exports.Purge = Purge;