const getById = id => document.getElementById(id);

getById('addGuestButton').addEventListener('click', addGuestEntry);

document.querySelectorAll('input[name="action"]').forEach(radio => {
    radio.addEventListener('change', toggleAction);
});

getById('eventSelect').addEventListener('change', fillEventData);

getById('eventForm').addEventListener('submit', async function (event) {
    event.preventDefault(); 

    const address = getById('eventLocation').value;

    if (!validateForm()) {
        alert('Please correct the errors in the form.');
        return;
    }

    // Step 1: Validate address before proceeding
    const isValidAddress = await validateAddress(address);
    if (!isValidAddress) {
        alert('Please enter a valid address.');
        return;
    }

    const action = document.querySelector('input[name="action"]:checked').value;
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User is not logged in.');
        return;
    }

    // Add the confirmation status to each guest (set to false initially)
    const guestList = getGuestList().map(guest => ({
        ...guest,
        confirmed: false, // Initialize the confirmation field
    }));

    const giftList = getById('giftList').value ?
        getById('giftList').value.split('\n').map(giftName => {
            return { name: giftName.trim(), claimedBy: null };
        }) : [];

    const eventData = {
        eventTitle: getById('eventTitle').value,
        eventDate: getById('eventDate').value,
        eventLocation: address, // Use validated address
        guestList: guestList,
        giftList: giftList
    };

    if (action === 'create') {
        fetch('/save-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, event: eventData })
        }).then(response => response.json())
            .then(data => {
                if (data.id) {
                    const eventId = data.id; 
                    const guestLink = `${window.location.origin}/event-form-guest-view.html?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`;
                    getById('guestLink').value = guestLink;

                    fetch(`/update-event?id=${encodeURIComponent(eventId)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, event: { guestLink } })
                    }).then(response => response.json())
                        .then(updateData => {
                            if (updateData.message === 'Event updated successfully!') {
                                alert('Event data and guest link saved successfully!');
                            } else {
                                alert('Error updating event data.');
                            }
                        }).catch(error => {
                            console.error('Error updating event data:', error);
                            alert('Error updating event data.');
                        });
                } else {
                    alert('Error saving event data.');
                }
            }).catch(error => {
                console.error('Error:', error);
                alert('Error saving event data.');
            });
    }
});

// Validate address using the server-side endpoint
async function validateAddress(address) {
    try {
        const response = await fetch(`/validate-address?address=${encodeURIComponent(address)}`);
        const data = await response.json();
        return data.valid;
    } catch (error) {
        console.error('Error validating address:', error);
        return false;
    }
}


function toggleAction() {
    const action = document.querySelector('input[name="action"]:checked').value;
    const eventSelectContainer = getById('eventSelectContainer');
    if (action === 'modify') {
        eventSelectContainer.style.display = 'block';
        fetchAndPopulateEvents();
    } else {
        eventSelectContainer.style.display = 'none';
        clearForm();
        getById('eventTitle').removeAttribute('disabled');
    }
}

function fetchAndPopulateEvents() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User is not logged in.');
        return;
    }

    fetch(`/get-events?userId=${encodeURIComponent(userId)}`)
        .then(response => response.json())
        .then(events => {
            const eventSelect = getById('eventSelect');
            eventSelect.innerHTML = '<option value="">-- Select an Event --</option>';

            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.eventTitle;
                eventSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            alert('Error fetching events.');
        });
}

function fillEventData() {
    const eventSelect = getById('eventSelect');
    const selectedEventId = eventSelect.value; 
    const userId = localStorage.getItem('userId');

    if (!selectedEventId || !userId) {
        clearForm();
        return;
    }

    fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(selectedEventId)}`)
        .then(response => response.json())
        .then(event => {
            console.log(event);
            if (event) {
                populateFormWithEventData(event);
                getById('guestLink').value = event.guestLink || ''; 
            } else {
                alert('Event not found.');
            }
        })
        .catch(error => {
            console.error('Error fetching event data:', error);
            alert('Error fetching event data.');
        });
}

function populateFormWithEventData(event) {
    getById('eventTitle').value = event.eventTitle;
    getById('eventDate').value = event.eventDate;
    getById('eventLocation').value = event.eventLocation;
    getById('eventTitle').setAttribute('disabled', 'true');

    const guestListContainer = getById('guestListContainer');
    guestListContainer.innerHTML = '';
    event.guestList.forEach(guest => addGuestEntry(guest));

    getById('giftList').value = event.giftList ? event.giftList.map(gift => gift.name).join('\n') : ''; // Extract gift names
    updateRemoveButtonsVisibility();
}

function addGuestEntry(guest = {}) {
    const guestListContainer = getById('guestListContainer');
    const guestEntry = document.createElement('div');
    guestEntry.className = 'guest-entry';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Name';
    nameInput.className = 'guest-name';
    nameInput.value = guest.name || '';
    nameInput.required = true;

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email (optional)';
    emailInput.className = 'guest-email';
    emailInput.value = guest.email || '';

    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.placeholder = 'Phone (optional)';
    phoneInput.className = 'guest-phone';
    phoneInput.value = guest.phone || '';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-guest-button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function () {
        guestListContainer.removeChild(guestEntry);
        updateRemoveButtonsVisibility();
    });

    guestEntry.appendChild(nameInput);
    guestEntry.appendChild(emailInput);
    guestEntry.appendChild(phoneInput);
    guestEntry.appendChild(removeButton);
    guestListContainer.appendChild(guestEntry);

    highlightElement(guestEntry, 'success');
    updateRemoveButtonsVisibility();
}

function getGuestList() {
    const guestEntries = document.querySelectorAll('.guest-entry');
    return Array.from(guestEntries).map(entry => ({
        name: entry.querySelector('.guest-name').value,
        email: entry.querySelector('.guest-email').value,
        phone: entry.querySelector('.guest-phone').value
    }));
}

function validateForm() {
    let isValid = true;
    const guestEntries = document.querySelectorAll('.guest-entry');
    const eventDate = getById('eventDate').value;

    if (!validateFutureDate(eventDate)) {
        alert('Please select a date in the future.');
        highlightElement(getById('eventDate'), 'error');
        isValid = false;
    } else {
        removeHighlight(getById('eventDate'));
    }

    guestEntries.forEach(entry => {
        const name = entry.querySelector('.guest-name').value.trim();
        const email = entry.querySelector('.guest-email').value.trim();
        const phone = entry.querySelector('.guest-phone').value.trim();

        if (!name) {
            highlightElement(entry.querySelector('.guest-name'), 'error');
            isValid = false;
        } else {
            removeHighlight(entry.querySelector('.guest-name'));
        }

        if (email && !validateEmail(email)) {
            highlightElement(entry.querySelector('.guest-email'), 'error');
            isValid = false;
        } else {
            removeHighlight(entry.querySelector('.guest-email'));
        }

        if (phone && !validatePhone(phone)) {
            highlightElement(entry.querySelector('.guest-phone'), 'error');
            isValid = false;
        } else {
            removeHighlight(entry.querySelector('.guest-phone'));
        }
    });

    return isValid;
}

function validateFutureDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
}

function highlightElement(element, className) {
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, 3000);
}

function removeHighlight(element) {
    element.classList.remove('error');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone);
}

function updateRemoveButtonsVisibility() {
    const guestEntries = document.querySelectorAll('.guest-entry');
    const removeButtons = document.querySelectorAll('.remove-guest-button');

    removeButtons.forEach((button, index) => {
        button.style.display = guestEntries.length > 1 ? 'inline-block' : 'none';
        button.onclick = () => {
            if (guestEntries.length > 1) {
                guestEntries[index].remove();
                updateRemoveButtonsVisibility();
            }
        };
    });
}

function clearForm() {
    ['eventTitle', 'eventDate', 'eventLocation', 'giftList', 'guestLink'].forEach(id => {
        getById(id).value = '';
    });
    const guestListContainer = getById('guestListContainer');
    guestListContainer.innerHTML = '';

    addGuestEntry();
}

getById('close-button').addEventListener('click', function () {
    window.location.href = '/dashboard-page';
});
