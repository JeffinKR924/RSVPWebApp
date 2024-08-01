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

    // Event Data
    const eventData = {
        eventTitle: getById('eventTitle').value,
        eventDate: getById('eventDate').value,
        eventLocation: getById('eventLocation').value,
        guestList: getGuestList(),
        giftList: getById('giftList').value ? getById('giftList').value.split('\n').map(gift => gift.trim()) : null
    };

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
        } else {
            alert('Error saving event data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving event data.');
    });
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
    fetch('/get-events')
        .then(response => response.json())
        .then(events => {
            const eventSelect = getById('eventSelect');
            eventSelect.innerHTML = '<option value="">-- Select an Event --</option>';

            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.eventTitle;
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
    const selectedTitle = getById('eventSelect').value;
    if (!selectedTitle) {
        clearForm();
        return;
    }
    fetch('/get-events')
        .then(response => response.json())
        .then(events => {
            const event = events.find(event => event.eventTitle === selectedTitle);

            if (event) {
                populateFormWithEventData(event);
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

    guestEntry.innerHTML = `
        <input type="text" placeholder="Name" class="guest-name" value="${guest.name || ''}" required>
        <input type="email" placeholder="Email (optional)" class="guest-email" value="${guest.email || ''}">
        <input type="tel" placeholder="Phone (optional)" class="guest-phone" value="${guest.phone || ''}">
        <button type="button" class="remove-guest-button">Remove</button>
    `;

    guestEntry.querySelector('.remove-guest-button').addEventListener('click', function () {
        guestListContainer.removeChild(guestEntry);
        updateRemoveButtonsVisibility();
    });

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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone);
}

function updateRemoveButtonsVisibility() {
    const guestEntries = document.querySelectorAll('.guest-entry');
    const removeButtons = document.querySelectorAll('.remove-guest-button');

    // Show remove buttons only if there's more than one guest entry
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
