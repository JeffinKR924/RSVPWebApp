document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
  
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User is not logged in.');
        return;
    }

    // Fetch events from the server
    fetch(`/get-events?userId=${encodeURIComponent(userId)}`)
      .then(response => response.json())
      .then(events => {
        // Filter events to include only title and start (and optionally end)
        const filteredEvents = events.map(event => ({
          title: event.eventTitle,
          start: event.eventDate,
        }));
  
        var calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          events: filteredEvents,
          dateClick: function(info) {
            alert('Clicked on: ' + info.dateStr);
          },
          eventClick: function(info) {
            alert('Event: ' + info.event.title);
          }
        });
  
        calendar.render();
      })
      .catch(error => console.error('Error fetching events:', error));
  });
  
document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});