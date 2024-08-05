import { auth } from "../firebase-config.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

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
                const { token } = result;

                localStorage.setItem('authToken', token);
                window.location.href = "../index.html";
            } else {
                alert(result.message || "Login failed. Please try again.");
                console.error('Server Response Error:', result);
            }
        } catch (error) {
            // Handle network or other errors
            alert("An error occurred. Please try again.");
            console.error('Error:', error);
        }
    }
}

document.getElementById('login-form').addEventListener('submit', userSignIn);
document.getElementById('signup-button').addEventListener('click', function() {
    console.log("hello")
});