const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const indexRoutes = require('./routes/index');
const bucketRoutes = require('./routes/buckets');
const objectRoutes = require('./routes/objects');

// Initialize Express app
const app = express();

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(morgan('dev')); // Logging
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method')); // Support PUT/DELETE in forms
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB limit
  },
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Make S3 config available to templates
app.use((req, res, next) => {
  res.locals.s3Endpoint = process.env.S3_ENDPOINT;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/buckets', bucketRoutes);
app.use('/objects', objectRoutes);

// Error handling
app.use((req, res, next) => {
  res.status(404).render('error', { 
    title: 'Page Not Found',
    message: 'The page you requested could not be found.',
    error: { status: 404 }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', { 
    title: 'Error',
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});


app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit per file
    files: 10, // Maximum 10 files per upload
  },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`S3 Bucket Manager running on port ${PORT}`);
});

module.exports = app;