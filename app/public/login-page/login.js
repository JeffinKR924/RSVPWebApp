import { auth } from '../firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const userSignIn = async() => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === '' || password === '') {
        alert('Please fill in both fields.');
    } else {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, username, password);
            const user = userCredential.user;

            const token = await user.getIdToken();
            const userId = user.uid;

            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', userId);
            window.location.href = "/";
        } catch (error) {
            alert("Incorrect Username or Password");
        }
    }
}

document.getElementById('login-form').addEventListener('submit', userSignIn);
document.getElementById('signup-button').addEventListener('click', function() {
    window.location.href = '/signup-page';
});

document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});