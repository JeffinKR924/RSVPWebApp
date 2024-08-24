document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!authToken || !userId) {
        window.location.href = '/';
        return; 
    }

    const calendarButton = document.getElementById('calendarButton');
    const homeButton = document.getElementById('homeButton');
    const logoutButton = document.getElementById('logoutButton');

    const createEventButton = document.getElementById('create-event-link');
    const mealCreationButton = document.getElementById('meal-creation-link');
    const viewEventsButton = document.getElementById('view-events-link');

    calendarButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/calendar-page'; 
    });

    homeButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/dashboard-page'; 
    });

    createEventButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/event-form-page'; 
    });

    mealCreationButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/meal-creation-page'; 
    });

    viewEventsButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/get-event-form-page'; 
    });

    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault(); 
    
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
    
        window.location.href = '/';
    });
});
