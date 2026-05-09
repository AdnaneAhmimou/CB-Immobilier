const express = require('express');
const bienController = require('../controllers/bienController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(authMiddleware.protect);

router.route('/').get(bienController.getAllBiens).post(bienController.createBien);
router.route('/:id').get(bienController.getBien).patch(bienController.updateBien).delete(bienController.deleteBien);

module.exports = router;
