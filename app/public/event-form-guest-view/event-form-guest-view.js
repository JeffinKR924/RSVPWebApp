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

    console.log('Event form guest view script loaded.');
    if (!eventId) {
        console.error('Event ID is missing from the URL.');
        alert('Event ID is missing from the URL.');
        return;
    }

    const loggedInUserId = localStorage.getItem('userId');
    console.log(`Logged in user ID: ${loggedInUserId}`);

    if (!loggedInUserId) {
        const returnUrl = window.location.href;
        console.log('User is not logged in. Redirecting to login page.');
        document.getElementById('loginButton').addEventListener('click', function () {
            window.location.href = `/login-page?returnUrl=${encodeURIComponent(returnUrl)}`;
        });
        return;
    }

    userStatus.style.display = 'none';
    rsvpSection.style.display = 'block';

    console.log(`Fetching event data for eventId: ${eventId} and userId: ${userId}`);
    fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`)
        .then(response => {
            console.log('Event data response received.');
            return response.json();
        })
        .then(event => {
            if (!event) {
                console.error('Event not found.');
                alert('Event not found.');
                return;
            }

            console.log('Event data:', event);

            if (event.guestList && event.guestList.length > 0) {
                console.log('Populating guest list dropdown.');
                event.guestList.forEach(guest => {
                    console.log(`Adding guest to dropdown: ${guest.name}`);
                    const option = document.createElement('option');
                    option.value = guest.name;
                    option.textContent = guest.name;
                    guestSelect.appendChild(option);
                });
            } else {
                console.error('No guests found for this event.');
                alert('No guests found for this event.');
            }

            if (event.giftList) {
                console.log('Populating gift list dropdown.');
                event.giftList.forEach(gift => {
                    if (!gift.claimedBy) {
                        console.log(`Adding gift to dropdown: ${gift.name}`);
                        const option = document.createElement('option');
                        option.value = gift.name;
                        option.textContent = gift.name;
                        giftSelect.appendChild(option);
                    }
                });
            }

            if (event.mealOptions) {
                console.log('Populating meal options.');
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
        console.log(`Guest selected: ${guestSelect.value}`);
        if (guestSelect.value) {
            giftOption.style.display = 'block';
        } else {
            giftOption.style.display = 'none';
        }
    });

    bringGiftCheckbox.addEventListener('change', function () {
        console.log(`Bring gift checkbox changed: ${bringGiftCheckbox.checked}`);
        if (bringGiftCheckbox.checked) {
            giftSelectContainer.style.display = 'block';
        } else {
            giftSelectContainer.style.display = 'none';
        }
    });

    submitButton.addEventListener('click', async function () {
        const bringGift = bringGiftCheckbox.checked;
        const selectedGift = giftSelect.value || null;
        const selectedAppetizer = appetizersSelect.value || null;
        const selectedMainCourse = mainCoursesSelect.value || null;
        const selectedDessert = dessertsSelect.value || null;

        if (bringGift && !selectedGift) {
            console.warn('No gift selected when bring gift checkbox is checked.');
            alert('Please select a gift to bring.');
            return;
        }

        const confirmed = true;
        const claimedGift = !!selectedGift;

        console.log('Submitting guest response with the following data:');
        console.log({
            guestName: guestSelect.value,
            bringGift: bringGift,
            selectedGift: selectedGift,
            selectedAppetizer: selectedAppetizer,
            selectedMainCourse: selectedMainCourse,
            selectedDessert: selectedDessert,
            confirmed: confirmed,
            claimedGift: claimedGift
        });

        try {
            await fetch(`/update-guest-response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventId: eventId,
                    userId: loggedInUserId,
                    guestName: guestSelect.value,
                    bringGift: bringGift,
                    selectedGift: selectedGift,
                    selectedAppetizer: selectedAppetizer,
                    selectedMainCourse: selectedMainCourse,
                    selectedDessert: selectedDessert,
                    confirmed: confirmed,
                    claimedGift: claimedGift 
                })
            });

            console.log('Guest response successfully submitted.');

            const eventResponse = await fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
            const eventData = await eventResponse.json();

            if (!eventData) {
                console.error('Event not found after response submission.');
                alert('Event not found.');
                return;
            }

            console.log('Updating event attendee data.');
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
            console.error('Error submitting guest response:', error);
            alert('Error submitting response.');
        }
    });
});
