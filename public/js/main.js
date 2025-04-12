/**
 * S3 Bucket Manager - Main JavaScript with DataTables enhancements
 */


    /**
     * Show folder structure
     */


    function showFolderTreeOverlay(paths,message) {
        // Create styles
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .tree-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .tree-container {
                max-width: 90%;
                max-height: 90vh;
                width: 800px;
                margin: 0 auto;
                background-color: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                overflow: auto;
                position: relative;
            }
            
            .tree-title {
                margin-top: 0;
                margin-bottom: 15px;
                color: #333;
            }
            
            .tree-view {
                padding: 10px;
                background-color: white;
                border-radius: 4px;
                border: 1px solid #ddd;
                overflow: auto;
                max-height: calc(90vh - 100px);
            }
            
            .tree-node {
                margin-left: 20px;
                position: relative;
            }
            
            .node-content {
                padding: 3px 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
            }
            
            .node-content:hover {
                background-color: #f0f0f0;
                border-radius: 3px;
            }
            
            .folder-icon, .file-icon {
                margin-right: 5px;
                width: 16px;
                text-align: center;
            }
            
            .folder-icon {
                color: #ffc107;
            }
            
            .file-icon {
                color: #2196f3;
            }
            
            .toggle-icon {
                width: 12px;
                text-align: center;
                margin-right: 5px;
                font-size: 10px;
                transition: transform 0.2s;
            }
            
            .closed .toggle-icon {
                transform: rotate(-90deg);
            }
            
            .children {
                margin-left: 10px;
                padding-left: 10px;
                border-left: 1px dashed #ccc;
            }
            
            .closed .children {
                display: none;
            }
            
            .node-name.folder {
                font-weight: 500;
            }
            
            .close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #e0e0e0;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                color: #555;
            }
            
            .close-button:hover {
                background: #d0d0d0;
            }
        `;
        document.head.appendChild(styleElement);
    
        // Convert flat paths to a tree structure
        function buildTreeFromPaths(paths) {
            const root = { name: 'root', children: {}, isFile: false };
            
            paths.forEach(item => {
                const path = item.Key;
                const parts = path.split('/').filter(Boolean);
                
                let current = root;
                
                parts.forEach((part, index) => {
                    if (!current.children[part]) {
                        current.children[part] = {
                            name: part,
                            children: {},
                            isFile: index === parts.length - 1 && !path.endsWith('/')
                        };
                    }
                    current = current.children[part];
                });
            });
            
            return root;
        }
    
        // Convert the object tree to an array format for easier rendering
        function convertToRenderableTree(node) {
            return {
                name: node.name,
                isFile: node.isFile,
                children: Object.values(node.children)
                    .map(convertToRenderableTree)
                    .sort((a, b) => {
                        // Sort folders first, then files
                        if (a.isFile !== b.isFile) {
                            return a.isFile ? 1 : -1;
                        }
                        // Then sort alphabetically
                        return a.name.localeCompare(b.name);
                    })
            };
        }
    
        // Create HTML elements for the tree
        function createTreeNode(node) {
            const nodeElement = document.createElement('div');
            nodeElement.className = node.isFile ? 'tree-node file' : 'tree-node folder';
            
            const nodeContent = document.createElement('div');
            nodeContent.className = 'node-content';
            
            // Toggle button for folders
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.innerHTML = '▼';
            
            if (!node.isFile) {
                nodeContent.appendChild(toggleIcon);
                
                nodeContent.addEventListener('click', () => {
                    nodeElement.classList.toggle('closed');
                });
            } else {
                // Empty space for alignment
                const spacer = document.createElement('span');
                spacer.className = 'toggle-icon';
                spacer.innerHTML = '&nbsp;';
                nodeContent.appendChild(spacer);
            }
            
            // Icon for folder or file
            const icon = document.createElement('span');
            icon.className = node.isFile ? 'file-icon' : 'folder-icon';
            icon.innerHTML = node.isFile ? '📄' : '📁';
            nodeContent.appendChild(icon);
            
            // Node name
            const nodeName = document.createElement('span');
            nodeName.className = node.isFile ? 'node-name file' : 'node-name folder';
            nodeName.textContent = node.name;
            nodeContent.appendChild(nodeName);
            
            nodeElement.appendChild(nodeContent);
            
            // Add children if any
            if (node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'children';
                
                node.children.forEach(childNode => {
                    childrenContainer.appendChild(createTreeNode(childNode));
                });
                
                nodeElement.appendChild(childrenContainer);
            }
            
            return nodeElement;
        }
    
        // Create the overlay and tree structure
        const overlayElement = document.createElement('div');
        overlayElement.className = 'tree-overlay';
        
        const containerElement = document.createElement('div');
        containerElement.className = 'tree-container';
        
        const titleElement = document.createElement('h2');
        titleElement.className = 'tree-title';
        titleElement.textContent = 'Deleted folder tree structure';
        containerElement.appendChild(titleElement);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', () => {
            window.location.href = "?message=" + message;
            document.body.removeChild(overlayElement);
        });
        containerElement.appendChild(closeButton);
        
        const treeViewElement = document.createElement('div');
        treeViewElement.className = 'tree-view';
        treeViewElement.id = 'tree-root-' + Math.random().toString(36).substring(2, 9); // Create unique ID
        
        containerElement.appendChild(treeViewElement);
        overlayElement.appendChild(containerElement);
        document.body.appendChild(overlayElement);
        
        // Close overlay when clicking outside the container
        overlayElement.addEventListener('click', (e) => {
            if (e.target === overlayElement) {
                document.body.removeChild(overlayElement);
            }
        });
        
        // Build and render the tree
        const treeData = buildTreeFromPaths(paths);
        const renderableTree = convertToRenderableTree(treeData);
        
        // Add each top-level node to the tree
        renderableTree.children.forEach(node => {
            treeViewElement.appendChild(createTreeNode(node));
        });
}

document.addEventListener('DOMContentLoaded', function() {
    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeButton = alert.querySelector('.btn-close');
            if (closeButton) {
                closeButton.click();
            }
        }, 5000);
    });
    
    // DataTables initialization with default options
    initializeDataTables();
    
    // File upload preview
    const fileInput = document.getElementById('files');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const previewContainer = document.getElementById('file-preview-container');
            if (!previewContainer) return;
            
            previewContainer.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Show file details
                const fileDetails = document.createElement('div');
                fileDetails.className = 'alert alert-info mt-3';
                fileDetails.innerHTML = `
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Size:</strong> ${formatFileSize(file.size)}<br>
                    <strong>Type:</strong> ${file.type || 'Unknown'}
                `;
                previewContainer.appendChild(fileDetails);
                
                // Show image preview if file is an image
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'file-preview img-fluid mt-2';
                        previewContainer.appendChild(img);
                    }
                    reader.readAsDataURL(file);
                }
            }
        });
    }
    
    // Copy to clipboard functionality
    setupClipboardButtons();
});

/**
 * Initialize DataTables with default options
 */
function initializeDataTables() {
    // Common DataTable options
    const commonOptions = {
        responsive: true,
        stateSave: true,
        processing: true,
        language: {
            processing: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
            search: '<i class="fas fa-search"></i>',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: {
                first: '<i class="fas fa-angle-double-left"></i>',
                previous: '<i class="fas fa-angle-left"></i>',
                next: '<i class="fas fa-angle-right"></i>',
                last: '<i class="fas fa-angle-double-right"></i>'
            }
        },
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        drawCallback: function() {
            // Re-initialize tooltips after table draw
            if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function(tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
            }
        }
    };
    
    // Initialize Buckets table
    const bucketsTable = $('#buckets-table');
    if (bucketsTable.length) {
        bucketsTable.DataTable({
            ...commonOptions,
            columnDefs: [
                { orderable: false, targets: 2 } // Disable sorting on actions column
            ],
            order: [[0, 'asc']], // Default sort by bucket name
            language: {
                ...commonOptions.language,
                search: 'Search buckets:',
                lengthMenu: "Show _MENU_ buckets"
            }
        });
    }
    
    // Initialize Folders table
    const foldersTable = $('#folders-table');
    if (foldersTable.length) {
        foldersTable.DataTable({
            ...commonOptions,
            columnDefs: [
                { orderable: false, targets: 1 } // Disable sorting on actions column
            ],
            language: {
                ...commonOptions.language,
                search: 'Search folders:',
                lengthMenu: "Show _MENU_ folders"
            }
        });
    }
    
    // Initialize Files table
    const filesTable = $('#files-table');
    if (filesTable.length) {
        const filesDataTable = filesTable.DataTable({
            ...commonOptions,
            columnDefs: [
                { orderable: false, targets: [0, 4] }, // Disable sorting on checkbox and actions columns
                { type: 'file-size', targets: 2 }      // Custom sorting for file sizes
            ],
            order: [[1, 'asc']], // Default sort by filename
            language: {
                ...commonOptions.language,
                search: 'Search files:',
                lengthMenu: "Show _MENU_ files"
            }
        });
        
        // Handle select all checkbox with DataTables pagination
        $('#selectAll').on('click', function() {
            const isChecked = $(this).prop('checked');
            
            // Select checkboxes on current page only
            filesTable.find('tbody .file-checkbox').prop('checked', isChecked);
            
            updateBatchActionButtons();
        });
        
        // Update select-all checkbox state based on visible checkboxes
        filesTable.on('draw.dt', function() {
            updateSelectAllCheckboxState();
        });
    }
    
    // Add custom search highlight
    $('.dataTables_filter input').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        if (searchTerm.length > 1) {
            $('table.dataTable tbody tr:visible').each(function() {
                $(this).find('td').each(function() {
                    const td = $(this);
                    const text = td.text().toLowerCase();
                    
                    if (text.indexOf(searchTerm) > -1) {
                        const regex = new RegExp('(' + searchTerm + ')', 'gi');
                        td.html(td.text().replace(regex, '<span class="highlight">$1</span>'));
                    }
                });
            });
        } else {
            // Remove highlight when search term is too short
            $('table.dataTable span.highlight').each(function() {
                $(this).replaceWith($(this).text());
            });
        }
    });
}

/**
 * Update the select-all checkbox state based on visible checkboxes
 */
function updateSelectAllCheckboxState() {
    const selectAllCheckbox = $('#selectAll');
    if (!selectAllCheckbox.length) return;
    
    const checkboxes = $('#files-table tbody .file-checkbox:visible');
    const checkedCheckboxes = checkboxes.filter(':checked');
    
    if (checkboxes.length > 0 && checkboxes.length === checkedCheckboxes.length) {
        selectAllCheckbox.prop('checked', true);
        selectAllCheckbox.prop('indeterminate', false);
    } else if (checkedCheckboxes.length > 0) {
        selectAllCheckbox.prop('indeterminate', true);
    } else {
        selectAllCheckbox.prop('checked', false);
        selectAllCheckbox.prop('indeterminate', false);
    }
}

/**
 * Format file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Set up clipboard buttons
 */
function setupClipboardButtons() {
    const copyButtons = document.querySelectorAll('[id^="copy"]');
    copyButtons.forEach(btn => {
        if (!btn.dataset.initialized) {
            btn.dataset.initialized = true;
            
            btn.addEventListener('click', function() {
                // Get the target input field ID from the button ID
                const targetId = this.id.replace('copy', '');
                const targetField = document.getElementById(targetId);
                
                if (targetField) {
                    targetField.select();
                    document.execCommand('copy');
                    
                    // Show success message
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    this.classList.remove('btn-outline-primary');
                    this.classList.add('btn-success');
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.classList.remove('btn-success');
                        this.classList.add('btn-outline-primary');
                    }, 2000);
                }
            });
        }
    });
}


function openNewFolderModal(){
    const createNewfolder = new bootstrap.Modal(document.getElementById('createFolderModal'));
    createNewfolder.show();
}
/**
 * Create folder in the current bucket path
 */
function createFolder(bucketName, currentPrefix) {
    const folderName = document.getElementById("newFolder").value;
    if (!folderName || folderName.trim() === '') return;
    
    // Create a zero-byte object with a trailing slash to represent folder
    const folderKey = currentPrefix + folderName.trim() + '/';
    
    // Use fetch API to call the create folder endpoint
    fetch(`/objects/${bucketName}/folder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: folderKey }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create folder');
        }
        return response.json();
    })
    .then(() => {
        // Reload the page to show the new folder
        window.location.reload();
    })
    .catch(error => {
        alert('Error creating folder: ' + error.message);
    });
}

