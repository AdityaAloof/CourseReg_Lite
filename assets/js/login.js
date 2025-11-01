// Login page functionality

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // If already logged in, redirect to courses
    if (isLoggedIn()) {
        window.location.href = 'courses.html';
        return;
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        errorMessage.classList.add('d-none');

        if (login(username, password)) {
            // Success - redirect to courses page
            window.location.href = 'courses.html';
        } else {
            // Show error
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.classList.remove('d-none');
            errorMessage.setAttribute('role', 'alert');
        }
    });
});

