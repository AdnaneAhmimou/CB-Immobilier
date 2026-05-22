const express = require('express');
const { getAllAgents, updateAgent } = require('../controllers/agentController');

const router = express.Router();


router.get('/',     getAllAgents);
router.patch('/:id', updateAgent);

module.exports = router;
