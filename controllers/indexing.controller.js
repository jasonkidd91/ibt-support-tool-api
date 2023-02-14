'use strict';
/**
 * Declaration
 */
const IndexingService = require('../services/indexing.service');
/**
 * Default controller
 */
exports.DEFAULT = async function (req, res, next) {
    res.status(200).send(
        'Indexing Api workings fine!'
        + '<br>'
        + '<br>>> [DEBUG] Endpoint: <strong><u>http://localhost:9001/indexing/debug</u></strong>'
        + '<br>info: use to debug the parameter to be used in the configpatch file'
        + '<br>method: POST'
        + '<br>body parameters:'
        + '<br>{'
        + '<br>&nbsp;&nbsp;&nbsp; channels: \'101,102,103,104\''
        + '<br>&nbsp;&nbsp;&nbsp; articleId: \'1234567,1234567\''
        + '<br>&nbsp;&nbsp;&nbsp; requestDate: \'2020-01-01 12:00\''
        + '<br>&nbsp;&nbsp;&nbsp; requestDateTo: null'
        + '<br>&nbsp;&nbsp;&nbsp; days: null'
        + '<br>&nbsp;&nbsp;&nbsp; crawlDateFrom: \'2020-01-01 14:00\''
        + '<br>&nbsp;&nbsp;&nbsp; crawlDateTo: \'2020-01-01 16:00\''
        + '<br>}'
        + '<br>'
        + '<br>>> [UPDATE] Endpoint: <strong><u>http://localhost:9001/indexing/update</u></strong>'
        + '<br>info: update parameters in the configpatch file'
        + '<br>method: POST'
        + '<br>body parameters:'
        + '<br>{'
        + '<br>&nbsp;&nbsp;&nbsp; channels: \'101,102,103,104\''
        + '<br>&nbsp;&nbsp;&nbsp; articleId: null'
        + '<br>&nbsp;&nbsp;&nbsp; requestDate: \'2020-01-01 12:00\''
        + '<br>&nbsp;&nbsp;&nbsp; requestDateTo: null'
        + '<br>&nbsp;&nbsp;&nbsp; days: 120'
        + '<br>&nbsp;&nbsp;&nbsp; crawlDateFrom: \'2020-01-01 14:00\''
        + '<br>&nbsp;&nbsp;&nbsp; crawlDateTo: \'2020-01-01 16:00\''
        + '<br>}'
        + '<br>'
        + '<br>>> [VERIFY] Endpoint: <strong><u>http://localhost:9001/indexing/verify</u></strong>'
        + '<br>info: display the parameters for confirmation'
        + '<br>method: POST'
        + '<br>body parameters: { }'
        + '<br>'
        + '<br>>> [EXECUTE] Endpoint: <strong><u>http://localhost:9001/indexing/execute</u></strong>'
        + '<br>info: execute indexing process'
        + '<br>method: POST'
        + '<br>body parameters: { }'
        + '<br>'
        + '<br>>> [CHECK] Endpoint: <strong><u>http://localhost:9001/indexing/check</u></strong>'
        + '<br>info: check the log file'
        + '<br>method: POST'
        + '<br>body parameters: { filenames: {'
        + '<br>&nbsp;&nbsp;&nbsp; oneSocial: \'logpatch2_200302_1948.txt\''
        + '<br>&nbsp;&nbsp;&nbsp; socialExpress: \'logpatch2_200302_1948.txt\''
        + '<br>&nbsp;&nbsp;&nbsp; }'
        + '<br>}'
    );
}
/**
 * Controller to debug/compute the input parameters value to be used
 */
exports.DEBUG = async function (req, res, next) {
    const requestBody = req.body;
    try {
        let response = await new IndexingService.Indexing().init(requestBody);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Controller to update the parameter in the configpatch file
 */
exports.UPDATE = async function (req, res, next) {
    const requestBody = req.body;
    try {
        let indexing = await new IndexingService.Indexing().init(requestBody);
        let response = await IndexingService.UPDATE(indexing);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Controller to verify the parameter to be used in the configpatch file
 */
exports.VERIFY = async function (req, res, next) {
    try {
        let response = await IndexingService.VERIFY();
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Controller to execute indexing process
 */
exports.EXECUTE = async function (req, res, next) {
    try {
        let response = await IndexingService.EXECUTE();
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Controller to check log file
 */
exports.CHECK = async function (req, res, next) {
    const filenames = req.body.filenames;
    try {
        let response = await IndexingService.CHECK(filenames);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}