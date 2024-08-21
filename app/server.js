const express = require('express');
const app = express();
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');
const bodyParser = require('body-parser');

let hostname = "0.0.0.0";
let port = 3000;

const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home-page", "homepage.html"));
});

app.get('/login-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "login-page", "login.html"));
});

app.get('/signup-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup-page", "signup.html"));
});

app.get('/calendar-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "calendar-page", "calendar.html"));
});

// Serve event-form-guest-view page
app.get('/event-form-guest-view.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'event-form-guest-view', 'event-form-guest-view.html'));
});

app.get('/event-form-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "event-form-page", "event-form.html"));
});


app.get('/meal-creation-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "meal-creation-page", "meal-creation.html"));
});


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

app.post('/save-event', async (req, res) => {
  const { userId, event } = req.body;

  if (!userId || !event) {
      return res.status(400).json({ message: 'User ID and event data are required.' });
  }

  try {
      // Transform the giftList from an array of strings to an array of objects
      if (event.giftList) {
          event.giftList = event.giftList.map(gift => ({
              name: gift,
              claimedBy: null
          }));
      }

      await db.collection('users').doc(userId).collection('events').add(event);
      res.status(200).send('Event saved successfully');
  } catch (error) {
      console.error('Error saving event:', error);
      res.status(500).send('Server Error');
  }
});


// Returns all events that can be selected for modification
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

// Returns a single event to be modified
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


// Updates an event
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

// Event guest view
app.get('/get-event', async (req, res) => {
  const { eventId } = req.query;

  if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required.' });
  }

  try {
      const eventSnapshot = await db.collection('events').doc(eventId).get();

      if (!eventSnapshot.exists) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const event = eventSnapshot.data();
      res.status(200).json(event);
  } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

app.post('/update-guest-response', async (req, res) => {
  const { eventId } = req.query;
  const { guestName, bringGift, selectedGift } = req.body;

  const [userId, eventTitle] = eventId.split('-');

  if (!userId || !eventTitle || !guestName) {
      return res.status(400).json({ message: 'Event ID, event title, user ID, and guest name are required.' });
  }

  try {
      const eventsRef = db.collection('users').doc(userId).collection('events');
      const snapshot = await eventsRef.where('eventTitle', '==', eventTitle).get();

      if (snapshot.empty) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const eventDoc = snapshot.docs[0];
      const eventData = eventDoc.data();

      const guestIndex = eventData.guestList.findIndex(guest => guest.name === guestName);
      if (guestIndex === -1) {
          return res.status(404).json({ message: 'Guest not found.' });
      }

      // Update the guest's response
      eventData.guestList[guestIndex].bringingGift = bringGift;

      // Mark the selected gift as claimed, but hide who claimed it
      if (bringGift && selectedGift) {
          const giftIndex = eventData.giftList.findIndex(gift => gift.name === selectedGift);
          if (giftIndex !== -1) {
              eventData.giftList[giftIndex].claimedBy = "Claimed";
          }
      }

      // Update the event document with the new guest and gift data
      await eventsRef.doc(eventDoc.id).update({ 
          guestList: eventData.guestList, 
          giftList: eventData.giftList 
      });

      res.status(200).json({ success: true });
  } catch (error) {
      console.error('Error updating guest response:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
