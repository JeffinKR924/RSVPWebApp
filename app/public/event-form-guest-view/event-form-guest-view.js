document.addEventListener('DOMContentLoaded', async function () {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    const userId = new URLSearchParams(window.location.search).get('userId');
    const bringGiftCheckbox = document.getElementById('bringGift');
    const giftSelectContainer = document.getElementById('giftSelectContainer');
    const giftSelect = document.getElementById('giftSelect');
    const submitButton = document.getElementById('submitResponse');
    const userStatus = document.getElementById('userStatus');
    const rsvpSection = document.getElementById('rsvpSection');
    const guestSelect = document.getElementById('guestSelect'); 
    const giftOption = document.getElementById('giftOption');
    const appetizersSelect = document.getElementById('appetizersSelect');
    const mainCoursesSelect = document.getElementById('mainCoursesSelect');
    const dessertsSelect = document.getElementById('dessertsSelect');

    if (!eventId) {
        alert('Event ID is missing from the URL.');
        return;
    }

    const loggedInUserId = localStorage.getItem('userId');

    if (!loggedInUserId) {
        const returnUrl = window.location.href;
        document.getElementById('loginButton').addEventListener('click', function() {
            window.location.href = `/login-page?returnUrl=${encodeURIComponent(returnUrl)}`;
        });
        return;
    }

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
                if (!gift.claimedBy) {
                    const option = document.createElement('option');
                    option.value = gift.name;
                    option.textContent = gift.name;
                    giftSelect.appendChild(option);
                }
            });
        }

        // Populate the meal options dropdowns
        if (event.mealOptions) {
            event.mealOptions.appetizers.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                appetizersSelect.appendChild(opt);
            });

            event.mealOptions.mainCourses.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                mainCoursesSelect.appendChild(opt);
            });

            event.mealOptions.desserts.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                dessertsSelect.appendChild(opt);
            });
        }
    })
    .catch(error => {
        console.error('Error fetching event data:', error);
        alert('Error fetching event data.');
    });

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
        const selectedAppetizer = appetizersSelect.value;
        const selectedMainCourse = mainCoursesSelect.value;
        const selectedDessert = dessertsSelect.value;

        if (bringGift && !selectedGift) {
            alert('Please select a gift to bring.');
            return;
        }

        try {
            await fetch(`/update-guest-response?eventId=${encodeURIComponent(eventId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guestName: guestSelect.value,
                    bringGift: bringGift,
                    selectedGift: selectedGift,
                    selectedAppetizer: selectedAppetizer,
                    selectedMainCourse: selectedMainCourse,
                    selectedDessert: selectedDessert
                })
            });

            const eventResponse = await fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
            const eventData = await eventResponse.json();

            if (!eventData) {
                alert('Event not found.');
                return;
            }

            await fetch(`/add-event-attendee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: loggedInUserId,
                    eventId: eventId,
                    eventData: eventData
                })
            });

            alert('Response submitted successfully!');
            window.location.reload(); 
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting response.');
        }
    });    
});
