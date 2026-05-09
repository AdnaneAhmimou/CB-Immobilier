const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const c = require('../controllers/transactionController');
const router = express.Router();

router.use(protect);
router.get('/', c.getAllTransactions);
router.post('/', c.createTransaction);
router.patch('/:id',  c.updateTransaction);
router.delete('/:id', c.deleteTransaction);

module.exports = router;
