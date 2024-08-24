import { auth } from '../firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const userSignIn = async(event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');  // Get `returnUrl` from the query string

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

            if (returnUrl && returnUrl !== 'null') {
                window.location.href = returnUrl;
            } else {
                window.location.href = "/dashboard-page";
            }
        } catch (error) {
            alert("Incorrect Username or Password");
        }
    }
}

document.getElementById('login-form').addEventListener('submit', userSignIn);
document.getElementById('signup-button').addEventListener('click', function() {
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    if (returnUrl && returnUrl !== 'null') {
        window.location.href = `/signup-page?returnUrl=${encodeURIComponent(returnUrl)}`; 
    } else {
        window.location.href = `/signup-page`;  
    }
});

document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});
