document.addEventListener('DOMContentLoaded', async function () {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    const userId = new URLSearchParams(window.location.search).get('userId');
    const bringGiftCheckbox = document.getElementById('bringGift');
    const giftSelectContainer = document.getElementById('giftSelectContainer');
    const giftSelect = document.getElementById('giftSelect');
    const submitButton = document.getElementById('submitResponse');
    const userStatus = document.getElementById('userStatus');
    const rsvpSection = document.getElementById('rsvpSection');
    const guestSelect = document.getElementById('guestSelect');  // Select the guestSelect dropdown element
    const giftOption = document.getElementById('giftOption'); // Select the giftOption container

    if (!eventId) {
        alert('Event ID is missing from the URL.');
        return;
    }

    // const [userId, eventTitle] = eventId.split('-');

    // Check if the user is logged in
    const loggedInUserId = localStorage.getItem('userId');

    if (!loggedInUserId) {
        // Redirect to login page with return URL
        const returnUrl = window.location.href;
        document.getElementById('loginButton').addEventListener('click', function() {
            window.location.href = `/login-page?returnUrl=${encodeURIComponent(returnUrl)}`;
        });
        
        return;
    }

    // If user is logged in, hide the login section and show RSVP options
    userStatus.style.display = 'none';
    rsvpSection.style.display = 'block';

    // Fetch the event data from the server
    fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`)
    .then(response => response.json())
    .then(event => {
        if (!event) {
            alert('Event not found.');
            return;
        }
        // Populate the guest list dropdown
        if (event.guestList && event.guestList.length > 0) {
            event.guestList.forEach(guest => {
                const option = document.createElement('option');
                option.value = guest.name;
                option.textContent = guest.name;
                guestSelect.appendChild(option);
            });
        } else {
            alert('No guests found for this event.');
        }

        // Populate the gift list dropdown with unclaimed gifts
        if (event.giftList) {
            event.giftList.forEach(gift => {
                if (!gift.claimedBy) { // Show only unclaimed gifts
                    const option = document.createElement('option');
                    option.value = gift.name; // Set the value to the gift name
                    option.textContent = gift.name; // Set the text content to the gift name
                    giftSelect.appendChild(option);
                }
            });
        }
    })
    .catch(error => {
        console.error('Error fetching event data:', error);
        alert('Error fetching event data.');
    });


    // Show the gift options if a guest is selected
    guestSelect.addEventListener('change', function () {
        if (guestSelect.value) {
            giftOption.style.display = 'block';
        } else {
            giftOption.style.display = 'none';
        }
    });

    bringGiftCheckbox.addEventListener('change', function () {
        if (bringGiftCheckbox.checked) {
            giftSelectContainer.style.display = 'block';
        } else {
            giftSelectContainer.style.display = 'none';
        }
    });

    submitButton.addEventListener('click', async function () {
        const bringGift = bringGiftCheckbox.checked;
        const selectedGift = giftSelect.value;
    
        if (bringGift && !selectedGift) {
            alert('Please select a gift to bring.');
            return;
        }
    
        try {
            // Update the user to add the event to their `eventsAttendee` sub-collection
            await fetch(`/update-guest-response?eventId=${encodeURIComponent(eventId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guestName: loggedInUserId, // Use the logged-in user ID
                    bringGift: bringGift,
                    selectedGift: selectedGift
                })
            });
    
            // Add the event's unique ID (eventId) to the user's `eventsAttendee` collection
            await fetch(`/add-event-attendee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: loggedInUserId,
                    eventId: eventId // Store the event UID here
                })
            });
    
            alert('Response submitted successfully!');
            window.location.reload(); // Reload the page to reflect updated gift list
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting response.');
        }
    });    
});
