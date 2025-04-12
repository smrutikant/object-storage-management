const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Initialize S3 client
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  signatureVersion: 'v4'
});

/**
 * List all available buckets
 */
exports.listBuckets = async () => {
  try {
    const data = await s3.listBuckets().promise();
    return data.Buckets;
  } catch (error) {
    console.error('Error listing buckets:', error);
    throw error;
  }
};

/**
 * Create a new bucket
 * @param {string} bucketName - Name for the new bucket
 */
exports.createBucket = async (bucketName) => {
  try {
    const data = await s3.createBucket({ Bucket: bucketName }).promise();
    return data;
  } catch (error) {
    console.error(`Error creating bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * Delete a bucket
 * @param {string} bucketName - Name of the bucket to delete
 */
exports.deleteBucket = async (bucketName) => {
  try {
    const data = await s3.deleteBucket({ Bucket: bucketName }).promise();
    return data;
  } catch (error) {
    console.error(`Error deleting bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * List objects in a bucket
 * @param {string} bucketName - Name of the bucket
 * @param {string} prefix - Optional prefix to filter objects
 */
exports.listObjects = async (bucketName, prefix = '') => {
  try {
    const params = {
      Bucket: bucketName,
      Prefix: prefix
    };
    
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents || [];
  } catch (error) {
    console.error(`Error listing objects in bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * Upload an object to a bucket
 * @param {string} bucketName - Name of the bucket
 * @param {object} file - File object from express-fileupload
 * @param {string} key - Object key (path/name)
 */
// exports.uploadObject = async (bucketName, file, key) => {
//   try {
//     const params = {
//       Bucket: bucketName,
//       Key: key,
//       Body: file.data,
//       ContentType: file.mimetype
//     };
    
//     const data = await s3.upload(params).promise();
//     return data;
//   } catch (error) {
//     console.error(`Error uploading object to bucket ${bucketName}:`, error);
//     throw error;
//   }
// };

/**
 * Upload an object to a bucket with optimized handling for large files
 * @param {string} bucketName - Name of the bucket
 * @param {object} file - File object from express-fileupload
 * @param {string} key - Object key (path/name)
 */
exports.uploadObject = async (bucketName, file, key) => {
  try {
    // If useTempFiles is enabled in express-fileupload config, file.data will be undefined
    // and file.tempFilePath will contain the path to the temp file
    let body;
    let contentLength;
    
    if (file.tempFilePath) {
      // For large files, use createReadStream to avoid loading the entire file into memory
      body = fs.createReadStream(file.tempFilePath);
      contentLength = file.size;
    } else {
      // For small files or if tempFiles are not enabled
      body = file.data;
    }
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: file.mimetype,
      ContentLength: contentLength
    };
    
    // For very large files, use multipart upload
    if (file.size > 100 * 1024 * 1024) { // 100MB threshold
      return await multipartUpload(bucketName, file, key);
    } else {
      // Standard upload for smaller files
      const data = await s3.upload(params).promise();
      return data;
    }
  } catch (error) {
    console.error(`Error uploading object to bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * Perform a multipart upload for large files
 * @param {string} bucketName - Name of the bucket
 * @param {object} file - File object from express-fileupload
 * @param {string} key - Object key (path/name)
 */
async function multipartUpload(bucketName, file, key) {
  try {
    // Create a multipart upload
    const multipartParams = {
      Bucket: bucketName,
      Key: key,
      ContentType: file.mimetype
    };
    
    const multipartUpload = await s3.createMultipartUpload(multipartParams).promise();
    const uploadId = multipartUpload.UploadId;
    
    // Read the file in chunks and upload parts
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (minimum for S3)
    const fileStream = fs.createReadStream(file.tempFilePath, { highWaterMark: CHUNK_SIZE });
    
    let partNumber = 1;
    const uploadedParts = [];
    
    for await (const chunk of fileStream) {
      const partParams = {
        Body: chunk,
        Bucket: bucketName,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId
      };
      
      const uploadedPart = await s3.uploadPart(partParams).promise();
      
      uploadedParts.push({
        ETag: uploadedPart.ETag,
        PartNumber: partNumber
      });
      
      partNumber++;
    }
    
    // Complete the multipart upload
    const completeParams = {
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadedParts
      }
    };
    
    return await s3.completeMultipartUpload(completeParams).promise();
  } catch (error) {
    console.error(`Error in multipart upload to bucket ${bucketName}:`, error);
    throw error;
  }
}

/**
 * Delete an object from a bucket
 * @param {string} bucketName - Name of the bucket
 * @param {string} key - Object key to delete
 */
exports.deleteObject = async (bucketName, key) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    const data = await s3.deleteObject(params).promise();
    return data;
  } catch (error) {
    console.error(`Error deleting object ${key} from bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * Download an object from a bucket
 * @param {string} bucketName - Name of the bucket
 * @param {string} key - Object key to download
 */
exports.getObject = async (bucketName, key) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    const data = await s3.getObject(params).promise();
    return data;
  } catch (error) {
    console.error(`Error getting object ${key} from bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * Generate a presigned URL for an object
 * @param {string} bucketName - Name of the bucket
 * @param {string} key - Object key
 * @param {number} expires - URL expiration time in seconds (default: 3600)
 */
exports.getSignedUrl = (bucketName, key, expires = 3600) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expires
    };
    
    const url = s3.getSignedUrl('getObject', params);
    return url;
  } catch (error) {
    console.error(`Error generating signed URL for ${key} in bucket ${bucketName}:`, error);
    throw error;
  }
};

/**
 * Move an object from one bucket to other
 * Step 1 : Copy the object from the source bucket to the destination bucket
 * Step 2 : Delete the object from the source bucket
 * @param {string} sourceBucket - Name of the bucket containing the objects
 * @param {string} destinationBucket - Name of the bucket where the objects will be moved
 * @param {string} key - Array of object keys for which to generate presigned URLs
 */

exports.moveObject = async (sourceBucket,destinationBucket,key)=>{

  try {
    // Step 1
    const copyParams = {
      Bucket: destinationBucket,
      CopySource: `${sourceBucket}/${key}`,
      Key: key
    };

    const objectMoved = await s3.copyObject(copyParams).promise();

    // Step 2
    const deleteParams = {
      Bucket: sourceBucket,
      Key: key
    };

    const objectDeleted = await s3.deleteObject(deleteParams).promise();
  
    const info = {
      "copied":`Object ${key} copied to ${destinationBucket}`,
      "deleted": `Object ${key} deleted from ${sourceBucket}`
    }
    return info;

  } catch (error) {
    console.error('Error moving object:', error);
  }

}

/**
 * Create a public URL for an object (if the bucket policy allows it)
 * @param {string} bucketName - Name of the bucket
 * @param {string} key - Object key
 */
exports.getPublicUrl = (bucketName, key) => {
  const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
  return `${endpoint}/${bucketName}/${encodeURIComponent(key)}`;
};

/**
 * Deletes all objects within a specified "folder" in an S3 bucket
 * 
 * @param {string} bucketName - The name of the S3 bucket
 * @param {string} folderPath - The path of the folder to delete (e.g., "uploads/images")
 * @returns {Promise<object>} - Result of the delete operation
 * 
 * Notes:
 * - S3 doesn't actually have folders, just objects with key names that contain slashes
 * - This function recursively deletes all objects with the specified prefix
 * - Check the limit of total object that can be deleted at one go.
 * - The function handles pagination automatically for folders with more than 1000 objects
 * - Requires appropriate IAM permissions: s3:ListObjects and s3:DeleteObjects
 */

exports.deleteFolder = async(bucketName, folderPath) => {
  // Ensure the folder path ends with a forward slash
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  
  console.log(`Deleting all objects with prefix ${prefix} from bucket ${bucketName}`);
  
  try {
    // Step 1: List all objects in the folder
    const listedObjects = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix
    }).promise();
    
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log('No objects found to delete');
      return;
    }
    
    // Step 2: Prepare objects for deletion
    const objectsToDelete = listedObjects.Contents.map(({ Key }) => ({ Key }));
    
    // Step 3: Delete the objects
    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: objectsToDelete }
    };
    
    const deletedObjects = await s3.deleteObjects(deleteParams).promise();
    
    console.log(`Successfully deleted ${objectsToDelete.length} objects`);
    
    // Check if there are more objects to delete (pagination)
    if (listedObjects.IsTruncated) {
      // Recursively delete remaining objects
      await deleteFolder(bucketName, folderPath);
    }
    
    return deletedObjects;
  } catch (err) {
    console.error('Error deleting folder:', err);
    throw err;
  }
}


module.exports = exports;