/**
 * Toggle file selection for batch operations
 */
function toggleFileSelection() {
    // This will be handled by the DataTables initialization
    updateBatchActionButtons();
}

/**
 * Update batch action buttons based on selection
 */
function updateBatchActionButtons() {
    const batchActions = document.getElementById('batchActions');
    if (!batchActions) return;
    
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    
    if (checkboxes.length > 0) {
        batchActions.classList.remove('d-none');
    } else {
        batchActions.classList.add('d-none');
    }
    
    // Update counter
    const counter = document.getElementById('selectedCounter');
    if (counter) {
        counter.textContent = checkboxes.length;
    }
    
    // Update "Select All" checkbox state
    updateSelectAllCheckboxState();
}

function batchDeleteObjectsPrompt(bucketName, prefix) {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    const keys = Array.from(checkboxes).map(checkbox => checkbox.value);
    const keysHtmlString = keys.join('<br>');
    const myModal = new bootstrap.Modal(document.getElementById('deleteBatchFileModal'));
    document.getElementById("batchdeletemessage").innerHTML = `Are you sure you want to delete below ${checkboxes.length} item(s) ? <br> <div class="batch-delete-files-list"> ${keysHtmlString} </div>`;
    document.getElementById("batchDeletePrefix").value = prefix;
    document.getElementById("batchDeleteBucket").value = bucketName;
    myModal.show();
}

