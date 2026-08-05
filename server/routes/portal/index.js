const express = require('express');

const router = express.Router();

router.use('/reference', require('./reference'));
router.use('/plans', require('./plans'));
router.use('/requests', require('./requests'));
router.use('/insights', require('./insights'));
router.use('/orgs', require('./orgs'));
router.use('/jms', require('./jms'));

module.exports = router;
