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
    const mapContainer = document.getElementById('map');

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
    const response = await fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
    const event = await response.json();

    if (!event) {
        console.error('Event not found.');
        alert('Event not found.');
        return;
    }

    console.log('Event data:', event);

    // Populating guest list
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

    // Populating gift list
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

    // Populating meal options
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

    // Initializing Google Maps
    const loadGoogleMaps = async () => {
        const mapResponse = await fetch('/load-google-maps');
        const mapData = await mapResponse.json();
        const script = document.createElement('script');
        script.src = mapData.googleMapsScript;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    };

    window.initMap = async function () {
        if (event.eventLocation) {
            const geocoder = new google.maps.Geocoder();

            // Use Google Maps Geocoding to get the location from the address
            geocoder.geocode({ address: event.eventLocation }, (results, status) => {
                if (status === 'OK') {
                    const location = results[0].geometry.location;

                    // Initialize the map with the event's location
                    const map = new google.maps.Map(mapContainer, {
                        center: location,
                        zoom: 15
                    });

                    // Place a marker on the event's location
                    new google.maps.Marker({
                        position: location,
                        map: map,
                        title: event.eventTitle
                    });
                } else {
                    console.error('Geocode was not successful for the following reason:', status);
                    alert('Failed to load the map. Please try again later.');
                }
            });
        }
    };

    // Load Google Maps API and initialize the map
    await loadGoogleMaps();

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