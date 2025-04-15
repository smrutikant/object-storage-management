# S3 Bucket Manager

A full-featured Express.js application for managing S3 buckets and objects with a well-designed interface. This application works with any S3-compatible storage, including on-premise solutions.


## Features

- **Bucket Management**:
  - List all buckets with search and filtering
  - Create new buckets
  - Delete buckets

- **Object Management**:
  - Browse objects with folder navigation
  - Advanced search and filtering of files and folders
  - Upload files (single or multiple) with progress indicator
  - **Upload folders** with structure preservation and progress tracking
  - Download files
  - Delete files (single or batch)
  - Delete folders (including all nested contents)
  - Move objects between buckets
  - Create folders
  - Batch selection and operations

- **Access Control**:
  - View and manage object ACL permissions
  - Set objects as private or public
  - Apply standard S3 ACL presets (private, public-read, authenticated-read, etc.)
  - Quick permission changes directly from the object details page

- **Sharing**:
  - Generate pre-signed URLs with configurable expiration
  - Show public URLs
  - Easy copy-to-clipboard functionality

- **User Experience**:
  - Responsive design for mobile and desktop
  - DataTables integration for advanced filtering and sorting
  - Real-time upload progress
  - Intuitive navigation with breadcrumbs

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Access to an S3-compatible storage service

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/smrutikant/object-storage-management.git
   cd object-storage-management
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your S3 configuration:
   ```
   # S3 Configuration
   S3_ENDPOINT=https://your-s3-server-url
   S3_ACCESS_KEY=your-access-key
   S3_SECRET_KEY=your-secret-key
   S3_REGION=us-east-1
   S3_FORCE_PATH_STYLE=true

   # Application settings
   PORT=3000
   NODE_ENV=development
   ```

4. Start the application:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Bucket Management

- **View Buckets**: The home page displays all your buckets
- **Create Bucket**: Click "Create Bucket" button and enter a valid bucket name
- **Delete Bucket**: Click the delete button next to a bucket (bucket must be empty)
- **Browse Bucket**: Click on a bucket name or the "Browse" button to view its contents

### File & Folder Operations

- **Navigate Folders**: Click on folder names to browse their contents
- **Create Folder**: Click "New Folder" button and enter a folder name
- **Delete Folder**: Click the delete icon next to a folder to remove it and all its contents
- **Upload Files**: 
  - Click "Upload File" button 
  - Select one or multiple files (up to 10)
  - Click "Upload Files" to start the upload
- **Upload Folders**:
  - Click "Upload Folder" button
  - Use the folder selector to choose a folder from your computer
  - Modern browsers (Chrome, Edge, Opera) offer improved folder selection without browser alerts
  - The folder structure will be preserved during upload
  - Maximum 10 files per folder and 5GB total size
  - Watch real-time progress as the folder uploads
- **Download File**: Click the download icon next to a file
- **Delete File**: Click the delete icon next to a file
- **Move File**: 
  - Click the move icon next to a file or use batch selection
  - Select the destination bucket from the dropdown menu
  - Click "Move" to transfer the file(s) to the new bucket
- **View File Details**: Click on the file name to view details
- **Share File**: Click the share icon to generate shareable links

### Managing ACL Permissions

- **View ACL**: Object details page displays current ACL permissions
- **Change ACL**: Select from the dropdown of standard S3 ACL presets:
  - **Private**: No public access
  - **Public Read**: Anyone can read the object
  - **Authenticated Read**: Only authenticated users can read
  - **Bucket Owner Read**: Bucket owner has read access
  - **Bucket Owner Full Control**: Bucket owner has full control
- **Update Permissions**: Click "Update Permissions" button to apply changes
- **Permission Effects**: 
  - Setting to "public-read" makes files accessible without authentication
  - Setting to "private" restricts access to authenticated users only
- **Limitations**: This implementation only supports standard S3 canned ACLs, not custom permissions or user groups

### Batch Operations

- **Select Files**: Use checkboxes to select multiple files
- **Select All**: Use the "Select All" checkbox to select all files on current page
- **Batch Delete**: Select multiple files then click "Delete Selected"
- **Batch Move**: Select multiple files then click "Move Selected" to transfer files to another bucket

### Searching & Filtering

- **Search Buckets**: Use the search box above the buckets table
- **Search Files/Folders**: Use the search box above files or folders tables
- **Sort**: Click on column headers to sort by that column
- **Pagination**: Use pagination controls to navigate through large lists
- **Items Per Page**: Adjust how many items are shown per page using the dropdown

## Authentication

This application doesn't include authentication - it assumes you will implement your own authentication mechanism. You can integrate it with your existing authentication system.

## Application Structure

The application follows a standard Express.js MVC structure:

```
s3-bucket-manager/
├── app.js                # Main application file
├── package.json          # Project dependencies
├── .env                  # Environment variables (create this)
├── controllers/          # Controller logic
│   ├── bucketController.js
│   └── objectController.js
├── services/             # S3 service integration
│   └── s3Service.js
├── middlewares/          # Custom middleware
│   └── templateHelpers.js
├── routes/               # Route definitions
│   ├── index.js
│   ├── buckets.js
│   └── objects.js
├── views/                # EJS templates
│   ├── layouts/
│   ├── partials/
│   ├── buckets/
│   └── objects/
└── public/               # Static assets
    ├── css/
    ├── js/
    └── img/
```

