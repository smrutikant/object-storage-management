const s3Service = require('../services/s3Service');
const path = require('path');

/**
 * Show object upload form
 */
exports.showUploadForm = (req, res) => {
  const { bucketName, prefix } = req.query;
  
  if (!bucketName) {
    return res.redirect('/buckets');
  }
  
  res.render('objects/upload', { 
    title: 'Upload Object',
    bucketName,
    prefix: prefix || '',
    messages: {}
  });
};

/**
 * Upload an object to a bucket
 */
// exports.uploadObject = async (req, res, next) => {
//   try {
//     const { bucketName, prefix } = req.body;
    
//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.render('objects/upload', { 
//         title: 'Upload Object',
//         bucketName,
//         prefix: prefix || '',
//         messages: { error: 'No files were uploaded' }
//       });
//     }
    
//     const file = req.files.file;
    
//     // Create the full key with the prefix if it exists
//     const objectKey = prefix 
//       ? `${prefix}${file.name}` 
//       : file.name;
    
//     await s3Service.uploadObject(bucketName, file, objectKey);
    
//     // Redirect back to bucket contents
//     const redirectUrl = `/buckets/${bucketName}/objects?` + 
//       (prefix ? `prefix=${encodeURIComponent(prefix)}&` : '') + 
//       `message=${encodeURIComponent(`File "${file.name}" uploaded successfully`)}`;
    
//     res.redirect(redirectUrl);
//   } catch (error) {
//     res.render('objects/upload', { 
//       title: 'Upload Object',
//       bucketName: req.body.bucketName,
//       prefix: req.body.prefix || '',
//       messages: { error: `Upload failed: ${error.message}` }
//     });
//   }
// };


/**
 * Upload multiple objects to a bucket
 */
