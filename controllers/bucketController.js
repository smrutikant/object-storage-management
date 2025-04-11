const s3Service = require('../services/s3Service');

/**
 * Display a list of all buckets
 */
exports.listBuckets = async (req, res, next) => {
  try {
    const buckets = await s3Service.listBuckets();
    res.render('buckets/list', { 
      title: 'S3 Buckets',
      buckets: buckets,
      messages: req.query.message ? { success: decodeURIComponent(req.query.message) } : {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Show bucket creation form
 */
exports.showCreateForm = (req, res) => {
  res.render('buckets/create', { 
    title: 'Create Bucket',
    messages: {}
  });
};

/**
 * Create a new bucket
 */
exports.createBucket = async (req, res, next) => {
  try {
    const { bucketName } = req.body;
    
    if (!bucketName) {
      return res.render('buckets/create', { 
        title: 'Create Bucket',
        messages: { error: 'Bucket name is required' }
      });
    }
    
    await s3Service.createBucket(bucketName);
    
    res.redirect('/buckets?message=' + encodeURIComponent(`Bucket "${bucketName}" created successfully`));
  } catch (error) {
    res.render('buckets/create', { 
      title: 'Create Bucket',
      messages: { error: `Failed to create bucket: ${error.message}` }
    });
  }
};


/**
 * Create a folder (zero-byte object with trailing slash)
 */
exports.createFolder = async (req, res, next) => {
    try {
      const { bucketName } = req.params;
      const { key } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'Folder key is required' });
      }
      
      // Ensure key ends with a slash
      const folderKey = key.endsWith('/') ? key : key + '/';
      
      // Create empty object with folder key
      await s3Service.uploadObject(bucketName, { 
        data: Buffer.from(''), 
        mimetype: 'application/x-directory',
        size: 0
      }, folderKey);
      
      res.json({ success: true, message: 'Folder created successfully', key: folderKey });
    } catch (error) {
      console.error(`Error creating folder:`, error);
      res.status(500).json({ error: error.message });
    }
  };
  
/**
 * Delete a bucket
 */
exports.deleteBucket = async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    
    await s3Service.deleteBucket(bucketName);
    
    res.redirect('/buckets?message=' + encodeURIComponent(`Bucket "${bucketName}" deleted successfully`));
  } catch (error) {
    next(error);
  }
};


// Add these helper functions at the top of bucketController.js
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}


/**
 * Show bucket details with objects list
 */
exports.bucketDetails = async (req, res, next) => {
  try {
    const buckets = await s3Service.listBuckets();
    const { bucketName } = req.params;
    const prefix = req.query.prefix || '';
    
    const objects = await s3Service.listObjects(bucketName, prefix);
    
    // Process the objects to create folders and files
    const folders = new Set();
    const files = [];
    
    objects.forEach(obj => {
      const key = obj.Key;
      
      // Skip the current prefix itself
      if (key === prefix) {
        return;
      }
      
      // If not in root and doesn't start with prefix, skip
      if (prefix && !key.startsWith(prefix)) {
        return;
      }
      
      // Remove prefix from the start
      const relativeKey = prefix ? key.substring(prefix.length) : key;
      
      // If it has a trailing slash or contains a slash, it's a folder or in a subfolder
      if (relativeKey.endsWith('/')) {
        // It's a direct folder
        folders.add(relativeKey);
      } else if (relativeKey.includes('/')) {
        // It's a file in a subfolder, add the subfolder
        const folderPath = relativeKey.substring(0, relativeKey.indexOf('/') + 1);
        folders.add(folderPath);
      } else {
        // It's a file in the current directory
        files.push({
          key: key,
          name: relativeKey,
          size: obj.Size,
          lastModified: obj.LastModified,
          publicUrl: s3Service.getPublicUrl(bucketName, key)
        });
      }
    });
    
    // Convert folders Set to Array for template
    const folderList = Array.from(folders).map(folder => {
      return {
        name: folder,
        path: prefix + folder
      };
    });
    
    console.log(buckets, "Buckets");
    res.render('objects/list', { 
      bucketList:buckets,
      title: `Bucket: ${bucketName}`,
      bucketName: bucketName,
      prefix: prefix,
      folders: folderList,
      files: files,
      messages: req.query.message ? { success: decodeURIComponent(req.query.message) } : {},
      breadcrumbs: getBreadcrumbs(prefix),
      formatFileSize: formatFileSize,  
      formatDate: formatDate          
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to generate breadcrumbs from prefix
 */
function getBreadcrumbs(prefix) {
  if (!prefix) {
    return [];
  }
  
  const parts = prefix.split('/');
  const breadcrumbs = [];
  let currentPath = '';
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      currentPath += parts[i] + '/';
      breadcrumbs.push({
        name: parts[i],
        path: currentPath
      });
    }
  }
  
  return breadcrumbs;
}

module.exports = exports;