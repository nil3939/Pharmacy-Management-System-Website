// Function to show the Sign Up form
function showSignUp() {
    document.getElementById('sign-up-section').style.display = 'block';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-management').style.display = 'none';
}

// Function to show the Login form
function showLogin() {
    document.getElementById('sign-up-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('user-management').style.display = 'none';
}

// Handle Sign Up Form submission
document.getElementById('sign-up-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('sign-up-username').value;
    const password = document.getElementById('sign-up-password').value;
    const email = document.getElementById('sign-up-email').value;

    if (username && password && email) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if the username already exists
        const existingUser = users.find(user => user.username === username);
        if (existingUser) {
            document.getElementById('sign-up-message').textContent = 'Username already exists!';
            document.getElementById('sign-up-message').classList.add('error');
        } else {
            // Store the new user in localStorage
            users.push({ username, password, email });
            localStorage.setItem('users', JSON.stringify(users));

            document.getElementById('sign-up-message').textContent = 'User registered successfully!';
            document.getElementById('sign-up-message').classList.add('success');
        }
    } else {
        document.getElementById('sign-up-message').textContent = 'Please fill in all fields.';
        document.getElementById('sign-up-message').classList.add('error');
    }
});

// Handle Login Form submission
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (username && password) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find the user
        const user = users.find(user => user.username === username);

        if (user) {
            if (user.password === password) {
                document.getElementById('login-message').textContent = `Login successful! Welcome back, ${username}!`;
                document.getElementById('login-message').classList.add('success');
            } else {
                document.getElementById('login-message').textContent = 'Incorrect password!';
                document.getElementById('login-message').classList.add('error');
            }
        } else {
            document.getElementById('login-message').textContent = 'User not found!';
            document.getElementById('login-message').classList.add('error');
        }
    } else {
        document.getElementById('login-message').textContent = 'Please fill in all fields.';
        document.getElementById('login-message').classList.add('error');
    }
});
