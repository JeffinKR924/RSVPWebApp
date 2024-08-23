// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the Calendar button element by ID
    const calendarButton = document.getElementById('calendarButton');
    const homeButton = document.getElementById('homeButton');

    const createEventButton = document.getElementById('create-event-link');
    const mealCreationButton = document.getElementById('meal-creation-link');
    const viewEventsButton = document.getElementById('view-events-link');

    // Add a click event listener to the Calendar button
    calendarButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        window.location.href = '/calendar-page'; // Redirect to the calendar page
    });

    homeButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        window.location.href = '/dashboard-page'; // Redirect to the calendar page
    });

    createEventButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        window.location.href = '/event-form-page'; // Redirect to the calendar page
    });

    mealCreationButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        window.location.href = '/meal-creation-page'; // Redirect to the calendar page
    });

    viewEventsButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        window.location.href = '/get-event-form-page'; // Redirect to the calendar page
    });
});
