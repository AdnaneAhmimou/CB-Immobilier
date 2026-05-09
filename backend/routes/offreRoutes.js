const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const c = require('../controllers/offreController');
const router = express.Router();

router.use(protect);
router.get('/', c.getAllOffres);
router.post('/', c.createOffre);
router.patch('/:id', c.updateOffre);
router.delete('/:id', c.deleteOffre);

module.exports = router;
