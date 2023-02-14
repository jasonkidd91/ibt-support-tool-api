"use strict";
/**
 * Declarations
 */
const Constants = require('../constants/constants');
const Reponse = require('../core/response');
const sshProvider = require('../providers/ssh.provider');
const http = require('../providers/http.provider');
/**
 * Core Object
 */
var MemorySpike = (function () {
    /**
     * Constructor
     * @param {String} core 
     * @param {Number} port 
     * @param {String} host 
     * @param {*} host 
     */
    function MemorySpike(core, port, host, config) {
        this.port = null;
        this.servers = null;
        this.propertiesCore = null;
        this.solrPath = null;
        this.config = config ? config : { execute: false, propertiesCore: null };

        if (core) {
            const t = Constants.SolrServers.find((i) => i.core === core);
            this.port = t.port;
            this.servers = t.servers;
            this.core = t.core;
        } else if (port && host) {
            const t = Constants.SolrServers.find((i) => i.port === port && i.servers.some(s => s.host === host));
            this.port = t.port;
            this.servers = [t.servers.find(i => i.host === host)];
            this.core = t.core;
        } else {
            throw Error('Failed to construct MemorySpike');
        }
        if (isArticleComment(this.port)) {
            this.solrPath = `/opt/solrEnt/post/${this.core}`;
        } else if (isTicket(this.port)) {
            this.solrPath = `/opt/solrEnt/ticket/${this.core}`;
            this.propertiesCore = [this.core];
            this.config.execute = true;
        } else if (isOthersTicket(this.port)) {
            this.solrPath = `/opt/solrEnt/ticket/${this.core}`;
        }
    }
    /**
     * Move data import properties files into tmp folder
     */
    MemorySpike.prototype.moveFile = async function () {
        try {
            let response = new Reponse();
            const command = sshProvider.buildCommand(
                `cd ${this.solrPath}/nodes/conf-extras/dataimportschedule/`,
                'echo \'[DATA IMPORT FOLDER]:\'',
                'ls -ltr | grep dataimportSchedule.properties',
                'mv dataimportSchedule.properties.* tmp/',
                'echo \'[DATA IMPORT FOLDER]:\'',
                'ls -ltr'
            );
            await executeSSH.call(this, this.servers, command)
                .then(res => {
                    /**
                     * Set the propertiesCore to be used for http calls in article and comment
                     */
                    if (isArticleComment(this.port)) {
                        let rawData = res && res.length ? res : [];
                        if (rawData && rawData.length) {
                            let d = [];
                            for (let data of rawData) {
                                let m = data.match(/([a-zA-Z(\.)?])+\d+/g);
                                m.forEach(i => d.push('ac' + i.match(/\d+$/)[0]))
                            }
                            d = [...new Set(d)];
                            this.propertiesCore = d;
                            this.config = this.config ? this.config : {};
                            this.config.execute = true;
                        }
                    }
                    response.Resolve(res)
                }, err => response.Reject(err));
            return response;
        } catch (e) {
            console.error('ERROR >> Failed to move data properties files');
            console.error('Cause:', e);
            throw e;
        }
    }
    /**
     * Data sync up
     */
    MemorySpike.prototype.dataSync = async function () {
        try {
            let response = new Reponse();
            let data = [];
            let error = false;
            for (let server of this.servers) {
                let core = isTicket(this.port) ? this.core : 'ac##';
                let propertiesCore = this.config && this.config.propertiesCore ? this.config.propertiesCore : this.propertiesCore;
                if (propertiesCore && propertiesCore.length) {
                    propertiesCore.forEach(c => data.push({ url: `http://${server.host}:${this.port}/solr/${c}_s1/update?stream.body=%3Ccommit/%3E` }));
                } else {
                    data.push({ url: `http://${server.host}:${this.port}/solr/${core}_s1/update?stream.body=%3Ccommit/%3E` });
                }
                /**
                 * Run HTTP to data sync
                 */
                if (this.config.execute && data.length > 0) {
                    for (let d of data) {
                        try {
                            const $http = new http(d.url);
                            await $http.get()
                            d.status = 'Completed';
                        } catch (e) {
                            d.status = 'Failed';
                            error = true;
                            console.error('HTTP ERROR >> Failed to http calls');
                            console.error('Cause: \n\t' + e);
                        }
                    }
                }
            }
            if (error) response.Reject(data)
            else response.Resolve(data);
            return response;
        } catch (e) {
            console.error('ERROR >> Failed to data sync');
            console.error('Cause:', e);
            throw e;
        }
    }
    /**
     * Stop server
     */
    MemorySpike.prototype.stopServer = async function () {
        try {
            async function sleep(ms) {
                return new Promise((resolve) => {
                    setTimeout(resolve, ms);
                });
            }
            const command = sshProvider.buildCommand(
                `cd ${this.solrPath}/bin/`,
                'echo \'Stopping Server...\'',
                './stop.sh'
                // 'echo \'java.net.ConnectException: Connection refused\''
            );
            let response = new Reponse();
            let ms = 0;
            let data = [];
            let servers = [...this.servers];
            try {
                while (servers && servers.length != 0) {
                    let i = 0;
                    for (let server of servers) {
                        let res = await executeSSH.call(this, [server], command);
                        if (/Connection refused/g.test(res[0])) {
                            data.push({ server: server.host, status: 'Completed', response: res[0] });
                            servers.splice(i, 1);
                        }
                        i++;
                    }
                    /**
                     * Sleep if stop server stucked
                     */
                    if (servers.length > 0) {
                        ms += 5000;
                        if (ms >= 20000) throw Error('Timeout on Stop Server');
                        await sleep(ms);
                    }
                }
                response.Resolve(data);
                return response;
            } catch (e) {
                console.error('ERROR >> While trying to stop server');
                console.error('Cause: \n\t' + e);
                servers.forEach(s => data.push({ server: s.host, status: 'Failed', response: e.toString() }));
                response.Reject(data);
                return response;
            }
        } catch (e) {
            console.error('ERROR >> Failed to stop server');
            console.error('Cause:', e);
            throw e;
        }
    }
    /**
     * Start server
     */
    MemorySpike.prototype.startServer = async function () {
        try {
            let response = new Reponse();
            const command = sshProvider.buildCommand(
                `cd ${this.solrPath}/bin/`,
                'echo \'Starting Server...\'',
                './start.sh'
            );
            await executeSSH.call(this, this.servers, command)
                .then(res => response.Resolve(res), err => response.Reject(err));
            return response;
        } catch (e) {
            console.error('ERROR >> Failed to start server');
            console.error('Cause:', e);
            throw e;
        }
    }
    /**
     * Restore data import properties files back to origninal folder
     */
    MemorySpike.prototype.restoreFile = async function () {
        try {
            let response = new Reponse();
            const command = sshProvider.buildCommand(
                `cd ${this.solrPath}/nodes/conf-extras/dataimportschedule/tmp/`,
                'echo \'[TMP FOLDER]:\'',
                'ls -ltr',
                'mv dataimportSchedule.properties.* ../',
                'cd ..',
                'echo \'[DATA IMPORT FOLDER]:\'',
                'ls -ltr'
            );
            await executeSSH.call(this, this.servers, command)
                .then(res => response.Resolve(res), err => response.Reject(err));
            return response;
        } catch (e) {
            console.error('ERROR >> Failed to restore data properties files');
            console.error('Cause:', e);
            throw e;
        }
    }
    /**
     * Automate restart process
     */
    MemorySpike.prototype.automate = async function () {
        try {
            /**
             * Validation
             */
            if (this.config && this.config.propertiesCore) throw Error('Automation doesn\'t allow "config.propertiesCore" value');
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
                if (isArticleComment(this.port) || isTicket(this.port)) {
                    await Promise.resolve()
                        .then(await this.moveFile().then(successHandler))
                        .then(await this.dataSync().then(successHandler))
                        .then(await this.stopServer().then(successHandler))
                        .then(await this.startServer().then(successHandler))
                        .then(await this.restoreFile().then(successHandler));
                } else if (isOthersTicket(this.port)) {
                    /**
                     * Just restart if port is 8989
                     */
                    await Promise.resolve()
                        .then(await this.stopServer().then(successHandler))
                        .then(await this.startServer().then(successHandler));
                }
            } catch (e) {
                console.error('ERROR >> Automation Terminated');
                console.error('Cause:', e);
            }
            return data;
        } catch (e) {
            console.error('ERROR >> Failed to automate memory spike');
            console.error('Cause:', e);
            throw e;
        }
    }
    /**
     * Execute SSH command for each server
     * @param {String[]} servers 
     * @param {String} command 
     */
    var executeSSH = async function (servers, command) {
        return new Promise(async (resolve, reject) => {
            let data = [];
            try {
                for (let server of servers) {
                    const config = configBuilder.call(this, server.host);
                    let res = await sshProvider.run(config, command).then((res) => {
                        return res;
                    }, err => { throw err });
                    data.push(res);
                }
            } catch (e) {
                console.error('ERROR >> Failed to execute SSH');
                console.error('Cause:', e);
                data.push(e.toString());
                reject(data);
            }
            resolve(data);
        });
    }
    /**
     * Construct the config parameters to be used in the ssh
     * @param {String} host 
     */
    var configBuilder = function (host) {
        return {
            host: host,
            port: 22,
            username: 'solr',
            password: 'Solr!@312'
        };
    }
    /**
     * Is type of Article Comment
     * @param {Number} port 
     */
    var isArticleComment = function (port) { return port === 8981 || port == 8982; }
    /**
     * Is type of Ticket
     * @param {Number} port 
     */
    var isTicket = function (port) { return port === 8984 || port === 8985; }
    /**
     * Is type of Others Ticket
     * @param {Number} port 
     */
    var isOthersTicket = function (port) { return port === 8989; }
    /**
     * EOF
     */
    return MemorySpike;
})();
module.exports = MemorySpike;