// ============================================
// CloudSentinel - Dashboard Logic
// ============================================

// Require authentication
if (!requireAuth()) {
    // Redirect handled in requireAuth()
}

// Load dashboard on page ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadDashboardStats();
    await loadRecentFiles();
});

/**
 * Load logged-in user info
 */
async function loadUserInfo() {
    try {
        const user = getUser();

        if (user) {
            renderUser(user);
        } else {
            const result = await getUserInfo();
            if (result.status === 200 && result.data.success) {
                storeUser(result.data.user);
                renderUser(result.data.user);
            }
        }
    } catch (error) {
        console.error('User info error:', error);
    }
}

function renderUser(user) {
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent =
        user.username.charAt(0).toUpperCase();
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const allFiles = await listFiles();
        const myFiles = await listMyFiles();
        const auditLogs = await getMyActivity(100);

        if (allFiles.status === 200 && myFiles.status === 200) {
            const total = Object.keys(myFiles.data.files || {}).length;
            const shared =
                Object.keys(allFiles.data.files || {}).length - total;

            document.getElementById('totalFiles').textContent = total;
            document.getElementById('sharedFiles').textContent =
                Math.max(0, shared);
        }

        if (auditLogs.status === 200 && auditLogs.data.success) {
            const attempts = auditLogs.data.logs.filter(
                log =>
                    log.event_type === 'FILE_DOWNLOAD' ||
                    log.event_type === 'ACCESS_DENIED'
            ).length;

            document.getElementById('accessAttempts').textContent = attempts;
        }
    } catch (error) {
        console.error('Stats load error:', error);
    }
}

/**
 * Load recent files
 */
async function loadRecentFiles() {
    try {
        const result = await listFiles();

        if (result.status !== 200 || !result.data.success) return;

        const files = result.data.files;
        const ids = Object.keys(files);

        if (ids.length === 0) return;

        const recent = ids.slice(0, 6);
        const html = recent
            .map(id => createFileCard(id, files[id]))
            .join('');

        document.getElementById('recentFilesContainer').innerHTML = `
            <div class="files-grid">
                ${html}
            </div>
        `;
    } catch (error) {
        console.error('Recent files error:', error);
    }
}

/**
 * Create file card HTML
 */
function createFileCard(fileId, meta) {
    return `
    <div class="file-card">
        <div class="file-header">
            <div class="file-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                </svg>
            </div>
            <div class="file-info">
                <div class="file-name">${meta.original_filename}</div>
                <div class="file-meta">Owner: ${meta.owner}</div>
            </div>
        </div>

        <div class="file-details">
            <div class="detail-item">
                <div class="detail-label">Uploaded</div>
                <div class="detail-value">${formatDate(meta.uploaded_at)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Access</div>
                <div class="detail-value">
                    ${meta.access_start_time} - ${meta.access_end_time}
                </div>
            </div>
        </div>

        <div class="file-actions">
            <button class="btn btn-primary" style="width:100%;"
                onclick="downloadFilePrompt('${fileId}', '${meta.original_filename}')">
                Download
            </button>
        </div>
    </div>
    `;
}

/**
 * Download file with password prompt
 */
async function downloadFilePrompt(fileId, filename) {
    const password = prompt(`Enter password to decrypt "${filename}"`);
    if (!password) return;

    try {
        showNotification('Downloading file...', 'success');
        const result = await downloadFile(fileId, password);

        if (result.status === 200) {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();

            showNotification('Download successful', 'success');
        } else {
            showNotification(result.data.message || 'Download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download error', 'error');
    }
}

/**
 * Logout
 */
function logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    clearToken();
    showNotification('Logged out', 'success');

    setTimeout(() => {
        window.location.href = '../index.html';
    }, 800);
}
