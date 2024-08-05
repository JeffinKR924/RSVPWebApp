import { auth } from "../firebase-config.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const userSignUp = async() => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confPassword = document.getElementById('confPassword').value;

    if (username === '' || password === '' || confPassword === '') {
        alert('Please fill in all fields.');
    } else if (password != confPassword) {
        alert('Passwords need to match');
    } else {
        signInWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert("You have signed in successfully");
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Incorrect username or password");
            console.log(errorCode + errorMessage);
        })
    }
}

document.getElementById('signup-form').addEventListener('submit', userSignUp);
document.getElementById('login-button').addEventListener('click', function() {
    console.log("hello")
});