document.addEventListener('DOMContentLoaded', function() {
    const eventSelect = document.getElementById('eventSelect');
    const pollSelect = document.getElementById('pollSelect');
    const pollSelectGroup = document.getElementById('pollSelectGroup');
    const pollResultsChartCtx = document.getElementById('pollResultsChart').getContext('2d');
    let pollChart;

    async function fetchEvents() {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert('User is not logged in.');
            return;
        }

        try {
            const response = await fetch(`/get-events?userId=${encodeURIComponent(userId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const events = await response.json();
            populateEventDropdown(events);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    function populateEventDropdown(events) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.eventTitle;
            eventSelect.appendChild(option);
        });
    }

    async function fetchPolls(eventId) {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert('User is not logged in.');
            return;
        }

        try {
            const response = await fetch(`/get-polls?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch polls');
            }

            const polls = await response.json();
            populatePollDropdown(polls);
        } catch (error) {
            console.error('Error fetching polls:', error);
        }
    }

    function populatePollDropdown(polls) {
        pollSelect.innerHTML = '<option value="">Select a poll</option>';
        polls.forEach(poll => {
            const option = document.createElement('option');
            option.value = poll.id;
            option.textContent = poll.question;
            pollSelect.appendChild(option);
        });
    }

    async function fetchPollData(pollId) {
        const userId = localStorage.getItem('userId');
        const eventId = eventSelect.value;

        if (!userId || !eventId) {
            alert('User or Event not properly selected.');
            return;
        }

        try {
            const response = await fetch(`/get-poll?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}&pollId=${encodeURIComponent(pollId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch poll data');
            }

            const pollData = await response.json();
            console.log(pollData);
            renderPollChart(pollData);
        } catch (error) {
            console.error('Error fetching poll data:', error);
        }
    }

    function renderPollChart(pollData) {
        if (!pollData || !pollData.optionsCount || typeof pollData.optionsCount !== 'object') {
            console.error('Invalid poll data:', pollData);
            return;
        }
    
        const { optionsCount } = pollData;
    
        const labels = Object.keys(optionsCount).filter(key => optionsCount[key] > 0);
        const data = labels.map(label => optionsCount[label]);
    
        if (data.length === 0) {
            // No data case
            if (pollChart) {
                pollChart.destroy();
            }
    
            pollChart = new Chart(pollResultsChartCtx, {
                type: 'pie',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        label: 'Poll Results',
                        data: [1],
                        backgroundColor: ['#D3D3D3'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: () => 'No Data'
                            }
                        }
                    }
                }
            });
        } else {
            if (pollChart) {
                pollChart.destroy();
            }
    
            pollChart = new Chart(pollResultsChartCtx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: pollData.question,
                        data: data,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }
    }

    eventSelect.addEventListener('change', function() {
        const eventId = eventSelect.value;
        
        if (eventId) {
            pollSelectGroup.style.display = 'block';
            fetchPolls(eventId);
        } else {
            pollSelectGroup.style.display = 'none';
            pollSelect.innerHTML = '<option value="">Select a poll</option>';
        }
    });

    eventSelect.addEventListener('change', function() {
        const eventId = eventSelect.value;
        
        pollSelect.innerHTML = '<option value="">Select a poll</option>';
        pollSelectGroup.style.display = 'none';
        if (pollChart) {
            pollChart.destroy();
        }

        if (eventId) {
            pollSelectGroup.style.display = 'block';
            fetchPolls(eventId);
        }
    });

    pollSelect.addEventListener('change', function() {
        const pollId = pollSelect.value;
        
        if (pollId) {
            fetchPollData(pollId);
        } else if (pollChart) {
            pollChart.destroy();
        }
    });

    document.getElementById('close-button').addEventListener('click', function() {
        window.location.href = '/dashboard-page';
    });

    fetchEvents();
});
