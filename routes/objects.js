const express = require('express');
const router = express.Router();
const objectController = require('../controllers/objectController');

// Show upload form
router.get('/upload', objectController.showUploadForm);

// Upload an object
router.post('/upload', objectController.uploadObject);

// Create a folder
router.post('/:bucketName/folder', objectController.createFolder);

//Delete a folder
router.post('/:bucketName/delete-folder', objectController.deleteFolder);

// Batch delete objects
router.post('/:bucketName/batch-delete', objectController.batchDeleteObjects);

// Move objects
router.post('/:bucketName/move-objects', objectController.moveObject);

// Generate a signed URL
router.get('/:bucketName/:key/share', objectController.generateSignedUrl);

// Download an object
router.get('/:bucketName/:key/download', objectController.downloadObject);

// View object details
router.get('/:bucketName/:key', objectController.showObjectDetails);

// Delete an object
router.delete('/:bucketName/:key', objectController.deleteObject);

// File action route
router.post('/:bucketName/:key', objectController.fileAction);

module.exports = router;