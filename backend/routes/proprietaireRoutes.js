const express = require('express');
const proprietaireController = require('../controllers/proprietaireController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(authMiddleware.protect);

router.route('/').get(proprietaireController.getAllProprietaires).post(proprietaireController.createProprietaire);
router.route('/:id').patch(proprietaireController.updateProprietaire).delete(proprietaireController.deleteProprietaire);

module.exports = router;
