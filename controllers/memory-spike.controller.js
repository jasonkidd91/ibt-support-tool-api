'use strict';
/**
 * Declaration
 */
const MemorySpike = require('../core/memory-spike')
/**
 * Default controller
 */
exports.DEFAULT = async function (req, res, next) {
    res.status(200).send(
        'Memory Spike Api workings fine!'
        + '<br>'
        + '<br>Info:'
        + '<br>Article Comment - port:8981-8982; host:192.168.51.71-192.168.51.78'
        + '<br>Ticket - port:8984-8985; host:192.168.50.71, 192.168.51.72, 192.168.51.74, 192.168.51.75'
        + '<br>Others Ticket (Just Restart) - port:8989; host:192.168.50.72'
        + '<br>'
        + '<br>>> Manual Endpoint: <strong><u>http://localhost:9001/spike/step/:step</u></strong>'
        + '<br>[Step 1] - move data import properties to tmp folder'
        + '<br>[Step 2] - data sync'
        + '<br>[Step 3] - stop server'
        + '<br>[Step 4] - start server'
        + '<br>[Step 5] - restore data import properties back to original folder'
        + '<br>'
        + '<br>>> Automate Endpoint: <strong><u>http://localhost:9001/spike/auto</u></strong>'
        + '<br>'
        + '<br>>> Debug Endpoint: <strong><u>http://localhost:9001/spike/debug</u></strong>'
        + '<br>'
        + '<br>Sample Request 1:'
        + '<br>request url <u>http://localhost:9001/spike/step/1</u>'
        + '<br>method POST'
        + '<br>body parameters { core: "ac1", port: 8981, host: \'192.168.51.71\', config: { execution: false, propertiesCore: ["ac1", "ac2"]} }'
        + '<br>'
        + '<br>Sample Request 2:'
        + '<br>request url <u>http://localhost:9001/spike/auto</u>'
        + '<br>method POST'
        + '<br>body parameters { core: "ac1", port: null, host: null, config: null }'
        + '<br>'
        + '<br>Sample Request 3:'
        + '<br>request url <u>http://localhost:9001/spike/debug</u>'
        + '<br>method POST'
        + '<br>body parameters { core: "ac1", port: null, host: null, config: null }'
    );
}
/**
 * Controller to debug/compute the input parameters value to be used
 */
exports.DEBUG = async function (req, res, next) {
    const core = req.body.core;
    const port = req.body.port;
    const host = req.body.host;
    const config = req.body.config;
    try {
        let response = new MemorySpike(core, port, host, config);
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Manual controller to execute ssh command
 */
exports.MANUAL = async function (req, res, next) {
    const step = req.params.step;
    const core = req.body.core;
    const port = req.body.port;
    const host = req.body.host;
    const config = req.body.config;
    var response;
    try {
        let $q = new MemorySpike(core, port, host, config);
        if (step == 1) {
            response = await $q.moveFile();
        } else if (step == 2) {
            response = await $q.dataSync();
        } else if (step == 3) {
            response = await $q.stopServer();
        } else if (step == 4) {
            response = await $q.startServer();
        } else if (step == 5) {
            response = await $q.restoreFile();
        } else {
            throw Error('Invalid Step!');
        }
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
/**
 * Automate controller to execute ssh command
 */
exports.AUTOMATE = async function (req, res, next) {
    const core = req.body.core;
    const port = req.body.port;
    const host = req.body.host;
    const config = req.body.config;
    try {
        let $q = new MemorySpike(core, port, host, config);
        let response = await $q.automate();
        return res.status(200).json({ status: 200, data: response, message: "Succesful!" });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}