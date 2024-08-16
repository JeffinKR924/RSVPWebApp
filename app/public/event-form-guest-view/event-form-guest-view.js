document.addEventListener('DOMContentLoaded', function () {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    const guestSelect = document.getElementById('guestSelect');
    const bringGiftCheckbox = document.getElementById('bringGift');
    const giftSelectContainer = document.getElementById('giftSelectContainer');
    const giftSelect = document.getElementById('giftSelect');
    const submitButton = document.getElementById('submitResponse');

    if (!eventId) {
        alert('Event ID is missing from the URL.');
        return;
    }

    const [userId, eventTitle] = eventId.split('-');

    // Fetch the event data from the server
    fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventTitle=${encodeURIComponent(eventTitle)}`)
        .then(response => response.json())
        .then(event => {
            if (!event) {
                alert('Event not found.');
                return;
            }

            // Populate the guest list dropdown
            event.guestList.forEach(guest => {
                const option = document.createElement('option');
                option.value = guest.name;
                option.textContent = guest.name;
                guestSelect.appendChild(option);
            });

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

    guestSelect.addEventListener('change', function () {
        if (guestSelect.value) {
            document.getElementById('giftOption').style.display = 'block';
        } else {
            document.getElementById('giftOption').style.display = 'none';
        }
    });

    bringGiftCheckbox.addEventListener('change', function () {
        if (bringGiftCheckbox.checked) {
            giftSelectContainer.style.display = 'block';
        } else {
            giftSelectContainer.style.display = 'none';
        }
    });

    submitButton.addEventListener('click', function () {
        const selectedGuest = guestSelect.value;
        const bringGift = bringGiftCheckbox.checked;
        const selectedGift = giftSelect.value;

        if (!selectedGuest) {
            alert('Please select your name.');
            return;
        }

        if (bringGift && !selectedGift) {
            alert('Please select a gift to bring.');
            return;
        }

        // Send the guest's response to the server
        fetch(`/update-guest-response?eventId=${encodeURIComponent(eventId)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestName: selectedGuest,
                bringGift: bringGift,
                selectedGift: selectedGift
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Response submitted successfully!');
                window.location.reload(); // Reload the page to reflect updated gift list
            } else {
                alert('Error submitting response.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting response.');
        });
    });
});
