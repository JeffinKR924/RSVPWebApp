// Import necessary Firebase functions
import { auth } from '../firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid; // Get the logged-in user's ID

    try {
      // Make a GET request to the new endpoint to fetch user information
      const response = await fetch(`/get-user-info?userId=${encodeURIComponent(userId)}`);
      
      if (response.ok) {
        const userData = await response.json();

        // Display user information on the profile page
        document.getElementById('firstName').textContent = userData.firstName || 'N/A';
        document.getElementById('lastName').textContent = userData.lastName || 'N/A';
        document.getElementById('email').textContent = userData.email || 'N/A';

        // Format and display the createdAt date
        const createdAtDate = new Date(userData.createdAt);
        document.getElementById('createdAt').textContent = createdAtDate.toDateString();
      } else {
        console.error('Failed to fetch user info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  } else {
    // Redirect to login page if not logged in
    window.location.href = '/login-page';
  }
});
