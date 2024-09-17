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
    const responseSection = document.getElementById('responseSection');
    const responseSelect = document.getElementById('responseSelect');
    const giftOption = document.getElementById('giftOption');
    const appetizersSelect = document.getElementById('appetizersSelect');
    const mainCoursesSelect = document.getElementById('mainCoursesSelect');
    const dessertsSelect = document.getElementById('dessertsSelect');
    const mapContainer = document.getElementById('map');

    if (!eventId) {
        alert('Event ID is missing from the URL.');
        return;
    }

    const loggedInUserId = localStorage.getItem('userId');

    if (!loggedInUserId) {
        const returnUrl = window.location.href;
        document.getElementById('loginButton').addEventListener('click', function () {
            window.location.href = `/login-page?returnUrl=${encodeURIComponent(returnUrl)}`;
        });
        return;
    }

    userStatus.style.display = 'none';
    rsvpSection.style.display = 'block';

    const response = await fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
    const event = await response.json();

    if (!event) {
        alert('Event not found.');
        return;
    }

    // Populating guest list
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

    // Populating gift list
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

    // Populating meal options
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

    window.initMap = function () {
        if (event.eventLocation) {
            const geocoder = new google.maps.Geocoder();

            geocoder.geocode({ address: event.eventLocation }, (results, status) => {
                if (status === 'OK') {
                    const location = results[0].geometry.location;

                    const map = new google.maps.Map(mapContainer, {
                        center: location,
                        zoom: 15
                    });

                    new google.maps.Marker({
                        position: location,
                        map: map,
                        title: event.eventTitle
                    });
                } else {
                    alert('Failed to load the map. Please try again later.');
                }
            });
        }
    };

    await loadGoogleMaps();

    guestSelect.addEventListener('change', function () {
        if (guestSelect.value) {
            responseSection.style.display = 'block';
        } else {
            responseSection.style.display = 'none';
            giftOption.style.display = 'none';
            submitButton.style.display = 'none';
        }
    });

    responseSelect.addEventListener('change', function () {
        if (responseSelect.value === 'accepted') {
            giftOption.style.display = 'block';
            submitButton.style.display = 'block';
        } else if (responseSelect.value === 'declined' || responseSelect.value === 'undecided') {
            giftOption.style.display = 'none';
            submitButton.style.display = 'block';
        } else {
            giftOption.style.display = 'none';
            submitButton.style.display = 'none';
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
        const selectedGift = giftSelect.value || null;
        const selectedAppetizer = appetizersSelect.value || null;
        const selectedMainCourse = mainCoursesSelect.value || null;
        const selectedDessert = dessertsSelect.value || null;
        const responseValue = responseSelect.value;

        if (!responseValue) {
            alert('Please select your response.');
            return;
        }

        if (responseValue === 'accepted') {
            if (bringGift && !selectedGift) {
                alert('Please select a gift to bring.');
                return;
            }
            if (!selectedAppetizer || !selectedMainCourse || !selectedDessert) {
                alert('Please select your meal options.');
                return;
            }
        }

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
                    confirmed: responseValue,
                    claimedGift: bringGift && selectedGift ? true : false
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
