document.addEventListener('DOMContentLoaded', function() {
    
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

    function populateEventDropdown(events) {
        const eventSelect = document.getElementById('eventSelect');
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.eventTitle;
            eventSelect.appendChild(option);
        });
    }

    fetchEvents();

    
    const pollOptionsContainer = document.getElementById('poll-options');
    const addOptionButton = document.getElementById('add-option');
    const createPollButton = document.getElementById('create-poll');
    let optionCount = 2;
    

    // Function to create a new option element
    function createOptionElement(count) {
        const newOptionDiv = document.createElement('div');
        newOptionDiv.classList.add('poll-option');
        newOptionDiv.innerHTML = `
            <label for="option${count}">Option ${count}:</label>
            <input type="text" id="option${count}" name="options[]" required>
            <button type="button" class="remove-option">Remove</button>
        `;
        return newOptionDiv;
    }

    // Add new option to the poll form
    addOptionButton.addEventListener('click', function() {
        optionCount++;
        const newOption = createOptionElement(optionCount);
        pollOptionsContainer.appendChild(newOption);
    });

    // Remove an option
    pollOptionsContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-option')) {
            const optionToRemove = event.target.parentElement;
            pollOptionsContainer.removeChild(optionToRemove);
            optionCount--;
        }
    });

    // Handle poll creation
    createPollButton.addEventListener('click', async function() {
        const pollQuestion = document.getElementById('poll-question').value.trim();
        const options = Array.from(document.querySelectorAll('input[name="options[]"]')).map(option => option.value.trim());
        const selectedEventId = document.getElementById('eventSelect').value;
        const userId = localStorage.getItem('userId');

        if (!pollQuestion || options.length < 2 || options.some(option => option === '') || !selectedEventId) {
            alert('Please ensure that the poll question and at least two options are provided and an event is selected.');
            return;
        }

        const pollData = {
            userId: userId,
            eventId: selectedEventId,
            pollQuestion: pollQuestion,
            pollOptions: options
        };

        console.log(pollData);

        try {
            const response = await fetch('/save-poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pollData)
            });
            if (response.ok) {
                alert('Poll created successfully!');
                document.getElementById('poll-creation-form').reset();
                while (pollOptionsContainer.children.length > 2) {
                    pollOptionsContainer.removeChild(pollOptionsContainer.lastChild);
                }
                optionCount = 2;
            } else {
                alert('An error occurred while creating the poll. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the poll. Please try again.');
        }
    });


    // Close button redirect
    document.getElementById('close-button').addEventListener('click', function() {
        window.location.href = '/dashboard-page';
    });
});
