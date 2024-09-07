import { auth } from '../firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid; 

    try {
      const response = await fetch(`/get-user-info?userId=${encodeURIComponent(userId)}`);
      
      if (response.ok) {
        const userData = await response.json();

        document.getElementById('firstName').textContent = userData.firstName || 'N/A';
        document.getElementById('lastName').textContent = userData.lastName || 'N/A';
        document.getElementById('email').textContent = userData.email || 'N/A';

        const createdAtDate = new Date(userData.createdAt);
        document.getElementById('createdAt').textContent = createdAtDate.toDateString();
      } else {
        console.error('Failed to fetch user info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  } else {
    window.location.href = '/login-page';
  }
});
