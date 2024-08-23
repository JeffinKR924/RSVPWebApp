document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confPassword = document.getElementById('confPassword').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

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
        console.log(data);
        console.log(data.token);
        if (data.token) {
            alert("Signup Successful")
            window.location.href = '/login-page';
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
    window.location.href = '/login-page';
});

document.getElementById('close-button').addEventListener('click', function() {
    window.location.href = '/';
});