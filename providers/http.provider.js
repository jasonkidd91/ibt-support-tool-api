'use strict';
const https = require('https');
const http = require('http');

var HttpProvider = function (url) {
    this.url = url || null;
}

HttpProvider.prototype = {
    get: async function () {
        return new Promise((resolve, reject) => {
            http.get(this.url, (resp) => {
                console.log(`http called with status ${resp.statusCode}`);
                let data = '';

                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    // console.log(data);
                    if (resp.statusCode == 200) {
                        resolve(data);
                    } else {
                        reject(`statusCode: ${resp.statusCode}, url: ${this.url}`);
                    }
                });

            }).on("error", (err) => {
                reject(err);
                console.log("Error: " + err.message);
            });
        });
    }
}

module.exports = HttpProvider;