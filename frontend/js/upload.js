// ============================================
// CloudSentinel - Upload Page Logic
// ============================================

// Check authentication
if (!requireAuth()) {
    // Will redirect if not authenticated
}

// Load user info
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    setupFileHandlers();
});

function loadUserInfo() {
    const user = getUser();
    if (user) {
        document.getElementById('currentUsername').textContent = user.username;
    }
}

// ============================================
// File Handling
// ============================================

let selectedFile = null;

function setupFileHandlers() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-purple)';
        dropZone.style.background = 'rgba(102, 126, 234, 0.1)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-color)';
        dropZone.style.background = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-color)';
        dropZone.style.background = 'transparent';

        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
}

function handleFileSelect(file) {
    selectedFile = file;

    // Show selected file info
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('selectedFile').style.display = 'block';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
}

function clearFile() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('selectedFile').style.display = 'none';
    clearFormMessage('uploadStatus');
}

// ============================================
// Upload Form Handler
// ============================================

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        showFormMessage('uploadStatus', 'Please select a file to upload', 'error');
        return;
    }

    const password = document.getElementById('uploadPassword').value;
    const allowedUsers = document.getElementById('allowedUsers').value.trim();
    const accessStartTime = document.getElementById('accessStartTime').value;
    const accessEndTime = document.getElementById('accessEndTime').value;
    const allowedRegions = document.getElementById('allowedRegions').value.trim();

    const submitButton = e.target.querySelector('button[type="submit"]');

    // Validation
    if (!password || password.length < 6) {
        showFormMessage('uploadStatus', 'Password must be at least 6 characters', 'error');
        return;
    }

    // Set loading state
    setButtonLoading(submitButton, true);
    showFormMessage('uploadStatus', '🔐 Encrypting and uploading your file...', 'loading');

    try {
        // Prepare access control settings
        const accessControl = {
            allowedUsers: allowedUsers || undefined,
            accessStartTime: accessStartTime,
            accessEndTime: accessEndTime,
            allowedRegions: allowedRegions
        };

        // Upload file
        const result = await uploadFile(selectedFile, password, accessControl);

        if (result.status === 200 && result.data.success) {
            // Success!
            showFormMessage('uploadStatus', `✅ ${result.data.message}`, 'success');
            showNotification('File uploaded successfully! 🎉', 'success');

            // Show upload details
            const details = `
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(79, 172, 254, 0.1); border-radius: 8px; border-left: 4px solid var(--accent-cyan);">
                    <p style="margin: 0 0 0.5rem 0; font-weight: 600;">Upload Details:</p>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem;">📄 File: ${result.data.original_filename}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem;">💾 Original Size: ${formatFileSize(result.data.original_size)}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem;">🔐 Encrypted Size: ${formatFileSize(result.data.encrypted_size)}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem;">👥 Allowed Users: ${result.data.access_control.allowed_users.join(', ')}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem;">⏰ Access Window: ${result.data.access_control.time_window}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem;">🌍 Allowed Regions: ${result.data.access_control.allowed_regions.join(', ')}</p>
                </div>
            `;
            
            document.getElementById('uploadStatus').innerHTML += details;

            // Reset form after 3 seconds
            setTimeout(() => {
                document.getElementById('uploadForm').reset();
                clearFile();
                clearFormMessage('uploadStatus');
                setButtonLoading(submitButton, false);
            }, 5000);
        } else {
            // Upload failed
            showFormMessage('uploadStatus', `❌ ${result.data.message}`, 'error');
            setButtonLoading(submitButton, false);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showFormMessage('uploadStatus', `❌ Upload failed: ${error.message}`, 'error');
        setButtonLoading(submitButton, false);
    }
});

// ============================================
// Logout Function
// ============================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearToken();
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 500);
    }
}