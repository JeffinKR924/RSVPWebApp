import { auth } from '../firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const authToken = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId');

if (authToken && userId) {
    window.location.href = "/dashboard-page";
}

document.getElementById('get-started-btn').addEventListener('click', () => {
    window.location.href = "/login-page";
});

document.getElementById('learn-more-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('learn-more-section').scrollIntoView({ behavior: 'smooth' });
});

