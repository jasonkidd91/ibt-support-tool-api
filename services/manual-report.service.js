'use strict';
/**
 * Declaration
 */
const adminProvider = require('../providers/admin.provider');
const sshProvider = require('../providers/ssh.provider');
const Reponse = require('../core/response');
const moment = require('moment');
const jarFile = "FetchMoeDataByQueryW.jar";
const max_concurrent = 3;
/**
 * Retireve client accounts by name
 */
exports.CLIENTS = async function (nameQuery) {
    try {
        if (!nameQuery || !(nameQuery.trim())) throw new Error('Name query cannot be empty!')
        const results = await new adminProvider().findClientByNameLike(nameQuery);
        return results.map(({ ID, Name }) => ({ ID, Name }));
    } catch (e) {
        console.error('ERROR >> Failed to trigger backgen');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Retrive backgen log for id
 */
exports.TRIGGER = async function (report) {
    try {
        let response = new Reponse();

        let command = sshProvider.buildCommand(
            '/home/corona/moe/script',
            `tail -5 "$(ls | grep ${id})"`
        );
        await executeSSH(command).then(res => response.Resolve(res), err => response.Reject(err));
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to retireve log file for backgen: ' + id);
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Retrive backgen log for id
 */
exports.MANUAL = async function (report) {
    try {
        let response = new Reponse();
        let promises = [];
        let i = 0;
        while (i < report.fileCount) {
            let days_page = i * (report.partition);
            let startDate = moment(report.dateFrom).add(days_page, 'day').startOf('day');
            let endDate = moment(startDate).add(report.partition - 1, 'day').endOf('day');
            if (endDate.isAfter(report.dateTo)) endDate = moment(report.dateTo).endOf('day');
            let command = `nohup java -jar ${jarFile} `
                + `"select id, Subject_ID, Sentiment_Score, Normalised_Sentiment_Score, Status_Name, DateTime_Posted, Title, Content,Subject_ID,Normalised_Voice_Influence_Score, is_article, url, channel_id,  Channel_Name, Article_ID, Comment_ID,Channel_Country, Channel_Category, Channel_Site_Type, Channel_Language, Voice_Name, Voice_URL from Ticket `
                + `where Is_Relevant=1 and client_account_id = ${report.clientId} `
                + `and DateTime_Posted between '${startDate.format('YYYY-MM-DD HH:mm:ss')}' and '${endDate.format('YYYY-MM-DD HH:mm:ss')}' `
                + `AND Subject_ID in (${report.subjectsIds}) order by id;" "socialmedia_${report.clientId}-${i + 1}-${startDate.format('YYMMMDD')}-${endDate.format('YYMMMDD')}" &`
                ;
            promises.push(command);
            i++;
        }
        return response.Resolve(promises);
    } catch (e) {
        console.error('ERROR >> Failed to retireve log file for backgen: ');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Retrive backgen log for id
 */
exports.CHECK = async function () {
    try {
        let response = new Reponse();
        let command = sshProvider.buildCommand(
            `ps -ef | grep '${jarFile}'`,
        );
        await executeSSH(command).then(res => response.Resolve(res.split('\n').filter(x => x)), err => response.Reject(err));
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to retireve log file for backgen: ' + id);
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Retrive backgen log for id
 */
exports.PURGE = async function () {
    try {
        let response = new Reponse();
        let command = sshProvider.buildCommand(
            `ps -ef | grep '${jarFile}'`,
        );
        await executeSSH(command).then(res => response.Resolve(res.split('\n').filter(x => x)), err => response.Reject(err));
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to retireve log file for backgen: ' + id);
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Retrive backgen log for id
 */
exports.BACKUP = async function () {
    try {
        let response = new Reponse();
        let command = sshProvider.buildCommand(
            `ps -ef | grep '${jarFile}'`,
        );
        await executeSSH(command).then(res => response.Resolve(res.split('\n').filter(x => x)), err => response.Reject(err));
        return response;
    } catch (e) {
        console.error('ERROR >> Failed to retireve log file for backgen: ' + id);
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Execute SSH command
 * @param {String} command 
 */
var executeSSH = async function (command) {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await sshProvider.run(configBuilder(), command).then((res) => {
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
var configBuilder = function () {
    return {
        host: '<<ipaddress>>',
        port: 22,
        username: '<<username>>',
        password: '<<password>>'
    };
}
/**
 * Core Object
 */
var Report = (function () {
    /**
     * Constructor
     */
    function Report() {
        this.clientId = null;
        this.topics = null;
        this.subjectsIds = null;
        this.dateFrom = null;
        this.dateTo = null;
        this.partition = null;
        this.dayDiff = null;
        this.fileCount = null;
        this.page = null;
    }
    /**
     * Logic to construct Report object
     * @param {*} Request 
     */
    Report.prototype.init = async function (req) {
        const _self = this;
        _self.clientId = req.clientId;
        let topics = await new adminProvider().findTopicsByClient(_self.clientId);
        if (req.excludes) {
            let e = req.excludes.split(",").filter(x => x);
            topics = topics.filter(s => !e.includes(s.ID.toString()));
        }
        _self.topics = topics.map(({ ID, Name }) => ({ ID, Name }));
        let subjects = await new adminProvider().findSubjectsByTopics(topics.map(({ ID }) => ID).join(","));
        _self.subjectsIds = subjects.map(({ ID }) => ID).join(",");
        _self.dateFrom = moment(req.dateFrom, 'YYYY-MM-DD');
        _self.dateTo = moment(req.dateTo, 'YYYY-MM-DD');
        _self.partition = req.partition || 10; // per 10 days
        _self.dayDiff = _self.dateTo.diff(_self.dateFrom, 'day') + 1;
        _self.fileCount = Math.ceil(_self.dayDiff / _self.partition);
        _self.page = Math.ceil(_self.fileCount / max_concurrent);
        if (!_self.clientId || !_self.topics || !_self.subjectsIds || !_self.dateFrom || !_self.dateTo) throw Error('Failed to construct Report');
        if (_self.dateFrom.isAfter(_self.dateTo)) throw Error('Invalid Date Range');
        return _self;
    }
    /**
     * EOF
     */
    return Report;
})();
exports.Report = Report;