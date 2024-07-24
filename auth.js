document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    const validUsername = "user";
    const validPassword = "password";

    function login(event) {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username === validUsername && password === validPassword) {
            localStorage.setItem('isAuthenticated', 'true');
            alert('Login successful!');
            window.location.href = "index.html"; 
        } else {
            alert('Invalid username or password.');
        }
    }

    function logout() {
        localStorage.removeItem('isAuthenticated');
        alert('Logged out successfully.');
        window.location.href = "login.html"; 
    }

    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Redirect to login page if not authenticated
    if (!localStorage.getItem('isAuthenticated') && window.location.pathname !== '/login.html') {
        window.location.href = "login.html";
    }
});
