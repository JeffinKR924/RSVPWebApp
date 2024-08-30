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
                    displayPolls(event.polls);
                })
                .catch(error => {
                    console.error('Error fetching event details:', error);
                    alert('Error fetching event details.');
                });
        } else {
            pollsContainer.style.display = 'none';
        }
    });

    function displayPolls(polls) {
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
                    <button type="button" onclick="submitPoll('${poll.id}')">Submit</button>
                </form>
            `;
            pollsContainer.appendChild(pollDiv);
        });
    }

    //Add method to submit poll

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
                alert('You are not associated with any events.');
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

