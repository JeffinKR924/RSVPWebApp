window.submitPoll = async function(pollId, eventId) {
    const form = document.getElementById(`poll-form-${pollId}`);
    const selectedOption = form.querySelector('input[name="poll-option"]:checked');
    
    if (!selectedOption) {
        alert('Please select an option before submitting.');
        return;
    }
    
    const optionValue = selectedOption.value;
    console.log(eventId);
    
    try {
        const response = await fetch('/submit-poll-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: localStorage.getItem('userId'),
                pollId: pollId,
                eventId: eventId,
                selectedOption: optionValue
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit poll response');
        }
        
        const result = await response.json();
        alert(result.message);
        
        form.querySelector('button').disabled = true;
    } catch (error) {
        console.error('Error submitting poll response:', error);
        alert('Error submitting poll response.');
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    const eventSelect = document.getElementById('eventSelect');
    const pollsContainer = document.getElementById('pollsContainer');
    const loggedInUserId = localStorage.getItem('userId');

    if (!loggedInUserId) {
        alert('User is not logged in.');
        window.location.href = '/login-page';
        return;
    }

    await populateEventDropdown(loggedInUserId);

    eventSelect.addEventListener('change', function () {
        const eventId = eventSelect.value;

        if (eventId) {
            fetch(`/get-attendee-event?userId=${encodeURIComponent(loggedInUserId)}&eventId=${encodeURIComponent(eventId)}`)
                .then(response => response.json())
                .then(event => {
                    console.log('Fetched event:', event);  // Debugging line

                    if (!event || !Array.isArray(event.polls)) {
                        alert('No polls available for this event.');
                        return;
                    }

                    console.log(event.polls);
                    displayPolls(event.polls, eventId);
                })
                .catch(error => {
                    console.error('Error fetching event details:', error);
                    alert('Error fetching event details.');
                });
        } else {
            pollsContainer.style.display = 'none';
        }
    });

    function displayPolls(polls, eventId) {
        pollsContainer.style.display = 'block';
        clearList(pollsContainer);

        polls.forEach(poll => {
            const pollDiv = document.createElement('div');
            pollDiv.classList.add('poll');
            pollDiv.innerHTML = `
                <h4>${poll.question}</h4>
                <form id="poll-form-${poll.id}">
                    <ul>
                        ${poll.options.map(option => `<li><label><input type="radio" name="poll-option" value="${option}"> ${option}</label></li>`).join('')}
                    </ul>
                    <button type="button" onclick="submitPoll('${poll.id}', '${eventId}')">Submit</button>
                </form>
            `;
            pollsContainer.appendChild(pollDiv);
        });
    }


    async function populateEventDropdown(userId) {
        try {
            const response = await fetch(`/get-user-events?userId=${encodeURIComponent(userId)}&type=attendee`); // Ensure type is correct
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const events = await response.json();

            if (!Array.isArray(events)) {
                throw new TypeError('Expected events to be an array');
            }

            if (events.length === 0) {
                alert('You are not associated with any events or do not have any polls available.');
                window.location.href = '/dashboard-page';
                return;
            }

            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.eventTitle;
                eventSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error fetching events:', error);
            alert('Error fetching events.');
        }
    }

    function clearList(listElement) {
        while (listElement.firstChild) {
            listElement.removeChild(listElement.firstChild);
        }
    }

    document.getElementById('close-button').addEventListener('click', function() {
        window.location.href = '/dashboard-page';
    });

    
});