/**
 * Handle batch deletion of objects
 */
function batchDeleteObjects() {
    const prefix = document.getElementById("batchDeletePrefix").value;
    const bucketName = document.getElementById("batchDeleteBucket").value;
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    if (checkboxes.length === 0) return;
    
    
    const keys = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    // Use fetch API to call the batch delete endpoint
    fetch(`/objects/${bucketName}/batch-delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            keys: keys,
            prefix: prefix
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete objects');
        }
        return response.json();
    })
    .then((data) => {
        // Show success message and reload
        //alert(`Successfully deleted ${data.deletedCount} file(s).${data.errorCount > 0 ? ` Failed to delete ${data.errorCount} file(s).` : ''}`);
        window.location.href = "?message=" + `Successfully deleted ${data.deletedCount} file(s).${data.errorCount > 0 ? ` Failed to delete ${data.errorCount} file(s).` : ''}`;
    })
    .catch(error => {
        alert('Error deleting objects: ' + error.message);
    });
}


function moveObjectPrompt(bucketName, prefix) {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    const keys = Array.from(checkboxes).map(checkbox => checkbox.value);
    const keysHtmlString = keys.join('<br>');
    const moveObjModal = new bootstrap.Modal(document.getElementById('moveObjectModal'));
    document.getElementById("moveObjectMessage").innerHTML = `Move these ${checkboxes.length} item(s) to </div>`;
    document.getElementById("bucketPrefix").value = prefix;
    document.getElementById("sourceBucket").value = bucketName;
    moveObjModal.show();
}


/**
 * Move one or many objects between buckets
 */
function moveObjects() {
    const prefix = document.getElementById("batchDeletePrefix").value;
    const bucketName = document.getElementById("sourceBucket").value;
    const destinationbucketname = document.getElementById("destinationBucket").value;
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');

    if(bucketName === destinationbucketname) return;
    if (checkboxes.length === 0) return;
    
    
    const keys = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    // Use fetch API to call the batch delete endpoint
    fetch(`/objects/${bucketName}/move-objects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            keys: keys,
            prefix: prefix,
            sourceBucket:bucketName,
            destinationBucket:destinationbucketname

        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to move objects');
        }
        return response.json();
    })
    .then((data) => {
        // Show success message and reload
        //alert(`Successfully deleted ${data.deletedCount} file(s).${data.errorCount > 0 ? ` Failed to delete ${data.errorCount} file(s).` : ''}`);
        window.location.href = "?message=" + `Successfully moved ${data.movedCount} file(s).${data.errorCount > 0 ? ` Failed to move ${data.errorCount} file(s).` : ''}`;
    })
    .catch(error => {
        alert('Error deleting objects: ' + error.message);
    });
}


