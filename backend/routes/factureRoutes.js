const express = require('express');
const factureController = require('../controllers/factureController');

const router = express.Router();

router.route('/')
    .get(factureController.getAllFactures)
    .post(factureController.createFacture);

router.route('/:id')
    .get(factureController.getFactureById)
    .delete(factureController.deleteFacture);

module.exports = router;
