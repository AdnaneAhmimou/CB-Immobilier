
const express = require('express');
const documentController = require('../controllers/documentController');
const { upload } = require('../middlewares/uploadMiddleware');

const router = express.Router();


router.route('/')
    .get(documentController.getAllDocuments);

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
