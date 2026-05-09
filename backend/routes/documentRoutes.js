
const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

const router = express.Router();
router.use(authMiddleware.protect);

router.route('/')
    .get(documentController.getAllDocuments);

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