## Adding Custom Authentication

To add authentication:

1. Implement your authentication middleware
2. Add it to the routes in `app.js`:

```javascript
// Example: Add auth middleware to routes
app.use('/', authMiddleware, indexRoutes);
app.use('/buckets', authMiddleware, bucketRoutes);
app.use('/objects', authMiddleware, objectRoutes);
```

3. Customize the header view to include user information

## Advanced Configuration

### File Size Limits

The default maximum file size is 5GB. To adjust this limit, modify the `fileUpload` configuration in `app.js`:

```javascript
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
    files: 10, // Maximum 10 files per upload
  },
  // other options...
}));
```

### Temporary Files

For handling large files, the application uses temporary files. The default location is `/tmp/`. You can change this in `app.js`:

```javascript
app.use(fileUpload({
  // other options...
  useTempFiles: true,
  tempFileDir: '/path/to/your/temp/dir/',
}));
```

### S3 Region and Path Style

For compatibility with different S3 implementations, you can adjust these settings in the `.env` file:

```
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

Set `S3_FORCE_PATH_STYLE=true` for most on-premise S3-compatible storage systems.

### ACL Permissions

The application supports the standard S3 canned ACL permissions. The available ACL options are:

- **private**: Owner gets FULL_CONTROL. No one else has access rights.
- **public-read**: Owner gets FULL_CONTROL. The AllUsers group gets READ access.
- **authenticated-read**: Owner gets FULL_CONTROL. The AuthenticatedUsers group gets READ access.
- **bucket-owner-read**: Object owner gets FULL_CONTROL. Bucket owner gets READ access.
- **bucket-owner-full-control**: Both the object owner and the bucket owner get FULL_CONTROL.

Note that these are predefined permission sets provided by the S3 API. This implementation does not support custom ACLs or fine-grained permissions for specific users or groups. For more advanced access control, consider implementing AWS IAM policies or a custom permission system.

## Folder Upload Guidelines

When using the folder upload feature, keep these guidelines in mind:

- **Maximum folder size:** 5 GB (total of all files)
- **Maximum files per folder:** 10 files
- **Maximum folder depth:** Unlimited (all nested subfolders will be preserved)
- **All file types supported**
- **Files with the same name will be overwritten**
- **Folder structure will be preserved** when uploaded to S3
- **Empty folders** will be ignored during upload
- **File permissions and metadata** will not be preserved
- **Files are processed sequentially** within the folder

### Folder Upload Considerations:

1. **Upload time:** The upload process may take significant time for large folders or files
2. **Browser stability:** Keep the browser tab open during the entire upload process
3. **Network reliability:** Ensure a stable internet connection for large folder uploads
4. **Folder selection:** Some browsers may require special permissions to access folders
5. **Naming conflicts:** Files with identical paths will overwrite existing files on S3
6. **Progress indication:** Upload progress may appear to stall when processing large files

### Browser Compatibility for Folder Upload

The folder upload feature works best in:
- Chrome 90+
- Edge 90+
- Opera 76+

Firefox and Safari support folder uploads with the legacy method, but may show alerts when selecting multiple files.

## Troubleshooting

### Connection Issues

If you're having trouble connecting to your S3 storage:

1. Verify the endpoint URL is correct
2. Check access key and secret key
3. Ensure network connectivity between server and S3
4. Confirm that your S3 implementation is compatible

### Upload Problems

If file uploads are failing:

1. Check file size against limits
2. Verify write permissions on the temp directory
3. Ensure the bucket exists and has proper permissions
4. Check server logs for detailed error messages

### ACL Permission Issues

If you're having problems with ACL permissions:

1. Verify that your S3 implementation supports the ACL you're trying to set
2. Check that your S3 credentials have permission to modify ACLs
3. Ensure the bucket policy doesn't override object ACLs
4. If an object shows the wrong ACL even after updating, try refreshing the page
5. Some S3-compatible storage systems might have limited ACL support
6. Check server logs for specific error messages related to ACL operations

### Folder Upload Issues

If folder uploads are failing:

1. Ensure your browser supports folder selection (use Chrome/Edge for best results)
2. Check if you're exceeding the 10 files limit or 5GB total size limit
3. Verify the temporary directory exists and is writable
4. For large folders, try uploading subfolders separately
5. Check that your prefix path is valid in the S3 bucket

### Move Operation Issues

If moving files between buckets fails:

1. Verify that both source and destination buckets exist
2. Check permissions on both buckets
3. Ensure the object name doesn't already exist in the destination bucket
4. For large files, check if the operation times out (adjust timeout settings if needed)

### Folder Delete Issues

If folder deletion fails:

1. Verify you have proper permissions to delete all objects in the folder
2. For folders with many objects, check if the operation times out
3. Ensure no other processes are currently accessing objects in the folder
4. Check server logs for specific error messages if deletion fails

### Browser Compatibility

This application is tested with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Older browsers may have limited functionality, particularly for large file uploads.

## License

MIT

## Support

For any questions or issues, please open an issue in the GitHub repository.