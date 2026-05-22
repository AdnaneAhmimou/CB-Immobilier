const express = require('express');
const c = require('../controllers/visiteController');
const router = express.Router();


router.get('/', c.getAllVisites);
router.post('/', c.createVisite);
router.patch('/:id', c.updateVisite);
router.delete('/:id', c.deleteVisite);

module.exports = router;
