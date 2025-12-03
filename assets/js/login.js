// Login page functionality

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const statusMessage = document.getElementById('statusMessage');

    if (isLoggedIn()) {
        window.location.href = 'courses.html';
        return;
    }

    const logoutReason = consumeLogoutReason();
    if (logoutReason) {
        showStatus(logoutReason, 'warning');
    }

    // Show status if redirected after registration
    try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('registered') === '1') {
            showStatus('Account created successfully. Please sign in.', 'info');
        }
    } catch {}

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        clearMessages();

        // Basic client-side validation
        const vUser = (window.AuthValidators && AuthValidators.validateUsername) ? AuthValidators.validateUsername(username) : { valid: !!username, errors: username ? [] : ['Username is required.'] };
        if (!vUser.valid) {
            showError(vUser.errors.join(' '));
            return;
        }
        if (!password) {
            showError('Password is required.');
            return;
        }

        if (isStrictAuthEnabled()) {
            const lockInfo = getLoginLockInfo(username);
            if (lockInfo.locked) {
                showStatus(`Too many failed attempts. Try again in ${formatDuration(lockInfo.remainingMs)}.`, 'danger');
                return;
            }

            if (await login(username, password)) {
                const remember = document.getElementById('rememberMe')?.checked;
                if (remember && window.AuthRemember) {
                    AuthRemember.enableRememberSession(username);
                } else if (window.AuthRemember) {
                    AuthRemember.disableRememberSession();
                }
                window.location.href = 'courses.html';
                return;
            }

            const updatedLockInfo = getLoginLockInfo(username);
            if (updatedLockInfo.locked) {
                showStatus(`Too many failed attempts. Try again in ${formatDuration(updatedLockInfo.remainingMs)}.`, 'danger');
                return;
            }

            const attemptsLeft = getRemainingLoginAttempts(username);
            showError(`Invalid username or password. ${attemptsLeft} attempt(s) remaining before temporary lockout.`);
            return;
        }

        if (await login(username, password)) {
            const remember = document.getElementById('rememberMe')?.checked;
            if (remember && window.AuthRemember) {
                AuthRemember.enableRememberSession(username);
            } else if (window.AuthRemember) {
                AuthRemember.disableRememberSession();
            }
            window.location.href = 'courses.html';
        } else {
            showError('Invalid username or password.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        errorMessage.setAttribute('role', 'alert');
    }

    function showStatus(message, tone = 'warning') {
        statusMessage.textContent = message;
        statusMessage.classList.remove('d-none');
        statusMessage.classList.remove('alert-warning', 'alert-info', 'alert-danger');
        statusMessage.classList.add(`alert-${tone}`);
        statusMessage.setAttribute('role', tone === 'info' ? 'status' : 'alert');
    }

    function clearMessages() {
        errorMessage.classList.add('d-none');
        statusMessage.classList.add('d-none');
    }

    function formatDuration(ms) {
        if (!ms || ms <= 0) {
            return 'a few moments';
        }
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
        }
        return `${seconds}s`;
    }

    function isStrictAuthEnabled() {
        return !window.FeatureFlags || FeatureFlags.get('strictAuthGuards') !== false;
    }

    // Prefill username if remembered
    if (window.AuthRemember) {
        const remembered = AuthRemember.getRememberedUsername();
        if (remembered) {
            const u = document.getElementById('username');
            if (u) u.value = remembered;
        }
    }
});

