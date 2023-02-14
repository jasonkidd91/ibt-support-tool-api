var winston = require('winston');
var logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;