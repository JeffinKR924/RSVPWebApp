import { auth } from '../firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


const updateUI = (user) => {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userEmailDisplay = document.getElementById('user-email');

    if (user) {
        // User is signed in
        loginButton.style.display = 'none';
        userEmailDisplay.textContent = `${user.email}`;
        userEmailDisplay.style.display = 'block';
    } else {
        // User is signed out 
        userEmailDisplay.style.display = 'none'; 
        logoutButton.style.display = 'none'; 
    }
};

onAuthStateChanged(auth, (user) => {
    updateUI(user);
});

document.getElementById('logout-button').addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        window.location.href = "/login-page";
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
});