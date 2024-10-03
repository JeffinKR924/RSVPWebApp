document.addEventListener('DOMContentLoaded', function () {
    const weddingSelect = document.getElementById('weddingSelect');
    const itineraryContent = document.getElementById('itineraryContent');
    const daySelect = document.getElementById('daySelect');
    const itineraryContainer = document.querySelector('.itinerary-container');
    const scheduleContainer = document.querySelector('.schedule');
    const addEventButton = document.getElementById('addEventButton');
    const addEventModal = document.getElementById('addEventModal');
    const closeModal = document.getElementById('closeModal');
    const eventForm = document.getElementById('eventForm');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDateInput = document.getElementById('eventDate');
    const eventTimeInput = document.getElementById('eventTime');
    const eventDurationInput = document.getElementById('eventDuration');
    const eventDescriptionInput = document.getElementById('eventDescription');

    let currentEventId = null;
    let itineraryData = [];
    let selectedDay = null;
    let editingEventId = null;

    calendarButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/calendar-page'; 
    });

    profileButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/profile-page'; 
    });

    homeButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/dashboard-page'; 
    });

    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault(); 
    
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
    
        window.location.href = '/';
    });

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

    weddingSelect.addEventListener('change', function () {
        const eventId = weddingSelect.value;
        currentEventId = eventId;
        if (eventId) {
            fetchItineraryData(eventId);
            itineraryContent.style.display = 'block';
        } else {
            itineraryContent.style.display = 'none';
        }
    });

    function fetchItineraryData(eventId) {
        fetch(`/get-itinerary?userId=${encodeURIComponent(localStorage.getItem('userId'))}&eventId=${encodeURIComponent(eventId)}`)
            .then(response => response.json())
            .then(data => {
                itineraryData = data.itinerary || [];
                populateDaySelect();
                renderItinerary();
            })
            .catch(error => {
                console.error('Error fetching itinerary data:', error);
                alert('Error fetching itinerary data.');
            });
    }

    function populateDaySelect() {
        const days = [...new Set(itineraryData.map(event => formatDateToUTC(event.date)))];
        daySelect.innerHTML = '';
        days.forEach(day => {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = formatDateDisplay(day);
            console.log("option: ", option);
            daySelect.appendChild(option);
        });
        console.log("days: ", days);
        if (days.length > 0) {
            selectedDay = days[0];
            daySelect.value = selectedDay;
        } else {
            selectedDay = null;
        }
        daySelect.addEventListener('change', function () {
            selectedDay = daySelect.value;
            renderItinerary();
        });
    }

    function renderItinerary() {
        scheduleContainer.innerHTML = '';
        if (!selectedDay) return;

        // Create time slots for 2-hour increments
        const timeLabels = [
            '12 - 2', '2 - 4', '4 - 6', '6 - 8', '8 - 10', '10 - 12',
            '12 - 2', '2 - 4', '4 - 6', '6 - 8', '8 - 10', '10 - 12'
        ];

        // Creating columns for each time slot and adding a middle divider
        timeLabels.forEach(label => {
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            timeSlot.textContent = label;

            // Add middle dashed line to separate each hour
            const middleDivider = document.createElement('div');
            middleDivider.classList.add('middle-divider');
            timeSlot.appendChild(middleDivider);

            scheduleContainer.appendChild(timeSlot);
        });

        const formattedSelectedDay = new Date(selectedDay).toISOString().split('T')[0];

        const eventsForDay = itineraryData.filter(event => formatDateToUTC(event.date) === formattedSelectedDay);
        eventsForDay.sort((a, b) => {
            return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
        });

        eventsForDay.forEach(event => {
            const eventStart = new Date(`${event.date}T${event.time}`);
            const eventEnd = new Date(eventStart.getTime() + event.duration * 60 * 60 * 1000);

            const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
            const endHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;

            const startColumn = Math.floor(startHour / 2) + 1;
            const endColumn = Math.ceil(endHour / 2) + 1;

            const isOddStartHour = Math.floor(startHour) % 2 !== 0;
            const isOddEndHour = Math.floor(endHour) % 2 !== 0;

            const startBaseMargin = isOddStartHour ? 25 : 0;
            const startMinuteOffset = (eventStart.getMinutes() / 60) * 25;
            const startPercentage = startBaseMargin + startMinuteOffset;

            const endBaseMargin = isOddEndHour ? 25 : 0;
            const endMinuteOffset = (eventEnd.getMinutes() / 60) * 25;
            const endPercentage = endBaseMargin + endMinuteOffset;

            const eventBlock = document.createElement('div');
            eventBlock.classList.add('event-block');

            const durationMinutes = ((eventEnd - eventStart) / 60000); // Get total duration in minutes
            const pixelsPerMinute = 0.55; // Each minute is 0.55 pixels
            const width = (durationMinutes * pixelsPerMinute) + 'px';

            eventBlock.style.gridColumn = `${startColumn} / ${endColumn}`;
            eventBlock.style.marginLeft = `${startPercentage}%`;
            eventBlock.style.width = width;

            const eventTitle = document.createElement('div');
            eventTitle.classList.add('event-title');
            eventTitle.textContent = event.title;

            const eventTime = document.createElement('div');
            eventTime.classList.add('event-time');
            eventTime.textContent = `${formatTime(eventStart)} - ${formatTime(eventEnd)}`;

            eventBlock.appendChild(eventTitle);
            eventBlock.appendChild(eventTime);

            eventBlock.addEventListener('click', function () {
                openEditModal(event);
            });

            scheduleContainer.appendChild(eventBlock);
        });
    }

    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    }

    function formatDateToUTC(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    function formatDateDisplay(dateString) {
        const year = dateString.slice(0, 4);
        const month = dateString.slice(5, 7) - 1; // Month is 0-based for the Date object
        const day = dateString.slice(8, 10);
        
        const date = new Date(year, month, day); // Construct a Date object
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' }); // "Thu"
        const monthName = date.toLocaleString('en-US', { month: 'short' });   // "Oct"
        
        return `${dayOfWeek} ${monthName} ${day} ${year}`;
    }
    
    addEventButton.addEventListener('click', function () {
        openAddModal();
    });

    closeModal.addEventListener('click', function () {
        closeAddModal();
    });

    window.addEventListener('click', function (event) {
        if (event.target == addEventModal) {
            closeAddModal();
        }
    });

    eventForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const eventData = {
            id: editingEventId || generateUUID(),
            title: eventTitleInput.value,
            date: eventDateInput.value,
            time: eventTimeInput.value,
            duration: parseFloat(eventDurationInput.value),
            description: eventDescriptionInput.value
        };

        if (editingEventId) {
            itineraryData = itineraryData.map(event => event.id === editingEventId ? eventData : event);
        } else {
            itineraryData.push(eventData);
        }

        saveItineraryData();
        closeAddModal();
    });

    function openAddModal() {
        editingEventId = null;
        eventForm.reset();
        addEventModal.style.display = 'block';
    }

    function openEditModal(eventData) {
        editingEventId = eventData.id;
        eventTitleInput.value = eventData.title;
        eventDateInput.value = eventData.date;
        eventTimeInput.value = eventData.time;
        eventDurationInput.value = eventData.duration;
        eventDescriptionInput.value = eventData.description;
        addEventModal.style.display = 'block';
    }

    function closeAddModal() {
        addEventModal.style.display = 'none';
    }

    function saveItineraryData() {
        fetch('/save-itinerary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: localStorage.getItem('userId'),
                eventId: currentEventId,
                itinerary: itineraryData
            })
        })
            .then(response => response.json())
            .then(data => {
                populateDaySelect();
                renderItinerary();
            })
            .catch(error => {
                console.error('Error saving itinerary data.', error);
                alert('Error saving itinerary data.');
            });
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});
