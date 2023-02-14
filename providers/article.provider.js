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
var ArticleProvider = function () { }
/**
 * Functions
 */
ArticleProvider.prototype = {
    findArticleById: async function (id) { return await query(`select * from Article where id = ${id} limit 1`).then(res => res[0]); }
}
/**
 * Shared function to execute mysql query
 * @param {String} q 
 */
var query = async function (q) {
    return new Promise((resolve, reject) => {

        pool.on('acquire', function (connection) {
            console.log('[ARTICLE] :: Connection %d acquired', connection.threadId);
        });
        pool.on('connection', function (connection) {
            console.log('[ARTICLE] :: query = ' + q);
            // connection.query('SET SESSION auto_increment_increment=1')
        });
        pool.on('enqueue', function () {
            console.log('[ARTICLE] :: Waiting for available connection slot');
        });
        pool.on('release', function (connection) {
            console.log('[ARTICLE] :: Connection %d released', connection.threadId);
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
                console.error('[ARTICLE] :: error');
                console.error('Cause: \n\t' + err);
                reject(err);
            }
        });
        // pool.end(function (err) {
        //     // all connections in the pool have ended
        // });
    });
}
module.exports = ArticleProvider;