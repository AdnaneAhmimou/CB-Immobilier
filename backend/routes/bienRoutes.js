const express = require('express');
const bienController = require('../controllers/bienController');

const router = express.Router();

// Public — no auth required
router.get('/public', bienController.getPublicBiens);


router.route('/').get(bienController.getAllBiens).post(bienController.createBien);
router.route('/:id').get(bienController.getBien).patch(bienController.updateBien).delete(bienController.deleteBien);

module.exports = router;
