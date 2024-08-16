// Helper function to get element by ID
const getById = id => document.getElementById(id);

// Event listeners for buttons and form actions
getById('addGuestButton').addEventListener('click', addGuestEntry);

document.querySelectorAll('input[name="action"]').forEach(radio => {
    radio.addEventListener('change', toggleAction);
});

getById('eventSelect').addEventListener('change', fillEventData);

getById('generateLinkButton').addEventListener('click', function() {
    const eventTitle = getById('eventTitle').value;
    const userId = localStorage.getItem('userId');

    if (!eventTitle) {
        alert('Please provide an event title first.');
        return;
    }

    // Generate a guest link based on the event title and user ID
    const guestLink = `${window.location.origin}/event-form-guest-view.html?eventId=${encodeURIComponent(userId)}-${encodeURIComponent(eventTitle)}`;
    getById('guestLink').value = guestLink;
});

getById('eventForm').addEventListener('submit', function (event) {
    event.preventDefault();

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

    // Collect event data including the generated guest link
    let giftList = getById('giftList').value ? getById('giftList').value.split('\n').map(gift => gift.trim()) : null;
    
    // Transform giftList into an array of objects
    if (giftList) {
        giftList = giftList.map(gift => ({
            name: gift,
            claimedBy: null
        }));
    }

    const eventData = {
        userId: userId,
        event: {
            eventTitle: getById('eventTitle').value,
            eventDate: getById('eventDate').value,
            eventLocation: getById('eventLocation').value,
            guestList: getGuestList(),
            giftList: giftList,
            guestLink: getById('guestLink').value // Add the guest link here
        }
    };

    if(action === 'create') {
        // Handle creating a new event
        fetch('/save-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        }).then(response => {
            if (response.ok) {
                alert('Event data saved successfully!');
                clearForm();
            } else {
                alert('Error saving event data.');
            }
        }).catch(error => {
            console.error('Error:', error);
            alert('Error saving event data.');
        });
    } else if(action === 'modify') {
        // Handle modifying an existing event
        const eventId = getById('eventSelect').value;
        if (!eventId) {
            alert('Please select an event to modify.');
            return;
        }
        fetch(`/update-event?id=${encodeURIComponent(eventId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        }).then(response => response.json()).then(data => {
            if (data.message === 'Event updated successfully!') {
                alert('Event data updated successfully!');
                clearForm();
            } else {
                alert('Error updating event data.');
            }
        }).catch(error => {
            console.error('Error:', error);
            alert('Error updating event data.');
        });
    }
});


// Toggle between create and modify actions
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

// Fetch and populate events in the select dropdown for modification
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

// Fill the form with event data when an event is selected
function fillEventData() {
    const eventSelect = getById('eventSelect');
    const selectedTitle = eventSelect.options[eventSelect.selectedIndex].textContent;
    const userId = localStorage.getItem('userId');

    if (selectedTitle === "-- Select an Event --" || !userId) {
        clearForm();
        return;
    }

    fetch(`/get-event?userId=${encodeURIComponent(userId)}&eventTitle=${encodeURIComponent(selectedTitle)}`)
        .then(response => response.json())
        .then(event => {
            if (event) {
                populateFormWithEventData(event);
                getById('guestLink').value = event.guestLink || ''; // Populate the guest link
            } else {
                alert('Event not found.');
            }
        })
        .catch(error => {
            console.error('Error fetching event data:', error);
            alert('Error fetching event data.');
        });
}

// Populate form fields with event data
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

// Add a new guest entry to the form
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

// Get guest list data from the form
function getGuestList() {
    const guestEntries = document.querySelectorAll('.guest-entry');
    return Array.from(guestEntries).map(entry => ({
        name: entry.querySelector('.guest-name').value,
        email: entry.querySelector('.guest-email').value,
        phone: entry.querySelector('.guest-phone').value
    }));
}

// Validate the form before submission
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

// Validate the event date to ensure it's in the future
function validateFutureDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
}

// Highlight elements with error or success classes
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

// Update visibility of remove buttons based on guest entries
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

// Clear the form fields
function clearForm() {
    ['eventTitle', 'eventDate', 'eventLocation', 'giftList', 'guestLink'].forEach(id => {
        getById(id).value = '';
    });
    const guestListContainer = getById('guestListContainer');
    guestListContainer.innerHTML = '';

    // Adds the first guest entry
    addGuestEntry();
}

// Close button functionality
getById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});
