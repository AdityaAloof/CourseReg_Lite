// Registration page functionality

document.addEventListener('DOMContentLoaded', function() {
    if (isLoggedIn()) {
        window.location.href = 'courses.html';
        return;
    }

    const form = document.getElementById('registerForm');
    const errorBox = document.getElementById('regError');
    const statusBox = document.getElementById('regStatus');

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.remove('d-none');
        errorBox.setAttribute('role', 'alert');
    }

    function showStatus(msg, tone = 'success') {
        statusBox.textContent = msg;
        statusBox.classList.remove('d-none');
        statusBox.classList.remove('alert-success', 'alert-info', 'alert-warning', 'alert-danger');
        statusBox.classList.add(`alert-${tone}`);
        statusBox.setAttribute('role', tone === 'info' ? 'status' : 'alert');
    }

    function clearMessages() {
        errorBox.classList.add('d-none');
        statusBox.classList.add('d-none');
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();

        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        const vUser = (window.AuthValidators && AuthValidators.validateUsername) ? AuthValidators.validateUsername(username) : { valid: !!username, errors: username ? [] : ['Username is required.'] };
        const vPass = (window.AuthValidators && AuthValidators.validatePassword) ? AuthValidators.validatePassword(password) : { valid: password && password.length >= 8, errors: password && password.length >= 8 ? [] : ['Password must be at least 8 characters.'] };

        if (!vUser.valid) {
            showError(vUser.errors.join(' '));
            return;
        }
        if (!vPass.valid) {
            showError(vPass.errors.join(' '));
            return;
        }
        if (password !== confirm) {
            showError('Passwords do not match.');
            return;
        }

        try {
            const res = await AuthRegistration.registerUser(username, password);
            if (!res.success) {
                showError(res.message || 'Registration failed.');
                return;
            }
            showStatus('Account created successfully. Redirecting to sign in…', 'success');
            setTimeout(() => {
                window.location.href = 'index.html?registered=1';
            }, 1000);
        } catch (err) {
            showError('Unexpected error during registration.');
            console.error(err);
        }
    });
});
