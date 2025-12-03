// Authentication, session management, and lightweight security controls

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_DURATION_MS = 5 * 60 * 1000;
const SECURITY_STORE_KEY = 'crl_security_store';
const SECURITY_EVENTS_KEY = 'crl_security_events';
const LOGOUT_REASON_KEY = 'crl_last_logout_reason';
const USERS_STORE_KEY = 'crl_users_store';
const REMEMBER_SESSION_KEY = 'crl_remember_session';
const REMEMBER_USERNAME_KEY = 'crl_remember_username';
let sessionWatchdogInitialized = false;

function authHardeningEnabled() {
    return !window.FeatureFlags || FeatureFlags.get('strictAuthGuards') !== false;
}

function markSessionActivity() {
    sessionStorage.setItem('lastActivity', Date.now().toString());
}

function isSessionExpired() {
    const lastActivity = parseInt(sessionStorage.getItem('lastActivity'), 10);
    if (!lastActivity || Number.isNaN(lastActivity)) {
        return false;
    }
    return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

function ensureSessionWatchdog() {
    if (sessionWatchdogInitialized || typeof document === 'undefined' || !authHardeningEnabled()) {
        return;
    }
    sessionWatchdogInitialized = true;
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    const throttledMark = throttle(markSessionActivity, 1000);
    events.forEach(evt => document.addEventListener(evt, throttledMark, { passive: true }));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            markSessionActivity();
        }
    });
    markSessionActivity();
    setInterval(() => {
        if (isLoggedIn() && isSessionExpired()) {
            logout('Session closed after 15 minutes of inactivity');
        }
    }, 60000);
}

document.addEventListener('DOMContentLoaded', ensureSessionWatchdog);

// Initialize auth store (seed demo users) on first load
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthStore();
});

function throttle(fn, delay) {
    let lastRun = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastRun >= delay) {
            lastRun = now;
            fn(...args);
        }
    };
}

// Check if user is logged in
function isLoggedIn() {
    const ssLogged = sessionStorage.getItem('loggedIn') === 'true' && sessionStorage.getItem('username') !== null;
    const lsLogged = localStorage.getItem(REMEMBER_SESSION_KEY) === 'true' && localStorage.getItem(REMEMBER_USERNAME_KEY) !== null;
    return ssLogged || lsLogged;
}

// Get current username
function getCurrentUser() {
    return sessionStorage.getItem('username') || localStorage.getItem(REMEMBER_USERNAME_KEY);
}

// User store helpers
function readUsers() {
    const raw = localStorage.getItem(USERS_STORE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}

function writeUsers(users) {
    localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
}

function getUser(username) {
    const users = readUsers();
    return users.find(u => u.username === username) || null;
}

async function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) {
        // Extremely lightweight fallback (NOT cryptographically secure, demo only)
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
    }
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(username, password) {
    // Per-user salt using username; for demo purposes only
    return sha256Hex(`${username}:${password}`);
}

function validateUsername(username) {
    const errors = [];
    if (!username || typeof username !== 'string') {
        errors.push('Username is required.');
    } else {
        if (username.length < 3 || username.length > 32) {
            errors.push('Username must be 3–32 characters.');
        }
        if (!/^[A-Za-z0-9._-]+$/.test(username)) {
            errors.push('Username can include letters, numbers, . _ -');
        }
    }
    return { valid: errors.length === 0, errors };
}

function validatePassword(password) {
    const errors = [];
    if (!password || typeof password !== 'string') {
        errors.push('Password is required.');
    } else {
        if (password.trim() !== password) {
            errors.push('No leading or trailing spaces.');
        }
        if (password.length < 8) {
            errors.push('At least 8 characters.');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Include a lowercase letter.');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Include an uppercase letter.');
        }
        if (!/\d/.test(password)) {
            errors.push('Include a digit.');
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('Include a symbol.');
        }
    }
    return { valid: errors.length === 0, errors };
}

async function initializeAuthStore() {
    // Ensure store exists; no seeding of demo users
    const users = readUsers();
    if (!Array.isArray(users)) {
        writeUsers([]);
    }
}

// Registration function
async function registerUser(username, password) {
    const u = validateUsername(username);
    const p = validatePassword(password);
    if (!u.valid || !p.valid) {
        return { success: false, message: [...u.errors, ...p.errors].join(' ') };
    }
    if (getUser(username)) {
        return { success: false, message: 'Username is already taken.' };
    }
    const users = readUsers();
    const passwordHash = await hashPassword(username, password);
    users.push({ username, passwordHash, role: 'student', createdAt: new Date().toISOString() });
    writeUsers(users);
    recordSecurityEvent('REGISTER', `${username} registered successfully`);
    return { success: true };
}

// Login function (async)
async function login(username, password) {
    if (authHardeningEnabled() && isLoginLocked(username)) {
        return false;
    }
    const user = getUser(username);
    if (user) {
        const hash = await hashPassword(username, password);
        if (hash === user.passwordHash) {
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('username', username);
            markSessionActivity();
            if (authHardeningEnabled()) {
                resetLoginFailures(username);
            }
            recordSecurityEvent('LOGIN_SUCCESS', `${username} logged in successfully`);
            return true;
        }
    }
    if (authHardeningEnabled()) {
        recordLoginFailure(username);
    }
    return false;
}

