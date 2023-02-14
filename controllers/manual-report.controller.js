'use strict';
/**
 * Declaration
 */
const reportService = require('../services/manual-report.service');
/**
 * Default controller
 */
exports.DEFAULT = async function (req, res, next) {
    res.status(200).send(
        'Solr Data Purge Api workings fine!'
        + '<br>'
        + '<br>Info:'
        + '<br><strong>*PS</strong> - Purge Service doesn\'t cover the step of restart workbench server solr@192.168.51.81'
        + '<br>'
        + '<br>>> Manual Endpoint: <strong><u>http://localhost:9001/purge/step/:step</u></strong>'
        + '<br>[Step 1] - run archiver'
        + '<br>[Step 1.1] - archiver verification and update if required'
        + '<br>[Step 2] - stop target server'
        + '<br>[Step 3] - update data import file'
        + '<br>[Step 3.1] - data import file verification and update if required'
        + '<br>[Step 4] - resume target server'
        + '<br>'
        + '<br>>> Automate Endpoint: <strong><u>http://localhost:9001/purge/auto</u></strong>'
        + '<br>'
        + '<br>Sample Request 1:'
        + '<br>request url <u>http://localhost:9001/purge/step/1</u>'
        + '<br>method POST'
        + '<br>body parameters { config: { updateOnVerify: false, updateOnDataImport: false }'
        + '<br>'
        + '<br>Sample Request 2:'
        + '<br>request url <u>http://localhost:9001/purge/auto</u>'
        + '<br>method POST'
        + '<br>body parameters { }'
    );
}
/**
 * Clients controller
 */
exports.CLIENTS = async function (req, res, next) {
    const nameQuery = req.body.nameQuery;
    try {
        const response = await reportService.CLIENTS(nameQuery);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Debug controller
 */
exports.DEBUG = async function (req, res, next) {
    const reqBody = req.body;
    try {
        const response = await new reportService.Report().init(reqBody);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Debug controller
 */
exports.TRIGGER = async function (req, res, next) {
    const reqBody = req.body;
    try {
        const report = await new reportService.Report().init(reqBody);
        const response = await reportService.TRIGGER(report);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Debug controller
 */
exports.MANUAL = async function (req, res, next) {
    const reqBody = req.body;
    try {
        const report = await new reportService.Report().init(reqBody);
        const response = await reportService.MANUAL(report);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Check processes controller
 */
exports.CHECK = async function (req, res, next) {
    try {
        const response = await reportService.CHECK();
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Manual controller to execute ssh command
 */
// exports.MANUAL = async function (req, res, next) {
//     const step = req.params.step;
//     const config = req.body.config;
//     var response;
//     try {
//         const purge = new purgeService.Purge(config);
//         if (step == 1) {
//             response = await purgeService.ARCHIVER(purge);
//         } else if (step == 1.1) {
//             response = await purgeService.ARCHIVER_VERIFIER(purge);
//         } else if (step == 2) {
//             response = await purgeService.STOP_TARGET(purge);
//         } else if (step == 3) {
//             response = await purgeService.DATAIMPORT(purge);
//         } else if (step == 3.1) {
//             response = await purgeService.DATAIMPORT_VERIFIER(purge);
//         } else if (step == 4) {
//             response = await purgeService.RESUME_TARGET(purge);
//         } else {
//             throw Error('Invalid Step!');
//         }
//         return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
//     } catch (e) {
//         return res.status(400).json({ status: 400, message: e.message });
//     }
// }
/**
 * Automate controller to execute ssh command
 */
exports.AUTOMATE = async function (req, res, next) {
    try {
        const purge = new purgeService.Purge(undefined);
        let response = purgeService.AUTOMATE(purge);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}