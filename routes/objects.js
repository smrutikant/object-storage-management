const express = require('express');
const router = express.Router();
const objectController = require('../controllers/objectController');

// Show upload form
router.get('/upload', objectController.showUploadForm);

// Upload an object
router.post('/upload', objectController.uploadObject);

// Download an object
router.get('/:bucketName/:key/download', objectController.downloadObject);

// Delete an object
router.delete('/:bucketName/:key', objectController.deleteObject);

router.post('/:bucketName/:key', objectController.filAction);

// Generate a signed URL
router.get('/:bucketName/:key/share', objectController.generateSignedUrl);

// View object details
router.get('/:bucketName/:key', objectController.showObjectDetails);

// Create a folder
router.post('/:bucketName/folder', objectController.createFolder);

// Batch delete objects
router.post('/:bucketName/batch-delete', objectController.batchDeleteObjects);

module.exports = router;