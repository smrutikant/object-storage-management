const express = require('express');
const router = express.Router();
const bucketController = require('../controllers/bucketController');

// List all buckets
router.get('/', bucketController.listBuckets);

// Show create bucket form
router.get('/create', bucketController.showCreateForm);

// Create a bucket
router.post('/create', bucketController.createBucket);

// Delete a bucket
router.delete('/:bucketName', bucketController.deleteBucket);

// List objects in a bucket
router.get('/:bucketName/objects', bucketController.bucketDetails);

module.exports = router;