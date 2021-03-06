'use strict';

var express = require('express');
var controller = require('./books.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/search', controller.ajaxSearch);
router.get('/:id', controller.show);
router.get('/:contentSearchMonth/:contentSearchYear', controller.contentSearchStatistics);
router.get('/contentType/:contentTypeSearchMonth/:contentTypeSearchYear', controller.contentTypeSearchStatistics);
router.post('/', controller.create);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);

module.exports = router;
