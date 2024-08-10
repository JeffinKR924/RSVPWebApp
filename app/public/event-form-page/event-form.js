const getById = id => document.getElementById(id);
getById('addGuestButton').addEventListener('click', addGuestEntry);

document.querySelectorAll('input[name="action"]').forEach(radio => {
    radio.addEventListener('change', toggleAction);
});

getById('eventSelect').addEventListener('change', fillEventData);

getById('eventForm').addEventListener('submit', function (event) {
    // Prevents form submission before validating info
    event.preventDefault();

    // Validates the form before submission
    if (!validateForm()) {
        alert('Please correct the errors in the form.');
        return;
    }

    const action = document.querySelector('input[name="action"]:checked').value;
    const userId = localStorage.getItem('userId');
    

    if(!userId) {
        alert('User is not logged in.');
        return;
    }

    // Event Data
    const eventData = {
        userId: userId,
        event: {
            eventTitle: getById('eventTitle').value,
            eventDate: getById('eventDate').value,
            eventLocation: getById('eventLocation').value,
            guestList: getGuestList(),
            giftList: getById('giftList').value ? getById('giftList').value.split('\n').map(gift => gift.trim()) : null
        }
    };

    if(action === 'create') {
        // Sends JSON data to the server
        fetch('/save-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            if (response.ok) {
                alert('Event data saved successfully!');
                clearForm();
            } else {
                alert('Error saving event data.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving event data.');
        });
    }else if(action === 'modify') {
        const eventId = getById('eventSelect').value;

        if (!eventId) {
            alert('Please select an event to modify.');
            return;
        }

        // Sends JSON data to the server to update the existing event
        fetch(`/update-event?id=${encodeURIComponent(eventId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Event updated successfully!') {
                alert('Event data updated successfully!');
                clearForm();
            } else {
                alert('Error updating event data.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating event data.');
        });
    }
});

// Create vs. Modify Event behavior
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
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const selectedTitle = selectedOption.textContent;
    const userId = localStorage.getItem('userId');

    if (selectedTitle =="-- Select an Event --" || !userId) {
        clearForm();
        return;
    }

    fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventTitle=${encodeURIComponent(selectedTitle)}`)
        .then(response => response.json())
        .then(event => {
            if (event) {
                populateFormWithEventData(event);
            } else {
                alert('Event not found.');
            }
        })
        .catch(error => {
            console.error('Error fetching event data:', error);
            alert('Error fetching event data.');
        });
}

// Populates Fields with Event Data for Modification
function populateFormWithEventData(event) {
    getById('eventTitle').value = event.eventTitle;
    getById('eventDate').value = event.eventDate;
    getById('eventLocation').value = event.eventLocation;
    getById('eventTitle').setAttribute('disabled', 'true');

    const guestListContainer = getById('guestListContainer');
    guestListContainer.innerHTML = '';
    event.guestList.forEach(guest => addGuestEntry(guest));

    getById('giftList').value = event.giftList ? event.giftList.join('\n') : '';

    updateRemoveButtonsVisibility();
}

function addGuestEntry(guest = {}) {
    const guestListContainer = getById('guestListContainer');
    const guestEntry = document.createElement('div');
    guestEntry.className = 'guest-entry';

    // Create Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Name';
    nameInput.className = 'guest-name';
    nameInput.value = guest.name || '';
    nameInput.required = true;

    // Create Email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email (optional)';
    emailInput.className = 'guest-email';
    emailInput.value = guest.email || '';

    // Create Phone input
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.placeholder = 'Phone (optional)';
    phoneInput.className = 'guest-phone';
    phoneInput.value = guest.phone || '';

    // Create Remove button
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-guest-button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function () {
        guestListContainer.removeChild(guestEntry);
        updateRemoveButtonsVisibility();
    });

    // Append all elements to guest entry
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

// Checks for valid date, guest name, number, and email
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

// Validates set date
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

    // Show `remove buttons` only if there's more than one guest entry
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
    ['eventTitle', 'eventDate', 'eventLocation', 'giftList'].forEach(id => {
        getById(id).value = '';
    });
    const guestListContainer = getById('guestListContainer');
    guestListContainer.innerHTML = '';

    // Adds the first guest entry
    addGuestEntry();
}
