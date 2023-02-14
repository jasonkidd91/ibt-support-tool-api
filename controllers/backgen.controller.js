'use strict';
/**
 * Declaration
 */
const backgenService = require('../services/backgen.service');
/**
 * Default controller
 */
exports.DEFAULT = async function (req, res, next) {
    res.status(200).send(
        'Backgen Api workings fine!'
        + '<br>'
        + '<br>>> [Trigger] Endpoint: <strong><u>http://localhost:9001/backgen/trigger</u></strong>'
        + '<br>info: trigger the backgen of id'
        + '<br>method: POST'
        + '<br>body parameters:'
        + '<br>{'
        + '<br>&nbsp;&nbsp;&nbsp; id: 1234567'
        + '<br>}'
        + '<br>'
        + '<br>>> [Trigger Log] Endpoint: <strong><u>http://localhost:9001/backgen/trigger/log</u></strong>'
        + '<br>info: check the triggered backgen log of id'
        + '<br>method: POST'
        + '<br>body parameters:'
        + '<br>{'
        + '<br>&nbsp;&nbsp;&nbsp; id: 1234567'
        + '<br>}'
    );
}
/**
 * Controller to trigger backgen
 */
exports.TRIGGER = async function (req, res, next) {
    const id = req.body.id;
    try {
        let response = await backgenService.TRIGGER(id);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Controller to check triggered backgen log
 */
exports.TRIGGER_LOG = async function (req, res, next) {
    const id = req.body.id;
    try {
        let response = await backgenService.TRIGGER_LOG(id);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}