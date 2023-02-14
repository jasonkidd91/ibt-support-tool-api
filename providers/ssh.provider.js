'use strict';
var Client = require('ssh2').Client;

class SshProvider {
    /**
     * 
     * @param {*} config 
     * @param {String} command 
     */
    static async run(config, command) {
        const log = {
            info: function (msg) {
                console.log(msg)
            },
            error: function (msg) {
                console.error(msg);
            }
        }
        const conn = new Client();
        return new Promise((resolve, reject) => {
            let logs = '';
            conn.on('ready', function () {
                log.info('[SSH Client] :: ready');
                log.info('[SSH Command] :: ' + command);
                try {
                    if (!command) throw Error('Invalid Command');
                    conn.exec(command, function (err, stream) {
                        if (err) throw err;
                        stream.on('close', function (code, signal) {
                            log.info('[SSH Stream] :: close :: code: ' + code + ', signal: ' + signal);
                            log.info('[SSH Client] :: close');
                            conn.end();
                            resolve(logs);
                        }).on('data', function (data) {
                            log.info('Output: \n' + data);
                            logs += data;
                        }).stderr.on('data', function (data) {
                            log.info('OUTPUT: \n' + data);
                            logs += data;
                        });
                    });
                } catch (e) {
                    log.error('[SSH Client] :: error');
                    log.error('Cause: \n\t' + e);
                    reject(e);
                }
            }).on('error', function (err) {
                log.error('[SSH Client] :: error');
                log.error('Cause: \n\t' + err);
                reject(err);
            }).connect(config);
        });
    }
    /**
     * ssh command builder
     * @param  {...any} args 
     */
    static buildCommand(...args) {
        return args.join(' && ');
    }
}

module.exports = SshProvider;