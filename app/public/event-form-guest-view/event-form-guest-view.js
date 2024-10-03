document.addEventListener('DOMContentLoaded', async function () {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    const userId = new URLSearchParams(window.location.search).get('userId');
    const bringGiftCheckbox = document.getElementById('bringGift');
    const giftSelectContainer = document.getElementById('giftSelectContainer');
    const giftSelect = document.getElementById('giftSelect');
    const submitButton = document.getElementById('submitResponse');
    const submitAttendanceButton = document.getElementById('submitAttendance');
    const userStatus = document.getElementById('userStatus');
    const rsvpSection = document.getElementById('rsvpSection');
    const guestSelect = document.getElementById('guestSelect');
    const attendanceSelect = document.getElementById('attendanceSelect');
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
            document.getElementById('attendanceOption').style.display = 'block';
        } else {
            document.getElementById('attendanceOption').style.display = 'none';
        }
    });

    attendanceSelect.addEventListener('change', function () {
        const selectedOption = attendanceSelect.value;
        if (selectedOption === 'confirm') {
            giftOption.style.display = 'block';
            submitButton.style.display = 'block';
            submitAttendanceButton.style.display = 'none';
        } else if (selectedOption === 'decline' || selectedOption === 'undecided') {
            giftOption.style.display = 'none';
            submitAttendanceButton.style.display = 'block';
            submitButton.style.display = 'none';
        } else {
            giftOption.style.display = 'none';
            submitAttendanceButton.style.display = 'none';
            submitButton.style.display = 'none';
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

    submitAttendanceButton.addEventListener('click', async function () {
        const attendanceStatus = attendanceSelect.value;
        if (!attendanceStatus) {
            alert('Please select an attendance status.');
            return;
        }

        try {
            await fetch(`/update-guest-response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: eventId,
                    userId: loggedInUserId,
                    guestName: guestSelect.value,
                    attendanceStatus: attendanceStatus  // Ensure this is passed
                })
            });

            alert('Response submitted successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error submitting guest response:', error);
            alert('Error submitting response.');
        }
    });

    submitButton.addEventListener('click', async function () {
        const bringGift = bringGiftCheckbox.checked;
        const selectedGift = giftSelect.value || null;
        const selectedAppetizer = appetizersSelect.value || null;
        const selectedMainCourse = mainCoursesSelect.value || null;
        const selectedDessert = dessertsSelect.value || null;
        const attendance = attendanceSelect.value;
    
        if (!attendance) {
            alert('Please select an attendance status.');
            return;
        }
    
        if (bringGift && !selectedGift) {
            alert('Please select a gift to bring.');
            return;
        }
    
        try {
            await fetch(`/update-guest-response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: eventId,
                    userId: loggedInUserId,
                    guestName: guestSelect.value,
                    attendanceStatus: attendance,
                    bringGift: bringGift,
                    claimedGift: selectedGift,
                    selectedAppetizer: selectedAppetizer,
                    selectedMainCourse: selectedMainCourse,
                    selectedDessert: selectedDessert,
                    confirmed: true // Set confirmed to true when the user confirms their attendance
                })
            });
    
            alert('Response submitted successfully! A new attendee record has been created.');
            window.location.reload();
        } catch (error) {
            console.error('Error submitting guest response:', error);
            alert('Error submitting response.');
        }
    });    
});
