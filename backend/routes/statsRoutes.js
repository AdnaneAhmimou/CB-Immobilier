const express = require('express');
const { getStats, getFinances } = require('../controllers/statsController');
const router = express.Router();

router.get('/',         getStats);
router.get('/finances', getFinances);

module.exports = router;
