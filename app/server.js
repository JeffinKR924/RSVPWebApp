const express = require('express');
const app = express();
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');
const bodyParser = require('body-parser');

let hostname = "localhost";
let port = 3000;

const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login-page', (req, res) => {
  res.sendFile(path.join(__dirname,'public', "login-page", "login.html"));
});

app.get('/event-form-page', (req, res) => {
  res.sendFile(path.join(__dirname,'public', "event-form-page", "event-form.html"));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(401).json({ message: 'Login failed', error: error.message });
  }
});

// Saves the event to `event-data.json`
app.post('/save-event', (req, res) => {
    const newEvent = req.body;
    const filePath = path.join(__dirname, 'event-data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading file:', err);
            return res.status(500).send('Server Error');
        }

        const events = data ? JSON.parse(data) : [];
        const existingEventIndex = events.findIndex(event => event.eventTitle === newEvent.eventTitle);

        if (existingEventIndex !== -1) {
            // Modify existing event
            events[existingEventIndex] = newEvent;
        } else {
            events.push(newEvent);
        }

        // Write updated events back to the file
        fs.writeFile(filePath, JSON.stringify(events, null, 2), (err) => {
            if (err) {
                console.error('Error writing event file:', err);
                return res.status(500).send('Server Error');
            }
            console.log('JSON data saved to event-data.json');
            res.status(200).send('Data saved successfully');
        });
    });
});

// Returns event json for event modification
app.get('/get-events', (req, res) => {
    const filePath = path.join(__dirname, 'event-data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            console.error('Error reading file:', err);
            return res.status(500).send('Server Error');
        }

        const events = JSON.parse(data);
        res.json(events);
    });
});


app.get('/signup-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup-page", "signup.html"));
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});