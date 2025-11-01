// Authentication and session management

const VALID_USERS = {
    'student1': 'student123',
    'student2': 'student123'
};

// Check if user is logged in
function isLoggedIn() {
    return sessionStorage.getItem('loggedIn') === 'true' && 
           sessionStorage.getItem('username') !== null;
}

// Get current username
function getCurrentUser() {
    return sessionStorage.getItem('username');
}

// Login function
function login(username, password) {
    if (VALID_USERS[username] && VALID_USERS[username] === password) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('username', username);
        return true;
    }
    return false;
}

// Logout function
function logout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('cart');
    window.location.href = 'index.html';
}

// Protect routes - redirect to login if not authenticated
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

