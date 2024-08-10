const userSignIn = async() => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === '' || password === '') {
        alert('Please fill in both fields.');
    } else {
        try {
            // Send login request to server
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: username, password })
            });

            const result = await response.json();

            if (response.ok) {
                const { token, userId } = result;

                localStorage.setItem('authToken', token);
                localStorage.setItem('userId', userId);
                window.location.href = "../index.html";
            } else {
                alert(result.message || "Login failed. Please try again.");
                console.error('Server Response Error:', result);
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
            console.error('Error:', error);
        }
    }
}

document.getElementById('login-form').addEventListener('submit', userSignIn);
document.getElementById('signup-button').addEventListener('click', function() {
    window.location.href = '/signup-page';
});