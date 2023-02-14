'use strict';
/**
 * Declaration
 */
const sshProvider = require('../providers/ssh.provider');
const articleProvider = require('../providers/article.provider');
const moment = require('moment');
const Reponse = require('../core/response');
const PERIOD_FROM = 'MASTER_INDEX_PERIOD_FROM';
const PERIOD_TO = 'MASTER_INDEX_PERIOD_TO';
const CHANNEL_ID = 'MASTER_CHANNEL_ID';
const REALTIME_INTERVAL = 'MASTER_INDEX_REALTIME_INTERVAL';
const REALTIME_FROM = 'MASTER_INDEX_REALTIME_FROM';
const CONFIG_FILE = "configpatch2.txt"; //"test.txt";
const CONFIG_E_FILE = "configpatch3.txt"; //"configpatch2.txt";
const CONFIG_SCRIPT = "run-indexGen-ac-patch2";
const CONFIG_E_SCRIPT = "run-indexGen-patch3"; //"run-indexGen-patch2";
const DATE_FORMAT_IN = 'YYYY-MM-DD HH:mm';
const DATE_FORMAT_OUT = "YYYY-MM-DD HH:mm:ss";
const TYPE = {
    BEER: 'beer',
    COCKTAIL: 'cocktail'
}
/**
 * Replace parameters in the configpatch file
 * @param {*} indexing 
 */
