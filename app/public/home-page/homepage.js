import { auth } from '../firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// const updateUI = (user) => {
//     const loginButton = document.getElementById('login-button');
//     const userEmailDisplay = document.getElementById('user-email');
//     const dropdown = document.getElementById('dropdown-logout');

//     if (user) {
//         // User is signed in
//         loginButton.style.display = 'none';
//         userEmailDisplay.textContent = `${user.email}`;
//         userEmailDisplay.style.display = 'block';
//         userEmailDisplay.addEventListener('click', () => {
//             userEmailDisplay.classList.toggle('active'); // Toggle dropdown visibility
//         });
//     } else {
//         // User is signed out
//         userEmailDisplay.style.display = 'none';
//         dropdown.style.display = 'none';
//     }
// };

// onAuthStateChanged(auth, (user) => {
//     updateUI(user);
// });

// document.getElementById('logout-button').addEventListener('click', async () => {
//     try {
//         await signOut(auth);
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('userId');
//         window.location.href = "/";
//     } catch (error) {
//         console.error('Error signing out:', error);
//         alert('Error signing out. Please try again.');
//     }
// });

document.getElementById('get-started-btn').addEventListener('click', () => {
    window.location.href = "/login-page";
});
