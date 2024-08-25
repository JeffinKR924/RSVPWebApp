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

app.get('/dashboard-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "dashboard-page", "dashboard.html"));
});

app.get('/signup-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup-page", "signup.html"));
});

app.get('/meal-creation-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "meal-creation-page", "meal-creation.html"));
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

app.get('/get-event-form-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "get-event-form-page", "get-event-form-page.html"));
});

app.get('/create-post-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "create-post-page", "createpost.html"));
});

app.get('/meal-creation-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "meal-creation-page", "meal-creation.html"));
});

app.post('/save-meal', async (req, res) => {
  const { userId, eventId, appetizers, mainCourses, desserts } = req.body;

  if (!userId || !eventId || !appetizers || !mainCourses || !desserts) {
      return res.status(400).json({ message: 'User ID, Event ID, and meal options are required.' });
  }

  try {
      const eventRef = db.collection('users').doc(userId).collection('events').doc(eventId);
      await eventRef.set({
          mealOptions: {
              appetizers,
              mainCourses,
              desserts
          }
      }, { merge: true });

      res.status(200).send('Meal options saved successfully');
  } catch (error) {
      console.error('Error saving meal options:', error);
      res.status(500).send('Server Error');
  }
});



app.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      firstName,
      lastName
    });

    const userId = userRecord.uid;

    await db.collection('userAccounts').doc(userRecord.uid).set({
      email: email,
      firstName: firstName,
      lastName: lastName,
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

      const eventRef = await db.collection('userAccounts').doc(userId).collection('eventsOwner').add(event);
      console.log('eventRef:', eventRef);
      res.status(200).json({ message: 'Event saved successfully', event: event, id: eventRef.id });
  } catch (error) {
      console.error('Error saving event:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});



// Returns all events that can be selected for modification
app.get('/get-events', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
      const eventsSnapshot = await db.collection('userAccounts').doc(userId).collection('eventsOwner').get();
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
  const { userId, eventId } = req.query;

  if (!userId || !eventId) {
      return res.status(400).json({ message: 'User ID and event ID are required.' });
  }

  try {
      const eventRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(eventId);
      const eventDoc = await eventRef.get();
      console.log('eventDoc:', eventDoc);

      if (!eventDoc.exists) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const event = eventDoc.data();
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
      const eventRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(id);
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

app.post('/add-event-attendee', async (req, res) => {
  const { userId, eventId, eventData } = req.body;

  if (!userId || !eventId || !eventData) {
      return res.status(400).json({ message: 'User ID, Event ID, and Event Data are required.' });
  }

  try {
      const userRef = db.collection('userAccounts').doc(userId);
      console.log('event id:', eventId);
      
      // Create a document in the eventsAttendee sub-collection with the eventId as its ID
      // and include the full event details
      await userRef.collection('eventsAttendee').doc(eventId).set(eventData);

      res.status(200).json({ message: 'Event added to attendee list successfully!' });
  } catch (error) {
      console.error('Error adding event to attendee list:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


app.get('/get-user-events', async (req, res) => {
  const { userId, type } = req.query;


  if (!userId || !type) {
      return res.status(400).json({ message: 'User ID and type (owner/attendee) are required.' });
  }

  try {
      const userRef = db.collection('userAccounts').doc(userId);
      const eventsRef = userRef.collection(type === 'owner' ? 'eventsOwner' : 'eventsAttendee');
      const snapshot = await eventsRef.get();

      if (snapshot.empty) {
          return res.status(200).json([]); // No events found
      }

      const events = [];
      snapshot.forEach(doc => {
          const eventData = doc.data();
          eventData.id = doc.id; // Add the event ID to the data
          events.push(eventData);
      });

      res.status(200).json(events);
  } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

app.post('/save-post', async (req, res) => {
  try {
      const { weddingId, weddingName, postContent, posterName, imageUrl } = req.body;

      if (!weddingId || !weddingName || !postContent || !posterName) {
          return res.status(400).json({ message: 'Missing required fields' });
      }

      const weddingRef = db.collection('weddingPosts').doc(weddingId);
      const postsCollectionRef = weddingRef.collection('posts');
      const postSnapshot = await postsCollectionRef.get();

      const postNumber = postSnapshot.size + 1;
      const postRef = postsCollectionRef.doc(`Post ${postNumber}`);

      await postRef.set({
          weddingName,
          postContent,
          imageUrl,
          posterName,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ message: 'Post created successfully' });
  } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});



// Endpoint to get the user's full name based on userId
app.get('/get-user-name', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
      const userRef = db.collection('userAccounts').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
          return res.status(404).json({ message: 'User not found.' });
      }

      const userData = userDoc.data();
      const fullName = `${userData.firstName} ${userData.lastName}`;
      res.status(200).json({ fullName });
  } catch (error) {
      console.error('Error fetching user name:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

app.get('/get-wedding-posts', async (req, res) => {
  const { eventId } = req.query;

  if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required.' });
  }

  try {
      const postsRef = db.collection('weddingPosts').doc(eventId).collection('posts');
      const postsSnapshot = await postsRef.get();

      if (postsSnapshot.empty) {
          return res.json([]); // No posts found
      }

      const posts = postsSnapshot.docs.map(doc => doc.data());

      res.status(200).json(posts);
  } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
