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

const db = admin.firestore();

app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login-page', (req, res) => {
  res.sendFile(path.join(__dirname,'public', "login-page", "login.html"));
});

app.get('/signup-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup-page", "signup.html"));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    const token = await admin.auth().createCustomToken(userId);

    res.status(200).json({ message: 'Login successful', token, userId });
  } catch (error) {
    res.status(401).json({ message: 'Login failed', error: error.message });
  }
});

//This is for creating new users
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    const userId = userRecord.uid;

    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const token = await admin.auth().createCustomToken(userId);

    res.status(200).json({ message: 'Signup successful', token });
  } catch (error) {
    res.status(400).json({ message: 'Signup failed', error: error.message });
  }
});

app.get('/event-form-page', (req, res) => {
  res.sendFile(path.join(__dirname,'public', "event-form-page", "event-form.html"));
});


app.post('/save-event', async (req, res) => {
  const { userId, event } = req.body;

  if (!userId || !event) {
    return res.status(400).json({ message: 'User ID and event data are required.' });
  }

  try {
    await db.collection('users').doc(userId).collection('events').add(event);

    res.status(200).send('Event saved successfully');
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).send('Server Error');
  }
});



// Returns all events that can selected for modification
app.get('/get-events', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
      const eventsSnapshot = await db.collection('users').doc(userId).collection('events').get();
      if (eventsSnapshot.empty) {
          return res.json([]);
      }

      const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.json(events);
  } catch (error) {
      console.error('Error retrieving events:', error);
      res.status(500).send('Server Error');
  }
});

//Returns single event to be modified
app.get('/get-event', async (req, res) => {
  const { userId, eventTitle } = req.query;

  if (!userId || !eventTitle) {
      return res.status(400).json({ message: 'User ID and event title are required.' });
  }

  try {
      const snapshot = await db.collection('users').doc(userId).collection('events')
          .where('eventTitle', '==', eventTitle)
          .get();

      if (snapshot.empty) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const event = snapshot.docs[0].data();
      res.status(200).json(event);
  } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

//Updates an event
app.put('/update-event', async (req, res) => {
  const { id } = req.query;
  const { userId, event } = req.body;

  if (!id || !userId || !event) {
      return res.status(400).json({ message: 'ID, User ID, and event data are required.' });
  }

  try {
      const eventRef = db.collection('users').doc(userId).collection('events').doc(id);

      await eventRef.update(event);

      res.status(200).json({ message: 'Event updated successfully!' });
  } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});