const express = require('express');
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(authMiddleware.protect);

router.route('/').get(clientController.getAllClients).post(clientController.createClient);
router.route('/:id').patch(clientController.updateClient).delete(clientController.deleteClient);

module.exports = router;