/**
 * Show delete folder modal
 */
function showDeleteFolderModal(bucketName,folderPath){
    document.getElementById("targetedBucketName").value = bucketName;
    document.getElementById("folderPathToBeDeleted").value = folderPath;
    document.getElementById("folderPathName").textContent = folderPath;
    const deleteFolderModal = new bootstrap.Modal(document.getElementById('deleteFolderModal'));
    deleteFolderModal.show();
}

/**
 * Delete a folder
*/

function deleteFolder(){
    const bucketName = document.getElementById("targetedBucketName").value;
    const folderPath = document.getElementById("folderPathToBeDeleted").value;

    fetch(`/objects/${bucketName}/delete-folder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            bucketName: bucketName,
            folderPath: folderPath
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete folder');
        }
        return response.json();
    })
    .then((data) => {
        console.table(data)
        showFolderTreeOverlay(data.deleted,`Successfully deleted ${data.deleted.length} file(s)`);
        // Show success message and reload
        //alert(`Successfully deleted ${data.deletedCount} file(s).${data.errorCount > 0 ? ` Failed to delete ${data.errorCount} file(s).` : ''}`);
        //window.location.href = "?message=" + `Successfully deleted folder ${folderPath}`;
    })
    .catch(error => {
        alert('Error deleting folder: ' + error.message);
    });
}

/**
 * Format date in a human-readable format
 * @param {Date} date - Date object
 * @returns {string} - Formatted date
 */
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Initialize DataTables with default options
 */
function initializeDataTables() {
    // Common DataTable options
    const commonOptions = {
        responsive: true,
        stateSave: true,
        processing: true,
        language: {
            processing: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
            search: '<i class="fas fa-search"></i>',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: {
                first: '<i class="fas fa-angle-double-left"></i>',
                previous: '<i class="fas fa-angle-left"></i>',
                next: '<i class="fas fa-angle-right"></i>',
                last: '<i class="fas fa-angle-double-right"></i>'
            }
        },
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        drawCallback: function() {
            // Re-initialize tooltips after table draw
            if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function(tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
            }
        }
    };
    
    // Initialize Buckets table
    const bucketsTable = $('#buckets-table');
    if (bucketsTable.length && !$.fn.DataTable.isDataTable('#buckets-table')) {
        bucketsTable.DataTable({
            ...commonOptions,
            columnDefs: [
                { orderable: false, targets: 2 } // Disable sorting on actions column
            ],
            order: [[0, 'asc']], // Default sort by bucket name
            language: {
                ...commonOptions.language,
                search: 'Search buckets:',
                lengthMenu: "Show _MENU_ buckets"
            }
        });
    }
    
    // Initialize Folders table
    const foldersTable = $('#folders-table');
    if (foldersTable.length && !$.fn.DataTable.isDataTable('#folders-table')) {
        foldersTable.DataTable({
            ...commonOptions,
            columnDefs: [
                { orderable: false, targets: 1 } // Disable sorting on actions column
            ],
            language: {
                ...commonOptions.language,
                search: 'Search folders:',
                lengthMenu: "Show _MENU_ folders"
            }
        });
    }
    
    // Initialize Files table
    const filesTable = $('#files-table');
    if (filesTable.length && !$.fn.DataTable.isDataTable('#files-table')) {
        const filesDataTable = filesTable.DataTable({
            ...commonOptions,
            columnDefs: [
                { orderable: false, targets: [0, 4] }, // Disable sorting on checkbox and actions columns
                { type: 'file-size', targets: 2 }      // Custom sorting for file sizes
            ],
            order: [[1, 'asc']], // Default sort by filename
            language: {
                ...commonOptions.language,
                search: 'Search files:',
                lengthMenu: "Show _MENU_ files"
            }
        });
        
        // Handle select all checkbox with DataTables pagination
        $('#selectAll').on('click', function() {
            const isChecked = $(this).prop('checked');
            
            // Select checkboxes on current page only
            filesTable.find('tbody .file-checkbox').prop('checked', isChecked);
            
            updateBatchActionButtons();
        });
        
        // Update select-all checkbox state based on visible checkboxes
        filesTable.on('draw.dt', function() {
            updateSelectAllCheckboxState();
        });
    }
    
    // Add custom search highlight that preserves HTML links
    $('.dataTables_filter input').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        if (searchTerm.length > 1) {
            $('table.dataTable tbody tr:visible').each(function() {
                $(this).find('td').each(function() {
                    const td = $(this);
                    
                    // Skip cells with checkboxes or action buttons
                    if (td.find('input[type="checkbox"]').length || td.find('.btn-group').length) {
                        return;
                    }
                    
                    const cellContent = td.html();
                    const textContent = td.text().toLowerCase();
                    
                    if (textContent.indexOf(searchTerm) > -1) {
                        // Save anchor tags before highlighting
                        const tempDiv = $('<div>').html(cellContent);
                        const anchors = [];
                        
                        tempDiv.find('a').each(function() {
                            const $a = $(this);
                            anchors.push({
                                href: $a.attr('href'),
                                html: $a.html(),
                                text: $a.text()
                            });
                        });
                        
                        // Apply highlighting to text content
                        let highlightedContent = td.text();
                        const regex = new RegExp('(' + searchTerm + ')', 'gi');
                        highlightedContent = highlightedContent.replace(regex, '<span class="highlight">$1</span>');
                        
                        // Restore anchors with highlighting inside them
                        for (const anchor of anchors) {
                            const anchorText = anchor.text;
                            const highlightedAnchorText = anchorText.replace(regex, '<span class="highlight">$1</span>');
                            const newAnchor = `<a href="${anchor.href}" class="text-decoration-none">${highlightedAnchorText}</a>`;
                            
                            // Replace the first occurrence of highlighted text with the anchor
                            const textToReplace = anchorText.replace(regex, '<span class="highlight">$1</span>');
                            const index = highlightedContent.indexOf(textToReplace);
                            
                            if (index !== -1) {
                                highlightedContent = 
                                    highlightedContent.substring(0, index) + 
                                    newAnchor + 
                                    highlightedContent.substring(index + textToReplace.length);
                            }
                        }
                        
                        // Restore original icons if any
                        tempDiv.find('i').each(function() {
                            const $i = $(this);
                            const iconHtml = $('<div>').append($i.clone()).html();
                            highlightedContent = iconHtml + ' ' + highlightedContent;
                        });
                        
                        td.html(highlightedContent);
                    }
                });
            });
        } else {
            // On short or empty search term, redraw the table to restore original HTML
            const table = $.fn.dataTable.tables()[0];
            if (table) {
                $(table).DataTable().draw(false);
            }
        }
    });

    document.getElementById("destinationBucket").addEventListener("change",function(){
        if(this.value !== ""){
            document.getElementById("moveObject").removeAttribute("disabled");
        }else{
            document.getElementById("moveObject").setAttribute("disabled",true);
        }
    });




    
    // Example usage:
    // const paths = [
    //     { "Key": "Hi/Teraform/Images/" },
    //     { "Key": "Hi/Teraform/Images/New/" },
    //     { "Key": "Hi/Teraform/Images/New/17439408341601j.peg" },
    //     { "Key": "Hi/Teraform/Images/New/Myn-Logo-1280x720-01.png" },
    //     { "Key": "Hi/Teraform/Images/Old/" },
    //     { "Key": "Hi/Teraform/Images/Old/Mask-Group-10.png" }
    // ];
    // showFolderTreeOverlay(paths);
}