exports.UPDATE = async function (indexing) {
    try {
        let response = new Reponse();
        let data = [];
        let promises = [];
        let error = false;
        /**
         * Update configpatch file and execute for one social
         */
        let command = sshProvider.buildCommand(
            'cd /brandtology/indexGenPatcher/config',
            `sed -i '/${PERIOD_FROM} /c\\${PERIOD_FROM}                    = ${indexing.requestFrom}' ${CONFIG_FILE}`,
            `sed -i '/${PERIOD_TO} /c\\${PERIOD_TO}                      = ${indexing.requestTo}' ${CONFIG_FILE}`,
            `sed -i '/${CHANNEL_ID} /c\\${CHANNEL_ID}                           = ${indexing.channels}' ${CONFIG_FILE}`,
            `sed -i '/${REALTIME_INTERVAL} /c\\${REALTIME_INTERVAL}              = ${indexing.minutes}' ${CONFIG_FILE}`,
            `sed -i '/${REALTIME_FROM} /c\\${REALTIME_FROM}                  = ${indexing.crawlDate}' ${CONFIG_FILE}`
        );
        promises.push(executeSSH(configBuilder(TYPE.BEER), command));
        /**
         * Update configpatch file and execute for social express
         */
        let command2 = sshProvider.buildCommand(
            'cd /brandtology/indexGenSolrAC/config',
            `sed -i '/${PERIOD_FROM} /c\\${PERIOD_FROM}                    = ${indexing.requestFrom}' ${CONFIG_E_FILE}`,
            `sed -i '/${PERIOD_TO} /c\\${PERIOD_TO}                      = ${indexing.requestTo}' ${CONFIG_E_FILE}`,
            `sed -i '/${CHANNEL_ID} /c\\${CHANNEL_ID}                           = ${indexing.channels}' ${CONFIG_E_FILE}`,
            `sed -i '/${REALTIME_INTERVAL} /c\\${REALTIME_INTERVAL}              = ${indexing.minutes}' ${CONFIG_E_FILE}`,
            `sed -i '/${REALTIME_FROM} /c\\${REALTIME_FROM}                  = ${indexing.crawlDate}' ${CONFIG_E_FILE}`
        );
        promises.push(executeSSH(configBuilder(TYPE.COCKTAIL), command2));
        /**
          * Execute all promises
          */
        await Promise.all(promises.map(p => p.catch(e => e))).then(res => {
            res.forEach(r => {
                let d = { status: null, value: null };
                if (r instanceof Error) {
                    error = true;
                    d.status = 'Failed';
                    d.value = res
                } else {
                    d.status = 'File update successful';
                }
                data.push(d);
            });
        });
        /**
         * Read configpatch file
         */
        if (!error) {
            await this.VERIFY().then(res => { data.map((d, i) => { d.value = res.data[i]; }); });
            response.Resolve(data);
        } else {
            response.Reject(data);
        }
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to update configpath file');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Display the parameters in configpatch file for confirmation
 */
exports.VERIFY = async function () {
    try {
        let response = new Reponse();
        let data = [];
        let error = false;
        let promises = [];
        /**
         * get config of one social
         */
        let command = sshProvider.buildCommand(
            'cd /brandtology/indexGenPatcher/config',
            `grep '${PERIOD_FROM} ' ${CONFIG_FILE}`,
            `grep '${PERIOD_TO} ' ${CONFIG_FILE}`,
            `grep '${CHANNEL_ID} ' ${CONFIG_FILE}`,
            `grep '${REALTIME_INTERVAL} ' ${CONFIG_FILE}`,
            `grep '${REALTIME_FROM} ' ${CONFIG_FILE}`
        );
        promises.push(executeSSH(configBuilder(TYPE.BEER), command));
        /**
         * get config of social express
         */
        let command2 = sshProvider.buildCommand(
            'cd /brandtology/indexGenSolrAC/config',
            `grep '${PERIOD_FROM} ' ${CONFIG_E_FILE}`,
            `grep '${PERIOD_TO} ' ${CONFIG_E_FILE}`,
            `grep '${CHANNEL_ID} ' ${CONFIG_E_FILE}`,
            `grep '${REALTIME_INTERVAL} ' ${CONFIG_E_FILE}`,
            `grep '${REALTIME_FROM} ' ${CONFIG_E_FILE}`
        );
        promises.push(executeSSH(configBuilder(TYPE.COCKTAIL), command2));
        /**
         * Execute all promises
         */
        await Promise.all(promises.map(p => p.catch(e => e))).then(res => {
            res.forEach(r => {
                if (r instanceof Error) {
                    error = true;
                    data.push(r);
                } else { data.push(r.split('\n').filter(x => x)); }
            });
        });
        if (!error) response.Resolve(data);
        else response.Reject(data);
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to read configpath file');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Execute indexing process script
 */
exports.EXECUTE = async function () {
    try {
        let response = new Reponse();
        let data = [];
        let error = false;
        let promises = [];
        /**
         * execute for one social
         */
        let command = sshProvider.buildCommand(
            'cd /brandtology/indexGenPatcher',
            `nohup ./${CONFIG_SCRIPT}`,
            'cd runlog',
            'ls -Art | grep logpatch | tail -n 1'    // get the latest log file
        );
        promises.push(executeSSH(configBuilder(TYPE.BEER), command));
        /**
         * execute for social express
         */
        let command2 = sshProvider.buildCommand(
            'cd /brandtology/indexGenSolrAC',
            `nohup ./${CONFIG_E_SCRIPT}`,
            'cd runlog',
            'ls -Art | grep logpatch | tail -n 1'    // get the latest log file
        );
        promises.push(executeSSH(configBuilder(TYPE.COCKTAIL), command2));
        /**
         * Execute all promises
         */
        await Promise.all(promises.map(p => p.catch(e => e))).then(res => {
            res.forEach(r => {
                if (r instanceof Error) { error = true; }
                data.push(r);
            });
        });
        if (!error) response.Resolve(data);
        else response.Reject(data);
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to execute indexing process');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Check the log file
 * @param {String} filename 
 */
exports.CHECK = async function (filenames) {
    try {
        if (!filenames) throw Error('Invalid filename');
        let response = new Reponse();
        let data = [];
        let error = false;
        let promises = [];
        if (filenames.oneSocial) {
            /**
             * check log for one social
             */
            let command = sshProvider.buildCommand(
                'cd /brandtology/indexGenPatcher/runlog',
                `tail -20 ${filenames.oneSocial}`
            );
            promises.push(executeSSH(configBuilder(TYPE.BEER), command));
        }
        if (filenames.socialExpress) {
            /**
             * check log for social express
             */
            let command2 = sshProvider.buildCommand(
                'cd /brandtology/indexGenSolrAC/runlog',
                `tail -20 ${filenames.socialExpress}`
            );
            promises.push(executeSSH(configBuilder(TYPE.COCKTAIL), command2));
        }
        /**
         * Execute all promise
         */
        await Promise.all(promises.map(p => p.catch(e => e))).then(res => {
            res.forEach(r => {
                if (r instanceof Error) {
                    error = true;
                    data.push(r);
                } else { data.push(r.split('\n').filter(x => x)); }
            });
        })
        if (!error) response.Resolve(data);
        else response.Reject(data);
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to check log');
        console.error('Cause:', e);
        throw e;
    }
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
 * Construct the config parameters to be used in the ssh
 */
var configBuilder = function (type) {
    switch (type) {
        case TYPE.BEER:
            return {
                host: '<<ipaddress>>',
                port: 22,
                username: '<<username>>',
                password: '<<password>>'
            };
        case TYPE.COCKTAIL:
            return {
                host: '<<ipaddress>>',
                port: 22,
                username: '<<username>>',
                password: '<<password>>'
            };
        default:
            return null;
    }
}
/**
 * Core Object
 */
var Indexing = (function () {
    /**
     * Constructor
     */
    function Indexing() {
        this.channels = null;
        this.requestFrom = null;
        this.requestTo = null;
        this.crawlDate = null;
        this.minutes = null;
    }
    /**
     * Logic to construct Indexing object as constructor doesn't allow async
     * @param {*} Request 
     */
    Indexing.prototype.init = async function (req) {
        const _self = this;
        let dateFrom, dateTo = null;
        if (req.articleId) {
            let ids = req.articleId.split(',').map(s => s.trim());;
            for (let id of ids) {
                let article = await new articleProvider().findArticleById(id);
                if (article && article.DateTime_Posted) {
                    let tempFrom = moment(article.DateTime_Posted).subtract(1, 'day').startOf('day');
                    let tempTo = moment(article.DateTime_Posted).add(1, 'day').endOf('day');
                    dateFrom = dateFrom == null ? tempFrom : tempFrom.isBefore(dateFrom) ? tempFrom : dateFrom;
                    dateTo = dateTo == null ? tempTo : tempTo.isAfter(dateTo) ? tempTo : dateTo;
                } else {
                    throw Error(`Article ${req.articleId} not found!`)
                }
            }
        } else if (req.requestDate && req.requestDateTo) {
            dateFrom = moment(req.requestDate, DATE_FORMAT_IN);
            dateTo = moment(req.requestDateTo, DATE_FORMAT_IN);
        } else if (req.requestDate && req.days) {
            dateFrom = moment(req.requestDate, DATE_FORMAT_IN).subtract(req.days + 1, 'days').endOf('days');
            dateTo = moment(req.requestDate, DATE_FORMAT_IN);
        }
        if (dateTo.isBefore(dateFrom)) throw Error('Invalid Request Date!');
        _self.requestFrom = dateFrom ? dateFrom.format(DATE_FORMAT_OUT) : null;
        _self.requestTo = dateTo ? dateTo.format(DATE_FORMAT_OUT) : null;
        _self.channels = req.channels.replace(/ /g, '');
        _self.crawlDate = moment(req.crawlDateTo, DATE_FORMAT_IN).format(DATE_FORMAT_OUT);
        _self.minutes = moment(req.crawlDateTo, DATE_FORMAT_IN).diff(moment(req.crawlDateFrom, DATE_FORMAT_IN), 'minutes');
        if (_self.minutes <= 0) throw Error('Invalid Crawl Date!');
        if (!_self.channels || !_self.requestFrom || !_self.requestTo || !_self.crawlDate || !_self.minutes) throw Error('Failed to construct Indexing');
        return _self;
    }
    /**
     * EOF
     */
    return Indexing;
})();
exports.Indexing = Indexing;