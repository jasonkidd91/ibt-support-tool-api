'use strict';
/**
 * Declaration
 */
const mysql = require('mysql');
const pool = mysql.createPool({
    connectionLimit: 15, //important
    host: '<<dbaddress>>',
    user: '<<username>>',
    password: '<<password>>',
    database: '<<dbname>>',
    debug: false
});
/**
 * Constructor
 */
var AdminProvider = function () { }
/**
 * Functions
 */
AdminProvider.prototype = {
    findClientByNameLike: async function (name_query) { return await query(`select * from Client_Account where name like '${name_query}'`); },
    findTopicsByClient: async function (clientId) { return await query(`select * from Topic where Client_Account_ID = ${clientId} order by Name`); },
    findSubjectsByTopics: async function (topicIds) { return await query(`select * from Subject where Topic_ID in (${topicIds}) order by Name`); },
}
/**
 * Shared function to execute mysql query
 * @param {String} q 
 */
var query = async function (q) {
    return new Promise((resolve, reject) => {

        pool.on('acquire', function (connection) {
            console.log('[ADMIN] :: Connection %d acquired', connection.threadId);
        });
        pool.on('connection', function (connection) {
            console.log('[ADMIN] :: query = ' + q);
            // connection.query('SET SESSION auto_increment_increment=1')
        });
        pool.on('enqueue', function () {
            console.log('[ADMIN] :: Waiting for available connection slot');
        });
        pool.on('release', function (connection) {
            console.log('[ADMIN] :: Connection %d released', connection.threadId);
        });
        pool.getConnection(function (err, connection) {
            try {
                if (err) throw err;
                connection.query(q, function (error, results, fields) {
                    connection.release();
                    if (!error) resolve(results);
                    else throw error;
                });
            } catch (err) {
                console.error('[ADMIN] :: error');
                console.error('Cause: \n\t' + err);
                reject(err);
            }
        });
        // pool.end(function (err) {
        //     // all connections in the pool have ended
        // });
    });
}
module.exports = AdminProvider;