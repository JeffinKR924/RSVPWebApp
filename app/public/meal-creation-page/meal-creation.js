let appetizerCount = 0;
let mainCourseCount = 0;
let dessertCount = 0;

function updateRemoveButtonVisibility(courseType) {
    const container = document.getElementById(`${courseType}Container`);
    const inputs = container.querySelectorAll('input');
    const removeButtons = container.querySelectorAll('.remove-button');

    removeButtons.forEach(button => {
        button.style.display = inputs.length > 1 ? 'inline' : 'none';
    });

    // Update the counters after removing
    if (courseType === 'appetizer') {
        appetizerCount = inputs.length;
    } else if (courseType === 'mainCourse') {
        mainCourseCount = inputs.length;
    } else if (courseType === 'dessert') {
        dessertCount = inputs.length;
    }
}


function populateEventDropdown(events) {
    const eventSelect = document.getElementById('eventSelect');
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.eventTitle;
        eventSelect.appendChild(option);
    });
}

// Function to fetch events from the server
async function fetchEvents() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User is not logged in.');
        return;
    }

    try {
        const response = await fetch(`/get-events?userId=${encodeURIComponent(userId)}`);
        const events = await response.json();
        populateEventDropdown(events);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchEvents);

function addOption(courseType) {
    const container = document.getElementById(`${courseType}Container`);
    let count;

    if (courseType === 'appetizer') {
        count = ++appetizerCount;
    } else if (courseType === 'mainCourse') {
        count = ++mainCourseCount;
    } else if (courseType === 'dessert') {
        count = ++dessertCount;
    }

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = `Enter ${courseType} option ${count}`;
    inputField.id = `${courseType}Option${count}`;
    inputField.className = 'meal-option-input';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.className = 'remove-button';
    removeButton.style.display = container.querySelectorAll('input').length > 1 ? 'inline' : 'none';
    removeButton.addEventListener('click', function() {
        container.removeChild(inputField);
        container.removeChild(removeButton);
        updateRemoveButtonVisibility(courseType);
    });

    container.appendChild(inputField);
    container.appendChild(removeButton);

    updateRemoveButtonVisibility(courseType);
}

function validateForm() {
    const selectedEventId = document.getElementById('eventSelect').value;
    const appetizers = document.querySelectorAll('#appetizerContainer input');
    const mainCourses = document.querySelectorAll('#mainCourseContainer input');
    const desserts = document.querySelectorAll('#dessertContainer input');

    if (!selectedEventId) {
        alert('Please select an event.');
        return false;
    }

    if (appetizers.length === 0) {
        alert('Please add at least one appetizer option.');
        return false;
    }

    if (mainCourses.length === 0) {
        alert('Please add at least one main course option.');
        return false;
    }

    if (desserts.length === 0) {
        alert('Please add at least one dessert option.');
        return false;
    }

    return true;
}

document.getElementById('mealForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const selectedEventId = document.getElementById('eventSelect').value;
    if (!selectedEventId) {
        alert('Please select an event.');
        return;
    }

    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User is not logged in.');
        return;
    }

    // Collect meal options
    const appetizers = Array.from(document.querySelectorAll('#appetizerContainer input')).map(input => input.value);
    const mainCourses = Array.from(document.querySelectorAll('#mainCourseContainer input')).map(input => input.value);
    const desserts = Array.from(document.querySelectorAll('#dessertContainer input')).map(input => input.value);

    // Prepare data to send
    const mealData = {
        userId: userId,
        eventId: selectedEventId,
        appetizers,
        mainCourses,
        desserts
    };

    try {
        await fetch('/save-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mealData)
        });
        alert('Meal options saved successfully.');
    } catch (error) {
        console.error('Error saving meal options:', error);
    }

    // Clear form
    document.querySelectorAll('#appetizerContainer input, #mainCourseContainer input, #dessertContainer input').forEach(input => {
        input.value = '';
    });

    appetizerCount = 0;
    mainCourseCount = 0;
    dessertCount = 0;

    document.getElementById('appetizerContainer').innerHTML = '';
    document.getElementById('mainCourseContainer').innerHTML = '';
    document.getElementById('dessertContainer').innerHTML = '';
});

document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});
