import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { storage } from "../firebaseConfig.js"; // Import storage from your config

document.addEventListener('DOMContentLoaded', async function () {
    const weddingSelect = document.getElementById('weddingSelect');
    const postForm = document.getElementById('postForm');
    const loggedInUserId = localStorage.getItem('userId');

    if (!loggedInUserId) {
        alert('User is not logged in.');
        window.location.href = '/login-page';
        return;
    }

    // Fetch the user's full name using the endpoint
    const loggedInUserName = await fetchUserName(loggedInUserId);

    if (!loggedInUserName) {
        alert('Unable to fetch user name.');
        return;
    }

    await populateWeddingDropdown(loggedInUserId);

    postForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const selectedWeddingId = weddingSelect.value;
        const selectedWeddingName = weddingSelect.options[weddingSelect.selectedIndex].text;
        const postText = document.getElementById('postText').value;
        const postImage = document.getElementById('postImage').files[0];
        let imageUrl = null;

        if (!selectedWeddingId || !postText) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            if (postImage) {
                // Create a storage reference
                const imageRef = ref(storage, `weddingPosts/${selectedWeddingId}/${loggedInUserId}/${postImage.name}`);
                
                // Upload the file
                await uploadBytes(imageRef, postImage);
                
                // Get the download URL
                imageUrl = await getDownloadURL(imageRef);
            }

            // Prepare the JSON data
            const postData = {
                weddingId: selectedWeddingId,
                weddingName: selectedWeddingName,
                postContent: postText,
                posterName: loggedInUserName,
                imageUrl: imageUrl // Add image URL if exists
            };

            const response = await fetch('/save-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData) // Send as JSON
            });

            const result = await response.json();

            if (response.ok) {
                alert('Post created successfully!');
                window.location.href = '/dashboard-page'; // Redirect to dashboard
            } else {
                throw new Error(result.message || 'Failed to create post.');
            }

        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post. Please try again.');
        }
    });

    async function populateWeddingDropdown(userId) {
        try {
            const ownerEventsResponse = await fetch(`/get-user-events?userId=${encodeURIComponent(userId)}&type=owner`);
            const ownerEvents = await ownerEventsResponse.json();

            const attendeeEventsResponse = await fetch(`/get-user-events?userId=${encodeURIComponent(userId)}&type=attendee`);
            const attendeeEvents = await attendeeEventsResponse.json();

            const allEvents = [...ownerEvents, ...attendeeEvents];

            if (allEvents.length === 0) {
                alert('You are not associated with any weddings.');
                return;
            }

            allEvents.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.eventTitle;
                weddingSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error fetching events:', error);
            alert('Error fetching events.');
        }
    }

    async function fetchUserName(userId) {
        try {
            const response = await fetch(`/get-user-name?userId=${encodeURIComponent(userId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user name');
            }
            const data = await response.json();
            return data.fullName; // Return the full name
        } catch (error) {
            console.error('Error fetching user name:', error);
            return null; // Return null if there's an error
        }
    }
});
