'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

global.logger = require('./logger');

app.use(function allowCrossDomain(req, res, next) {
    // var origin = req.headers.origin;

    // if (process.env.NODE_ENV !== 'production') {
    //     //This is done for sub domain for ex www.dev.storyview.mediaportal.com 
    //     //or www.uat.storyview.mediaportal.com
    //     if (origin && origin.match(".mediaportal.com")) {
    //         allowedOrigins.push(origin);
    //     }
    // }

    // if (allowedOrigins.indexOf(origin) > -1) {
    //     res.setHeader('Access-Control-Allow-Origin', origin);
    // }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Expose-Headers', 'x-refresh-token');

    res.connection.setTimeout(0);

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(function nocache(req, res, next) {
    res.setHeader('Surrogate-Control', 'no-store')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    next()
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Api working fine!!')
})

var routes = require('./route'); //importing route
app.use(routes); //register the route

app.use(function (req, res) {
    res.status(404).send({ url: req.originalUrl + ' not found' })
});

var port = process.env.PORT || 9001;
app.listen(port, () => {
    logger.info(`server running at port ${port}`);
});