// Logout function
function logout(reason) {
    if (reason) {
        localStorage.setItem(LOGOUT_REASON_KEY, reason);
    }
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('cart');
    sessionStorage.removeItem('lastActivity');
    localStorage.removeItem(REMEMBER_SESSION_KEY);
    localStorage.removeItem(REMEMBER_USERNAME_KEY);
    window.location.href = 'index.html';
}

// Protect routes - redirect to login if not authenticated
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    if (authHardeningEnabled()) {
        if (isSessionExpired()) {
            logout('Session closed after 15 minutes of inactivity');
            return false;
        }
        markSessionActivity();
    }
    return true;
}

function consumeLogoutReason() {
    const reason = localStorage.getItem(LOGOUT_REASON_KEY);
    if (reason) {
        localStorage.removeItem(LOGOUT_REASON_KEY);
        return reason;
    }
    return null;
}

function readSecurityStore() {
    const raw = localStorage.getItem(SECURITY_STORE_KEY);
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Security store parse failed, resetting.', error);
        localStorage.removeItem(SECURITY_STORE_KEY);
        return {};
    }
}

function writeSecurityStore(store) {
    localStorage.setItem(SECURITY_STORE_KEY, JSON.stringify(store));
}

function getUserSecurityState(username) {
    const store = readSecurityStore();
    return store[username] || { attempts: [], lockUntil: 0 };
}

function saveUserSecurityState(username, state) {
    const store = readSecurityStore();
    store[username] = state;
    writeSecurityStore(store);
}

function pruneAttempts(attempts, now) {
    return attempts.filter(ts => now - ts < LOGIN_ATTEMPT_WINDOW_MS);
}

function recordLoginFailure(username) {
    if (!authHardeningEnabled()) {
        return;
    }
    if (!username) {
        return;
    }
    const now = Date.now();
    const state = getUserSecurityState(username);
    state.attempts = pruneAttempts(state.attempts || [], now);
    state.attempts.push(now);
    if (state.attempts.length >= MAX_LOGIN_ATTEMPTS) {
        state.lockUntil = now + LOGIN_LOCK_DURATION_MS;
        recordSecurityEvent('LOCKOUT', `${username} locked for ${LOGIN_LOCK_DURATION_MS / 60000} minutes`);
    }
    saveUserSecurityState(username, state);
}

function resetLoginFailures(username) {
    if (!authHardeningEnabled()) {
        return;
    }
    if (!username) {
        return;
    }
    saveUserSecurityState(username, { attempts: [], lockUntil: 0 });
}

function getRemainingLoginAttempts(username) {
    if (!authHardeningEnabled()) {
        return MAX_LOGIN_ATTEMPTS;
    }
    if (!username) {
        return MAX_LOGIN_ATTEMPTS;
    }
    const now = Date.now();
    const state = getUserSecurityState(username);
    const cleaned = pruneAttempts(state.attempts || [], now);
    if (cleaned.length !== (state.attempts || []).length) {
        state.attempts = cleaned;
        saveUserSecurityState(username, state);
    }
    return Math.max(0, MAX_LOGIN_ATTEMPTS - cleaned.length);
}

function isLoginLocked(username) {
    if (!authHardeningEnabled()) {
        return false;
    }
    if (!username) {
        return false;
    }
    const state = getUserSecurityState(username);
    if (state.lockUntil && state.lockUntil > Date.now()) {
        return true;
    }
    if (state.lockUntil && state.lockUntil <= Date.now()) {
        resetLoginFailures(username);
    }
    return false;
}

function getLoginLockInfo(username) {
    if (!authHardeningEnabled()) {
        return { locked: false, remainingMs: 0 };
    }
    if (!username) {
        return { locked: false, remainingMs: 0 };
    }
    const state = getUserSecurityState(username);
    if (state.lockUntil && state.lockUntil > Date.now()) {
        return { locked: true, remainingMs: state.lockUntil - Date.now() };
    }
    return { locked: false, remainingMs: 0 };
}

function recordSecurityEvent(type, detail) {
    const eventsRaw = localStorage.getItem(SECURITY_EVENTS_KEY);
    let events = [];
    if (eventsRaw) {
        try {
            events = JSON.parse(eventsRaw);
        } catch (error) {
            events = [];
        }
    }
    events.unshift({ type, detail, at: new Date().toISOString() });
    events = events.slice(0, 20);
    localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(events));
}

function getRecentSecurityEvents() {
    const eventsRaw = localStorage.getItem(SECURITY_EVENTS_KEY);
    if (!eventsRaw) {
        return [];
    }
    try {
        return JSON.parse(eventsRaw);
    } catch (error) {
        return [];
    }
}

window.SecurityEvents = {
    getRecentSecurityEvents
};

// Expose validators (optional use from other modules)
window.AuthValidators = {
    validateUsername,
    validatePassword
};

// Expose selected functions for registration
window.AuthRegistration = {
    registerUser
};

// Remember-me helpers
function enableRememberSession(username) {
    localStorage.setItem(REMEMBER_SESSION_KEY, 'true');
    localStorage.setItem(REMEMBER_USERNAME_KEY, username);
}

function disableRememberSession() {
    localStorage.removeItem(REMEMBER_SESSION_KEY);
    localStorage.removeItem(REMEMBER_USERNAME_KEY);
}

function isRememberEnabled() {
    return localStorage.getItem(REMEMBER_SESSION_KEY) === 'true';
}

function getRememberedUsername() {
    return localStorage.getItem(REMEMBER_USERNAME_KEY) || '';
}

window.AuthRemember = {
    enableRememberSession,
    disableRememberSession,
    isRememberEnabled,
    getRememberedUsername
};