exports.uploadObject = async (req, res, next) => {
  try {
    const { bucketName, prefix } = req.body;
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.render('objects/upload', { 
        title: 'Upload Files',
        bucketName,
        prefix: prefix || '',
        messages: { error: 'No files were uploaded' }
      });
    }
    
    // Handle multiple files
    let files = [];
    let uploadCount = 0;
    let errors = [];
    
    // Check if files is an array (multiple files) or a single file
    if (Array.isArray(req.files.files)) {
      files = req.files.files;
    } else {
      // Single file was uploaded, put it in an array for consistent processing
      files = [req.files.files];
    }
    
    // Process each file
    for (const file of files) {
      try {
        // Create the full key with the prefix if it exists
        const objectKey = prefix 
          ? `${prefix}${file.name}` 
          : file.name;
        
        await s3Service.uploadObject(bucketName, file, objectKey);
        uploadCount++;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({ name: file.name, error: error.message });
      }
    }
    
    // Create status message
    let message;
    if (uploadCount === 0) {
      message = 'All uploads failed';
    } else if (errors.length === 0) {
      message = uploadCount === 1 
        ? `File uploaded successfully` 
        : `${uploadCount} files uploaded successfully`;
    } else {
      message = `${uploadCount} of ${files.length} files uploaded successfully`;
    }
    
    // Redirect back to bucket contents
    const redirectUrl = `/buckets/${bucketName}/objects?` + 
      (prefix ? `prefix=${encodeURIComponent(prefix)}&` : '') + 
      `message=${encodeURIComponent(message)}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    res.render('objects/upload', { 
      title: 'Upload Files',
      bucketName: req.body.bucketName,
      prefix: req.body.prefix || '',
      messages: { error: `Upload failed: ${error.message}` }
    });
  }
};


/**
 * Download an object
 */
exports.downloadObject = async (req, res, next) => {
  try {
    const { bucketName, key } = req.params;
    
    const decodedKey = decodeURIComponent(key);
    const data = await s3Service.getObject(bucketName, decodedKey);
    
    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(decodedKey)}"`);
    
    if (data.ContentType) {
      res.setHeader('Content-Type', data.ContentType);
    }
    
    if (data.ContentLength) {
      res.setHeader('Content-Length', data.ContentLength);
    }
    
    res.send(data.Body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an object
 */
exports.deleteObject = async (req, res, next) => {
  try {
    const { bucketName, key } = req.params;
    const { prefix } = req.query;
    
    const decodedKey = decodeURIComponent(key);
    await s3Service.deleteObject(bucketName, decodedKey);
    
    // Redirect back to bucket contents
    const redirectUrl = `/buckets/${bucketName}/objects?` + 
      (prefix ? `prefix=${encodeURIComponent(prefix)}&` : '') + 
      `message=${encodeURIComponent(`Object "${path.basename(decodedKey)}" deleted successfully`)}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

async function actionDeleteObject(bucketName,key,prefix) {
  try{
    const decodedKey = decodeURIComponent(key);
    await s3Service.deleteObject(bucketName, decodedKey);
    return decodedKey;
  }catch(error){
    throw error
  }
}

exports.fileAction = async(req, res, next) => {
  try{
    const { bucketName, key } = req.params;
    const { prefix } = req.query;
    const action = req.body['_method'];
    if(action === 'DELETE'){
      const decodedKey = await actionDeleteObject(bucketName,key,prefix);
      const redirectUrl = `/buckets/${bucketName}/objects?` + 
      (prefix ? `prefix=${encodeURIComponent(prefix)}&` : '') + 
      `message=${encodeURIComponent(`Object "${path.basename(decodedKey)}" deleted successfully`)}`;
      res.redirect(redirectUrl);
    }else{
      res.redirect("Invalid request");
    }
  }catch(error){
    next(error);
  }
}

/**
 * Generate a pre-signed URL for an object
 */
exports.generateSignedUrl = async (req, res, next) => {
  try {
    const { bucketName, key } = req.params;
    const { expiresIn } = req.query;
    
    const expires = parseInt(expiresIn) || 3600; // Default 1 hour
    const decodedKey = decodeURIComponent(key);
    const url = s3Service.getSignedUrl(bucketName, decodedKey, expires);
    
    res.render('objects/share', {
      title: 'Share Object',
      bucketName,
      objectKey: decodedKey,
      objectName: path.basename(decodedKey),
      signedUrl: url,
      expiresIn: expires,
      publicUrl: s3Service.getPublicUrl(bucketName, decodedKey)
    });
  } catch (error) {
    next(error);
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
 * Batch delete multiple objects
 */
exports.batchDeleteObjects = async (req, res, next) => {
    try {
      const { bucketName } = req.params;
      const { keys, prefix } = req.body;

      if (!keys || !Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({ error: 'No keys provided for deletion' });
      }
      
      
      const results = [];
      const errors = [];
      
      for (const key of keys) {
        try {
          await s3Service.deleteObject(bucketName, key);
          results.push({ key, deleted: true });
        } catch (error) {
          errors.push({ key, error: error.message });
        }
      }
      
      res.json({
        success: true,
        deletedCount: results.length,
        errorCount: errors.length,
        results,
        errors
      });
    } catch (error) {
      console.error(`Error in batch delete:`, error.message);
      res.status(500).json({ error: error.message });
    }
};

/**
 * Move objects from one bucket to another 
 */

exports.moveObject = async (req,res,next) => {
  try{

    const { keys,sourceBucket, destinationBucket} = req.body;
    const results = [];
    const errors = [];

    for (const key of keys) {
      try {
        await s3Service.moveObject(sourceBucket,destinationBucket,key);
        results.push({ key, deleted: true });
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    res.json({
      success: true,
      movedCount: results.length,
      errorCount: errors.length,
      results,
      errors
    });

  }catch(err){
    console.error(`Error moving objects:`, error.message);
    res.status(500).json({ error: error.message });
  }
}



/**
 * Show object details
 */
exports.showObjectDetails = async (req, res, next) => {
  try {
    const { bucketName, key } = req.params;
    
    const decodedKey = decodeURIComponent(key);
    const data = await s3Service.getObject(bucketName, decodedKey);
    
    const details = {
      key: decodedKey,
      name: path.basename(decodedKey),
      size: data.ContentLength,
      type: data.ContentType,
      lastModified: data.LastModified,
      metadata: data.Metadata || {},
      publicUrl: s3Service.getPublicUrl(bucketName, decodedKey)
    };
    
    // Helper functions
    const formatFileSize = function(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatDate = function(date) {
      if (!date) return '';
      
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };
    
    const isImageFile = function(mimeType) {
      if (!mimeType) return false;
      return mimeType.startsWith('image/');
    };
    
    res.render('objects/detail', {
      title: 'Object Details',
      bucketName,
      object: details,
      formatFileSize,
      formatDate,
      isImageFile
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Delete folder
 */

exports.deleteFolder = async(req,res,next)=>{
  try{
    const {bucketName,folderPath} = req.body;
    const data = await s3Service.deleteFolder(bucketName,folderPath);
    res.json({
      success: true,
      deleted:data.Deleted,
      error:data.Errors
    });
  }catch(error){
    next(error);
  }
}
module.exports = exports;