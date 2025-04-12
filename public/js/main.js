/**
 * S3 Bucket Manager - Main JavaScript with DataTables enhancements
 */

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
        // Show success message and reload
        //alert(`Successfully deleted ${data.deletedCount} file(s).${data.errorCount > 0 ? ` Failed to delete ${data.errorCount} file(s).` : ''}`);
        window.location.href = "?message=" + `Successfully deleted folder ${folderPath}`;
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
}