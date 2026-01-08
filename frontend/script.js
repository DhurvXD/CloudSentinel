// API Base URL
const API_URL = 'http://127.0.0.1:5000';

// Global variables
let currentFileId = null;

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const uploadStatus = document.getElementById('uploadStatus');
const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');
const downloadModal = document.getElementById('downloadModal');
const modalFileName = document.getElementById('modalFileName');
const downloadPassword = document.getElementById('downloadPassword');
const confirmDownload = document.getElementById('confirmDownload');
const cancelDownload = document.getElementById('cancelDownload');
const downloadStatus = document.getElementById('downloadStatus');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    
    // Event Listeners
    uploadForm.addEventListener('submit', handleUpload);
    refreshBtn.addEventListener('click', loadFiles);
    confirmDownload.addEventListener('click', handleDownload);
    cancelDownload.addEventListener('click', closeModal);
});

// ==================== UPLOAD FILE ====================
async function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const password = document.getElementById('uploadPassword').value;
    
    if (!fileInput.files[0]) {
        showStatus(uploadStatus, 'Please select a file', 'error');
        return;
    }
    
    // Show loading
    showStatus(uploadStatus, '🔐 Encrypting and uploading...', 'loading');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('password', password);
    
    try {
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus(uploadStatus, `✅ ${result.message}`, 'success');
            uploadForm.reset();
            loadFiles(); // Refresh file list
        } else {
            showStatus(uploadStatus, `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showStatus(uploadStatus, `❌ Upload failed: ${error.message}`, 'error');
    }
}

// ==================== LOAD FILES LIST ====================
async function loadFiles() {
    filesList.innerHTML = '<p class="loading">Loading files...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/files`);
        const result = await response.json();
        
        if (result.success && result.files.length > 0) {
            displayFiles(result.files);
        } else {
            filesList.innerHTML = '<p style="text-align: center; color: #666;">No files uploaded yet.</p>';
        }
    } catch (error) {
        filesList.innerHTML = `<p style="color: red;">Failed to load files: ${error.message}</p>`;
    }
}

// ==================== DISPLAY FILES ====================
function displayFiles(files) {
    filesList.innerHTML = '';
    
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <div class="file-info">
                <h4>📄 ${file.filename}</h4>
                <p>Size: ${formatBytes(file.size)} | Modified: ${file.last_modified}</p>
            </div>
            <div class="file-actions">
                <button class="btn btn-success" onclick="openDownloadModal('${file.key}', '${file.filename}')">
                    📥 Download
                </button>
                <button class="btn btn-danger" onclick="deleteFile('${file.key}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        filesList.appendChild(fileItem);
    });
}

// ==================== DOWNLOAD MODAL ====================
function openDownloadModal(fileId, fileName) {
    currentFileId = fileId;
    modalFileName.textContent = `File: ${fileName}`;
    downloadPassword.value = '';
    downloadStatus.classList.add('hidden');
    downloadModal.classList.remove('hidden');
}

function closeModal() {
    downloadModal.classList.add('hidden');
    currentFileId = null;
}

// ==================== DOWNLOAD & DECRYPT FILE ====================
async function handleDownload() {
    const password = downloadPassword.value;
    
    if (!password) {
        showStatus(downloadStatus, '❌ Please enter password', 'error');
        return;
    }
    
    showStatus(downloadStatus, '🔓 Downloading and decrypting...', 'loading');
    
    try {
        const response = await fetch(`${API_URL}/api/download/${currentFileId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });
        
        if (response.ok) {
            // Get the blob (file data)
            const blob = await response.blob();
            
            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'downloaded_file';
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showStatus(downloadStatus, '✅ File downloaded successfully!', 'success');
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeModal();
            }, 2000);
        } else {
            const result = await response.json();
            showStatus(downloadStatus, `❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showStatus(downloadStatus, `❌ Download failed: ${error.message}`, 'error');
    }
}

// ==================== DELETE FILE ====================
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/delete/${fileId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ File deleted successfully!');
            loadFiles(); // Refresh list
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (error) {
        alert(`❌ Delete failed: ${error.message}`);
    }
}

// ==================== HELPER FUNCTIONS ====================
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.classList.remove('hidden');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}