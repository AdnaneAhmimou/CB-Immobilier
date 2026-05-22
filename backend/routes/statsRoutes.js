const express = require('express');
const { getStats, getFinances } = require('../controllers/statsController');
const router = express.Router();

router.get('/',         protect, getStats);
router.get('/finances', protect, getFinances);

module.exports = router;
