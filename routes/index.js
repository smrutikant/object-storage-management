const express = require('express');
const router = express.Router();
const bucketController = require('../controllers/bucketController');

// Main dashboard page - display buckets
router.get('/', (req, res) => {
  res.redirect('/buckets');
});

module.exports = router;