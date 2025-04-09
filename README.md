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
  - Download files
  - Delete files (single or batch)
  - Create folders
  - Batch selection and operations

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
- **Upload Files**: 
  - Click "Upload File" button 
  - Select one or multiple files (up to 10)
  - Click "Upload Files" to start the upload
- **Download File**: Click the download icon next to a file
- **Delete File**: Click the delete icon next to a file
- **View File Details**: Click on the file name to view details
- **Share File**: Click the share icon to generate shareable links

### Batch Operations

- **Select Files**: Use checkboxes to select multiple files
- **Select All**: Use the "Select All" checkbox to select all files on current page
- **Batch Delete**: Select multiple files then click "Delete Selected"

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

For any questions or issues, please open an issue in the GitHub repository.<img width="1512" alt="Screenshot 2025-04-10 at 12 57 08 AM" src="https://github.com/user-attachments/assets/5e3e7c7b-05d4-418e-86cf-c60a0ad4399c" />
<img width="1511" alt="Screenshot 2025-04-10 at 12 58 29 AM" src="https://github.com/user-attachments/assets/2a33b006-9c57-4989-b90a-0a0e84f115c1" />
<img width="757" alt="Screenshot 2025-04-10 at 1 00 34 AM" src="https://github.com/user-attachments/assets/da28748c-6b32-4486-95ab-ab742ff3cfe8" />
![screencapture-localhost-3000-objects-salesforce-dev-image-34-png-2025-04-10-01_01_30](https://github.com/user-attachments/assets/e088e6ce-d08c-49d4-bab4-ee4341d4d080)
