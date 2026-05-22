const express = require('express');
const c = require('../controllers/bienTypeController');
const router = express.Router();


router.get('/', c.getAllBienTypes);
router.post('/', c.createBienType);

module.exports = router;
