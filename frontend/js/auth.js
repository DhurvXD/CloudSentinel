// ============================================
// CloudSentinel - Authentication Logic
// ============================================

// Check if already logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        // Redirect to dashboard if already logged in
        window.location.href = 'pages/dashboard.html';
    }
});

// ============================================
// Show/Hide Forms
// ============================================

function showLogin() {
    hideElement('registerForm');
    showElement('loginForm');
    clearFormMessage('registerMessage');
}

function showRegister() {
    hideElement('loginForm');
    showElement('registerForm');
    clearFormMessage('loginMessage');
}

// ============================================
// Login Form Handler
// ============================================

document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Clear previous messages
    clearFormMessage('loginMessage');
    
    // Validation
    if (!username || !password) {
        showFormMessage('loginMessage', 'Please enter username and password', 'error');
        return;
    }
    
    // Set loading state
    setButtonLoading(submitButton, true);
    
    try {
        // Call login API
        const result = await login(username, password);
        
        if (result.status === 200 && result.data.success) {
            // Success!
            showFormMessage('loginMessage', 'Login successful! Redirecting...', 'success');
            showNotification('Welcome back to CloudSentinel! 🛡️', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 1000);
        } else {
            // Login failed
            showFormMessage('loginMessage', result.data.message || 'Login failed', 'error');
            setButtonLoading(submitButton, false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showFormMessage('loginMessage', 'An error occurred. Please try again.', 'error');
        setButtonLoading(submitButton, false);
    }
});

// ============================================
// Register Form Handler
// ============================================

document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Clear previous messages
    clearFormMessage('registerMessage');
    
    // Validation
    if (!username || !email || !password || !passwordConfirm) {
        showFormMessage('registerMessage', 'Please fill in all fields', 'error');
        return;
    }
    
    if (username.length < 3) {
        showFormMessage('registerMessage', 'Username must be at least 3 characters', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormMessage('registerMessage', 'Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showFormMessage('registerMessage', 'Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showFormMessage('registerMessage', 'Passwords do not match', 'error');
        return;
    }
    
    // Set loading state
    setButtonLoading(submitButton, true);
    
    try {
        // Call register API
        const result = await register(username, email, password);
        
        if (result.status === 201 && result.data.success) {
            // Success!
            showFormMessage('registerMessage', 'Account created successfully! Please sign in.', 'success');
            showNotification('Account created! Welcome to CloudSentinel! 🎉', 'success');
            
            // Switch to login form after short delay
            setTimeout(() => {
                document.getElementById('loginUsername').value = username;
                showLogin();
                setButtonLoading(submitButton, false);
            }, 2000);
        } else {
            // Registration failed
            showFormMessage('registerMessage', result.data.message || 'Registration failed', 'error');
            setButtonLoading(submitButton, false);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showFormMessage('registerMessage', 'An error occurred. Please try again.', 'error');
        setButtonLoading(submitButton, false);
    }
});

// ============================================
// Enter key handling for better UX
// ============================================

document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginFormElement').dispatchEvent(new Event('submit'));
    }
});

document.getElementById('registerPasswordConfirm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('registerFormElement').dispatchEvent(new Event('submit'));
    }
});