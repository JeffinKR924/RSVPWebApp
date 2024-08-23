document.addEventListener('DOMContentLoaded', function () {
    const eventSelect = document.getElementById('eventSelect');
    const eventDetails = document.getElementById('eventDetails');
    const eventTitle = document.getElementById('eventTitle');
    const eventDate = document.getElementById('eventDate');
    const eventLocation = document.getElementById('eventLocation');
    const confirmedGuests = document.getElementById('confirmedGuests');
    const totalGuests = document.getElementById('totalGuests');
    const guestList = document.getElementById('guestList');
    const giftList = document.getElementById('giftList');
    const confirmedGiftList = document.getElementById('confirmedGiftList');
    const appetizersList = document.getElementById('appetizers');
    const mainMealList = document.getElementById('mainMeal');
    const dessertsList = document.getElementById('desserts');

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
            fetch('/get-event?userId=' + encodeURIComponent(localStorage.getItem('userId')) + '&eventTitle=' + encodeURIComponent(eventSelect.options[eventSelect.selectedIndex].text))
                .then(response => response.json())
                .then(event => {
                    eventTitle.textContent = event.eventTitle;
                    eventDate.textContent = event.eventDate;
                    eventLocation.textContent = event.eventLocation;

                    const confirmedGuestsCount = event.guestList.filter(guest => guest.bringingGift === true).length;
                    confirmedGuests.textContent = confirmedGuestsCount;

                    totalGuests.textContent = event.guestList.length;

                    clearList(guestList);
                    event.guestList.forEach(guest => {
                        const li = document.createElement('li');
                        li.textContent = `${guest.name} ${guest.email ? `(Email: ${guest.email})` : ''} ${guest.phone ? `(Phone: ${guest.phone})` : ''} ${guest.bringingGift ? '- Bringing Gift' : '- Not Bringing Gift'}`;
                        guestList.appendChild(li);
                    });

                    clearList(giftList);
                    clearList(confirmedGiftList);
                    if (event.giftList) {
                        event.giftList.forEach(gift => {
                            const li = document.createElement('li');
                            li.textContent = gift.name; // Access the name property of the gift object
                            giftList.appendChild(li);

                            if (gift.claimedBy) {
                                const claimedLi = document.createElement('li');
                                claimedLi.textContent = `${gift.name} (Claimed)`; // Display the name of the claimed gift
                                confirmedGiftList.appendChild(claimedLi);
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

document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/dashboard-page';
});
