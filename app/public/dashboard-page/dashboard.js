// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the Calendar button element by ID
    const calendarButton = document.getElementById('calendar-link');

    // Add a click event listener to the Calendar button
    calendarButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        console.log('Calendar button clicked');
        window.location.href = '/calendar-page'; // Redirect to the calendar page
    });
});
