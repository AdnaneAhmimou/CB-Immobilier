const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getAllAgents, updateAgent } = require('../controllers/agentController');

const router = express.Router();
router.use(protect);

router.get('/',     getAllAgents);
router.patch('/:id', updateAgent);

module.exports = router;
