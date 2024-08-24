document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confPassword = document.getElementById('confPassword').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl'); // Get `returnUrl` from the query string

    if (password !== confPassword) {
        alert("Passwords do not match!");
        return;
    }

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, firstName, lastName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            alert("Signup Successful");
            // Redirect to the login page with the returnUrl parameter
            window.location.href = `/login-page?returnUrl=${encodeURIComponent(returnUrl)}`;
        } else {
            console.error('Signup failed:', data.message);
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

document.getElementById('login-button').addEventListener('click', function() {
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    window.location.href = `/login-page?returnUrl=${encodeURIComponent(returnUrl)}`; // Pass returnUrl to login page
});

document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});
