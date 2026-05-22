const express = require('express');
const c = require('../controllers/transactionController');
const router = express.Router();


router.get('/', c.getAllTransactions);
router.post('/', c.createTransaction);
router.patch('/:id',  c.updateTransaction);
router.delete('/:id', c.deleteTransaction);

module.exports = router;
