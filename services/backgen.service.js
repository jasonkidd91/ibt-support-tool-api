'use strict';
/**
 * Declaration
 */
const sshProvider = require('../providers/ssh.provider');
const Reponse = require('../core/response');
/**
 * Trigger backgen for id
 */
exports.TRIGGER = async function (id) {
    try {
        let command = sshProvider.buildCommand(
            '/brandtology/tickets_generator',
            `nohup run-auto-ticket-generator-forclient.sh ${id} &`
        );
        executeSSH(command);
        return await this.TRIGGER_LOG(id);
    } catch (e) {
        console.error('ERROR >> Failed to trigger backgen');
        console.error('Cause:', e);
        throw e;
    }
}
/**
 * Retrive backgen log for id
 */
exports.TRIGGER_LOG = async function (id) {
    try {
        let response = new Reponse();
        let command = sshProvider.buildCommand(
            '/brandtology/tickets_generator/autoTGForClientLogs',
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