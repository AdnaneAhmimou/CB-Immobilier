const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const c = require('../controllers/bienTypeController');
const router = express.Router();

router.use(protect);
router.get('/', c.getAllBienTypes);
router.post('/', c.createBienType);

module.exports = router;
