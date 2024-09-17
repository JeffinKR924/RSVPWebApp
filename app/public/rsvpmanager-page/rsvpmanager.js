document.addEventListener('DOMContentLoaded', function() {
    const weddingSelect = document.getElementById('weddingSelect');
    const rsvpManagerContent = document.getElementById('rsvpManagerContent');
    const searchBar = document.getElementById('searchBar');
    const acceptedCount = document.getElementById('acceptedCount');
    const declinedCount = document.getElementById('declinedCount');
    const undecidedCount = document.getElementById('undecidedCount');
    const totalCount = document.getElementById('totalCount');
    const rsvpTableBody = document.querySelector('#rsvpTable tbody');

    let guestsData = [];
    let currentEventId = null;

    // Fetch weddings for the dropdown
    fetch('/get-events?userId=' + encodeURIComponent(localStorage.getItem('userId')))
        .then(response => response.json())
        .then(events => {
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.eventTitle;
                weddingSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            alert('Error fetching events.');
        });

    weddingSelect.addEventListener('change', function() {
        const eventId = weddingSelect.value;
        currentEventId = eventId;
        if (eventId) {
            // Fetch guest list for the selected wedding
            fetch(`/get-event?userId=${encodeURIComponent(localStorage.getItem('userId'))}&eventId=${encodeURIComponent(eventId)}`)
                .then(response => response.json())
                .then(event => {
                    if (!event || !Array.isArray(event.guestList)) {
                        alert('Event data is missing or invalid.');
                        return;
                    }

                    guestsData = event.guestList;

                    // Initialize invitationSent and thankYouSent properties if not present
                    guestsData.forEach(guest => {
                        if (typeof guest.invitationSent === 'undefined') {
                            guest.invitationSent = false;
                        }
                        if (typeof guest.thankYouSent === 'undefined') {
                            guest.thankYouSent = false;
                        }
                    });

                    updateStatistics();
                    populateTable(guestsData);
                    rsvpManagerContent.style.display = 'block';
                })
                .catch(error => {
                    console.error('Error fetching event details:', error);
                    alert('Error fetching event details.');
                });
        } else {
            rsvpManagerContent.style.display = 'none';
        }
    });

    function updateStatistics() {
        const accepted = guestsData.filter(guest => guest.confirmed === true).length;
        const declined = guestsData.filter(guest => guest.confirmed === false).length;
        const undecided = guestsData.filter(guest => typeof guest.confirmed === 'undefined').length;
        const total = guestsData.length;

        acceptedCount.textContent = accepted;
        declinedCount.textContent = declined;
        undecidedCount.textContent = undecided;
        totalCount.textContent = total;
    }

    function populateTable(data) {
        // Clear existing table rows
        rsvpTableBody.innerHTML = '';

        data.forEach(guest => {
            const tr = document.createElement('tr');

            // Full Name
            const nameTd = document.createElement('td');
            nameTd.textContent = guest.name || '';
            tr.appendChild(nameTd);

            // Email
            const emailTd = document.createElement('td');
            emailTd.textContent = guest.email || '';
            tr.appendChild(emailTd);

            // Phone Number
            const phoneTd = document.createElement('td');
            phoneTd.textContent = guest.phone || '';
            tr.appendChild(phoneTd);

            // Invitation Sent Toggle
            const invitationTd = document.createElement('td');
            const invitationToggle = createToggleSwitch(guest.invitationSent);
            invitationToggle.querySelector('input').addEventListener('change', function() {
                guest.invitationSent = this.checked;
                saveGuestData(guest);
            });
            invitationTd.appendChild(invitationToggle);
            tr.appendChild(invitationTd);

            // Status
            const statusTd = document.createElement('td');
            const statusCircle = document.createElement('span');
            statusCircle.classList.add('status-circle');

            if (guest.confirmed === true) {
                statusCircle.classList.add('status-accepted');
            } else if (guest.confirmed === false) {
                statusCircle.classList.add('status-declined');
            } else if (typeof guest.confirmed === 'undefined') {
                statusCircle.classList.add('status-noresponse');
            } else {
                statusCircle.classList.add('status-undecided');
            }
            statusTd.appendChild(statusCircle);
            tr.appendChild(statusTd);

            // Thank You Sent Toggle
            const thankYouTd = document.createElement('td');
            const thankYouToggle = createToggleSwitch(guest.thankYouSent);
            thankYouToggle.querySelector('input').addEventListener('change', function() {
                guest.thankYouSent = this.checked;
                saveGuestData(guest);
            });
            thankYouTd.appendChild(thankYouToggle);
            tr.appendChild(thankYouTd);

            rsvpTableBody.appendChild(tr);
        });
    }

    function createToggleSwitch(isChecked) {
        const label = document.createElement('label');
        label.className = 'toggle-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = isChecked;

        const span = document.createElement('span');
        span.className = 'slider';

        label.appendChild(input);
        label.appendChild(span);

        return label;
    }

    searchBar.addEventListener('input', function() {
        const searchTerm = searchBar.value.toLowerCase();
        const filteredData = guestsData.filter(guest => {
            return guest.name && guest.name.toLowerCase().includes(searchTerm);
        });
        populateTable(filteredData);
    });

    function saveGuestData(guest) {
        const eventId = currentEventId;
        const userId = localStorage.getItem('userId');

        fetch('/modify-event-rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                eventId: eventId,
                guestName: guest.name,
                invitationSent: guest.invitationSent,
                thankYouSent: guest.thankYouSent
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Guest data updated successfully');
        })
        .catch(error => {
            console.error('Error updating guest data:', error);
            alert('Error updating guest data.');
        });
    }
});
