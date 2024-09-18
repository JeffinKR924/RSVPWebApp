document.addEventListener('DOMContentLoaded', function () {
    const eventSelect = document.getElementById('eventSelect');
    const eventDetails = document.getElementById('eventDetails');
    const eventTitle = document.getElementById('eventTitle');
    const eventDate = document.getElementById('eventDate');
    const eventLocation = document.getElementById('eventLocation');
    const confirmedGuests = document.getElementById('confirmedGuests');
    const declinedGuests = document.getElementById('declinedGuests');
    const undecidedGuests = document.getElementById('undecidedGuests');
    const totalGuests = document.getElementById('totalGuests');
    const guestList = document.getElementById('guestList');
    let eventLink = document.getElementById('eventLink');
    const giftList = document.getElementById('giftList');
    const confirmedGiftList = document.getElementById('confirmedGiftList');
    const appetizersList = document.getElementById('appetizers');
    const mainMealList = document.getElementById('mainMeal');
    const dessertsList = document.getElementById('desserts');
    const pollsContainer = document.getElementById('pollsContainer');

    function clearList(listElement) {
        while (listElement.firstChild) {
            listElement.removeChild(listElement.firstChild);
        }
    }

    fetch('/get-events?userId=' + encodeURIComponent(localStorage.getItem('userId')))
        .then(response => response.json())
        .then(events => {
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

    eventSelect.addEventListener('change', function () {
        const eventId = eventSelect.value;

        if (eventId) {
            fetch(`/get-event?userId=${encodeURIComponent(localStorage.getItem('userId'))}&eventId=${encodeURIComponent(eventId)}`)
                .then(response => response.json())
                .then(event => {
                    console.log('Fetched event:', event);

                    if (!event || !Array.isArray(event.guestList)) {
                        alert('Event data is missing or invalid.');
                        return;
                    }

                    eventTitle.textContent = event.eventTitle;
                    eventDate.textContent = event.eventDate;
                    eventLocation.textContent = event.eventLocation;
                    eventLink.textContent = event.guestLink;

                    // Calculate confirmed, declined, and undecided guests
                    const confirmedGuestsCount = event.guestList.filter(guest => guest.attendanceStatus === 'confirm').length;
                    const declinedGuestsCount = event.guestList.filter(guest => guest.attendanceStatus === 'decline').length;
                    const undecidedGuestsCount = event.guestList.filter(guest => guest.attendanceStatus === 'undecided').length;

                    confirmedGuests.textContent = confirmedGuestsCount;
                    declinedGuests.textContent = declinedGuestsCount;
                    undecidedGuests.textContent = undecidedGuestsCount;
                    totalGuests.textContent = event.guestList.length;

                    clearList(guestList);
                    event.guestList.forEach(guest => {
                        const li = document.createElement('li');
                        // Show attendance status based on the 'attendanceStatus' field
                        li.textContent = `${guest.name} - ${guest.attendanceStatus ? guest.attendanceStatus.charAt(0).toUpperCase() + guest.attendanceStatus.slice(1) : 'No Response'}`;

                        if (guest.attendanceStatus === 'confirm' && guest.mealSelection) {
                            // Append meal choice if available
                            const mealInfo = document.createElement('span');
                            let mealText = ' | Meal Selection: ';

                            const selections = [];
                            if (guest.mealSelection.appetizer) {
                                selections.push(`Appetizer: ${guest.mealSelection.appetizer}`);
                            }
                            if (guest.mealSelection.mainCourse) {
                                selections.push(`Main Course: ${guest.mealSelection.mainCourse}`);
                            }
                            if (guest.mealSelection.dessert) {
                                selections.push(`Dessert: ${guest.mealSelection.dessert}`);
                            }

                            mealText += selections.join(', ');
                            mealInfo.textContent = mealText;
                            li.appendChild(mealInfo);
                        }

                        guestList.appendChild(li);
                    });

                    // Gift List (Available Gifts)
                    clearList(giftList);
                    clearList(confirmedGiftList); // For claimed gifts
                    if (event.giftList) {
                        event.giftList.forEach(gift => {
                            const li = document.createElement('li');
                            li.textContent = `${gift.name} - ${gift.claimedBy ? 'Claimed' : 'Available'}`;
                            if (gift.claimedBy) {
                                confirmedGiftList.appendChild(li); // Append to claimed list
                            } else {
                                giftList.appendChild(li); // Append to available gift list
                            }
                        });
                    }

                    clearList(appetizersList);
                    clearList(mainMealList);
                    clearList(dessertsList);
                    if (event.mealOptions) {
                        event.mealOptions.appetizers.forEach(option => {
                            const li = document.createElement('li');
                            li.textContent = option;
                            appetizersList.appendChild(li);
                        });

                        event.mealOptions.mainCourses.forEach(option => {
                            const li = document.createElement('li');
                            li.textContent = option;
                            mainMealList.appendChild(li);
                        });

                        event.mealOptions.desserts.forEach(option => {
                            const li = document.createElement('li');
                            li.textContent = option;
                            dessertsList.appendChild(li);
                        });
                    }

                    // Display polls
                    clearList(pollsContainer);
                    if (event.polls) {
                        event.polls.forEach(poll => {
                            const pollDiv = document.createElement('div');
                            pollDiv.classList.add('poll');
                            pollDiv.innerHTML = `
                                <h4>${poll.question}</h4>
                                <ul>
                                    ${poll.options.map(option => `<li>${option}</li>`).join('')}
                                </ul>
                            `;
                            pollsContainer.appendChild(pollDiv);
                        });
                    }

                    eventDetails.style.display = 'block';
                })
                .catch(error => {
                    console.error('Error fetching event details:', error);
                    alert('Error fetching event details.');
                });
        } else {
            eventDetails.style.display = 'none';
        }
    });
});

document.getElementById('close-button').addEventListener('click', function () {
    window.location.href = '/dashboard-page';
});
