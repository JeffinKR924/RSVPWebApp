document.addEventListener('DOMContentLoaded', async () => {
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
    const createPostButton = document.getElementById('createPostButton');
    const postsContainer = document.getElementById('postsContainer');
    const pollsButton = document.getElementById('polls-link');
    const takePollsButton = document.getElementById('take-polls-link');
    const viewPollsButton = document.getElementById('view-polls-link');
    const profileButton = document.getElementById('profileButton');
    const rsvpmanagerButton = document.getElementById('rsvpmanager-link');


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

    pollsButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/polls-page'; 
    });

    takePollsButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/take-poll-page'; 
    });

    viewPollsButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/view-poll-page'; 
    });

    rsvpmanagerButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/rsvpmanager-page'; 
    });

    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault(); 
    
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
    
        window.location.href = '/';
    });

    createPostButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        window.location.href = '/create-post-page'; 
    });

    await loadPosts(userId);

    async function loadPosts(userId) {
        try {
            const ownerEventsResponse = await fetch(`/get-user-events?userId=${encodeURIComponent(userId)}&type=owner`);
            const ownerEvents = await ownerEventsResponse.json();

            const attendeeEventsResponse = await fetch(`/get-user-events?userId=${encodeURIComponent(userId)}&type=attendee`);
            const attendeeEvents = await attendeeEventsResponse.json();

            const allEventIds = [...new Set([...ownerEvents, ...attendeeEvents].map(event => event.id))];

            for (const eventId of allEventIds) {
                const postsResponse = await fetch(`/get-wedding-posts?eventId=${encodeURIComponent(eventId)}`);
                const posts = await postsResponse.json();

                posts.forEach(post => {
                    const postElement = createPostElement(post);
                    postsContainer.insertBefore(postElement, postsContainer.firstChild); // Add post to the top
                });
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    function createPostElement(post) {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
    
        const postTop = document.createElement('div');
        postTop.className = 'post-top';
    
        const postInfo = document.createElement('div');
        postInfo.className = 'post-info';
    
        const posterName = document.createElement('span');
        posterName.className = 'poster-name';
        posterName.textContent = post.posterName;
    
        const postedInText = document.createElement('span');
        postedInText.className = 'posted-in-text';
        postedInText.textContent = ' posted in ';
    
        const weddingName = document.createElement('span');
        weddingName.className = 'wedding-name';
        weddingName.textContent = post.weddingName;
    
        postInfo.appendChild(posterName);
        postInfo.appendChild(postedInText);
        postInfo.appendChild(weddingName);
    
        postTop.appendChild(postInfo);
    
        const postTime = document.createElement('div');
        postTime.className = 'post-time';
        const postDateTime = new Date(post.createdAt['_seconds'] * 1000);
        postTime.textContent = `${postDateTime.toLocaleDateString()} ${postDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
        postCard.appendChild(postTop);
        postCard.appendChild(postTime);
    
        const postMiddle = document.createElement('div');
        postMiddle.className = 'post-middle';
        postMiddle.textContent = post.postContent;
    
        postCard.appendChild(postMiddle);
    
        if (post.imageUrl) {
            const postBottom = document.createElement('div');
            postBottom.className = 'post-bottom';
    
            const postImage = document.createElement('img');
            postImage.src = post.imageUrl;
            postImage.alt = 'Post Image';
    
            postBottom.appendChild(postImage);
            postCard.appendChild(postBottom);
        }
    
        return postCard;
    }
    
    
});
