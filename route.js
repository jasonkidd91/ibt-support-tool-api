'use strict';
/**
 * Declartion
 */
const express = require('express');
const router = express.Router();
/**
 * Memory Spike Routes
 */
const SpikeController = require('./controllers/memory-spike.controller');
router.get('/spike', SpikeController.DEFAULT)
    .post('/spike/debug', SpikeController.DEBUG)
    .post('/spike/step/:step', SpikeController.MANUAL)
    .post('/spike/auto', SpikeController.AUTOMATE);
/**
 * Indexing Routes
 */
const IndexingController = require('./controllers/indexing.controller');
router.get('/indexing', IndexingController.DEFAULT)
    .post('/indexing/debug', IndexingController.DEBUG)
    .post('/indexing/update', IndexingController.UPDATE)
    .post('/indexing/verify', IndexingController.VERIFY)
    .post('/indexing/execute', IndexingController.EXECUTE)
    .post('/indexing/check', IndexingController.CHECK);
/**
 * Backgen
 */
const BackgenController = require('./controllers/backgen.controller');
router.get('/backgen', BackgenController.DEFAULT)
    .post('/backgen/trigger', BackgenController.TRIGGER)
    .post('/backgen/trigger/log', BackgenController.TRIGGER_LOG);
/**
 * Solr Data Purge Routes
 */
const PurgeController = require('./controllers/solr-purge.controller');
router.get('/purge', PurgeController.DEFAULT)
    .post('/purge/debug', PurgeController.DEBUG)
    .post('/purge/step/:step', PurgeController.MANUAL)
    .post('/purge/auto', PurgeController.AUTOMATE);
/**
 * Manual Report Routes
 */
const ManualReportController = require('./controllers/manual-report.controller');
router.post('/report/clients', ManualReportController.CLIENTS)
    .post('/report/debug', ManualReportController.DEBUG)
    .post('/report/trigger', ManualReportController.TRIGGER)
    .post('/report/manual', ManualReportController.MANUAL)
    .post('/report/check', ManualReportController.CHECK);
/**
 * EOF
 */
module.exports = router;