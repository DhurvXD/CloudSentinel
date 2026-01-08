// ============================================
// CloudSentinel - API Handler
// ============================================

const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Make API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add authorization header if token exists
    const token = getToken();
    if (token && !options.skipAuth) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    try {
        const response = await fetch(url, options);
        
        // Handle 401 Unauthorized
        if (response.status === 401 && !options.skipAuth) {
            clearToken();
            window.location.href = '/index.html';
            throw new Error('Session expired. Please login again.');
        }

        return response;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// ============================================
// Authentication APIs
// ============================================

/**
 * Register new user
 */
async function register(username, email, password) {
    const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        skipAuth: true
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * Login user
 */
async function login(username, password) {
    const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        skipAuth: true
    });

    const data = await response.json();
    
    // Store token and user info if successful
    if (response.status === 200 && data.success) {
        storeToken(data.access_token);
        storeUser(data.user);
    }
    
    return { status: response.status, data };
}

/**
 * Get current user info
 */
async function getUserInfo() {
    const response = await apiRequest('/api/auth/me', {
        method: 'GET'
    });

    const data = await response.json();
    return { status: response.status, data };
}

// ============================================
// File APIs
// ============================================

/**
 * Upload and encrypt file
 */
async function uploadFile(file, password, accessControl = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    
    // Add access control settings
    if (accessControl.allowedUsers) {
        formData.append('allowed_users', accessControl.allowedUsers);
    }
    if (accessControl.accessStartTime) {
        formData.append('access_start_time', accessControl.accessStartTime);
    }
    if (accessControl.accessEndTime) {
        formData.append('access_end_time', accessControl.accessEndTime);
    }
    if (accessControl.allowedRegions) {
        formData.append('allowed_regions', accessControl.allowedRegions);
    }

    const response = await apiRequest('/api/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * Download and decrypt file
 */
async function downloadFile(fileId, password) {
    const response = await apiRequest(`/api/download/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (response.status === 200) {
        // Return blob for file download
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : 'download';
        
        return { status: 200, blob, filename };
    } else {
        const data = await response.json();
        return { status: response.status, data };
    }
}

/**
 * List all accessible files
 */
async function listFiles() {
    const response = await apiRequest('/api/files', {
        method: 'GET'
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * List user's own files
 */
async function listMyFiles() {
    const response = await apiRequest('/api/files/my', {
        method: 'GET'
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * Share file (update permissions)
 */
async function shareFile(fileId, permissions) {
    const response = await apiRequest(`/api/files/${fileId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * Delete file
 */
async function deleteFile(fileId) {
    const response = await apiRequest(`/api/files/${fileId}`, {
        method: 'DELETE'
    });

    const data = await response.json();
    return { status: response.status, data };
}

// ============================================
// Audit APIs
// ============================================

/**
 * Get user's activity logs
 */
async function getMyActivity(limit = 50) {
    const response = await apiRequest(`/api/audit/me?limit=${limit}`, {
        method: 'GET'
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * Get file activity logs
 */
async function getFileActivity(fileId, limit = 50) {
    const response = await apiRequest(`/api/audit/file/${fileId}?limit=${limit}`, {
        method: 'GET'
    });

    const data = await response.json();
    return { status: response.status, data };
}

/**
 * Get security report
 */
async function getSecurityReport() {
    const response = await apiRequest('/api/audit/report', {
        method: 'GET'
    });

    const data = await response.json();
    return { status: response.status, data };
}