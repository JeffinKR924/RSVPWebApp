const express = require('express');
const app = express();
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');
const bodyParser = require('body-parser');
const https = require('https');


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

app.get('/profile-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile-page", "profile.html"));
});

app.get('/polls-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "polls-page", "polls.html"));
});

app.get('/take-poll-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "take-poll-page", "take-poll.html"));
});

app.get('/view-poll-page', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view-poll-page", "view-poll.html"));
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

app.get('/contact-us-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "contact-us-page", "contact-us.html"));
});

app.get('/rsvpmanager-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "rsvpmanager-page", "rsvpmanager.html"));
});

app.get('/itinerary-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', "itinerary-page", "itinerary.html"));
});

app.post('/save-meal', async (req, res) => {
  const { userId, eventId, appetizers, mainCourses, desserts } = req.body;

  if (!userId || !eventId || !appetizers || !mainCourses || !desserts) {
      return res.status(400).json({ message: 'User ID, Event ID, and meal options are required.' });
  }

  try {
      const eventRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(eventId);
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


app.post('/save-poll', async (req, res) => {
  const { userId, eventId, pollQuestion, pollOptions } = req.body;

  if (!userId || !eventId || !pollQuestion || !pollOptions || !Array.isArray(pollOptions) || pollOptions.length === 0) {
    return res.status(400).json({ message: 'User ID, Event ID, poll question, and poll options are required.' });
  }

  try {
    const optionsCount = pollOptions.reduce((acc, option) => {
      acc[option] = 0;
      return acc;
    }, {});

    // Step 1: Save the poll to the owner's event in the 'eventsOwner' collection
    const eventOwnerRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(eventId);
    const pollsRef = eventOwnerRef.collection('polls');
    const newPollRef = pollsRef.doc();
    
    await newPollRef.set({
      question: pollQuestion,
      options: pollOptions,
      optionsCount: optionsCount,
      voters: []
    });

    // Step 2: Update polls for all attendees of the event
    const userAccountsRef = db.collection('userAccounts');
    const usersSnapshot = await userAccountsRef.get();
    
    const newPollData = {
      id: newPollRef.id,
      question: pollQuestion,
      options: pollOptions,
    };

    // Loop through all users to update attendee events
    usersSnapshot.forEach(async (userDoc) => {
      const userId = userDoc.id; // Get user ID
      const eventsAttendeeRef = db.collection('userAccounts').doc(userId).collection('eventsAttendee').doc(eventId);
      const eventDoc = await eventsAttendeeRef.get();

      if (eventDoc.exists) {
        // If the event exists in the attendee's collection, update the polls array
        await eventsAttendeeRef.update({
          polls: admin.firestore.FieldValue.arrayUnion(newPollData) // Add new poll to polls array
        });
      }
    });

    res.status(200).send('Poll saved successfully and attendee events updated.');
  } catch (error) {
    console.error('Error saving poll or updating attendees:', error);
    res.status(500).send('Server Error');
  }
});


app.post('/submit-poll-response', async (req, res) => {
  const { userId, pollId, eventId, selectedOption } = req.body;

  if (!userId || !pollId || !eventId || !selectedOption) {
      return res.status(400).json({ message: 'User ID, poll ID, and selected option are required.' });
  }

  try {
      const userRef = db.collection('userAccounts').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
          return res.status(404).json({ message: 'User not found.' });
      }

      const usersRef = db.collection('userAccounts');
      const usersSnapshot = await usersRef.get();

      let eventPollRef = null;

      for (const userDoc of usersSnapshot.docs) {
          const eventsOwnerRef = userDoc.ref.collection('eventsOwner');
          const eventsOwnerSnapshot = await eventsOwnerRef.get();

          for (const eventDoc of eventsOwnerSnapshot.docs) {
              if (eventDoc.id === eventId) {
                  eventPollRef = eventDoc.ref.collection('polls').doc(pollId);
                  break;
              }
          }

          if (eventPollRef) {
              break;
          }
      }

      if (!eventPollRef) {
          return res.status(404).json({ message: 'Event or poll not found.' });
      }

      // Fetch and update the poll
      const pollDoc = await eventPollRef.get();

      if (!pollDoc.exists) {
          return res.status(404).json({ message: 'Poll not found.' });
      }

      const pollData = pollDoc.data();
      const { optionsCount, voters } = pollData;

      if (!(selectedOption in optionsCount)) {
          return res.status(400).json({ message: 'Invalid option selected.' });
      }

      if (voters.includes(userId)) {
          return res.status(400).json({ message: 'User has already voted on this poll.' });
      }

      optionsCount[selectedOption] += 1;

      await eventPollRef.update({
          optionsCount: optionsCount,
          voters: admin.firestore.FieldValue.arrayUnion(userId)
      });

      res.status(200).json({ message: 'Poll response submitted successfully.' });
  } catch (error) {
      console.error('Error submitting poll response:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});



app.get('/get-polls', async (req, res) => {
  const { userId, eventId } = req.query;

  if (!userId || !eventId) {
      return res.status(400).json({ message: 'User ID and Event ID are required.' });
  }

  try {
      const pollsRef = db.collection('userAccounts').doc(userId)
          .collection('eventsOwner').doc(eventId)
          .collection('polls');

      const pollsSnapshot = await pollsRef.get();
      const polls = pollsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));

      res.status(200).json(polls);
  } catch (error) {
      console.error('Error fetching polls:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


app.get('/get-poll', async (req, res) => {
  const { userId, eventId, pollId } = req.query;

  if (!userId || !eventId || !pollId) {
      return res.status(400).json({ message: 'User ID, Event ID, and Poll ID are required.' });
  }

  try {
      const pollRef = db.collection('userAccounts').doc(userId)
          .collection('eventsOwner').doc(eventId)
          .collection('polls').doc(pollId);

      const pollDoc = await pollRef.get();

      if (!pollDoc.exists) {
          return res.status(404).json({ message: 'Poll not found.' });
      }

      const pollData = pollDoc.data();

      res.status(200).json({ ...pollData});
  } catch (error) {
      console.error('Error fetching poll data:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
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
      event.eventOwnerId = userId;

      const eventRef = await db.collection('userAccounts').doc(userId).collection('eventsOwner').add(event);
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
    let events = [];

    // Get events from `eventsOwner` collection
    const ownerEventsSnapshot = await db.collection('userAccounts').doc(userId).collection('eventsOwner').get();
    if (!ownerEventsSnapshot.empty) {
      const ownerEvents = ownerEventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'owner' }));
      events = [...events, ...ownerEvents];
    }

    // Get events from `eventsAttendee` collection
    const attendeeEventsSnapshot = await db.collection('userAccounts').doc(userId).collection('eventsAttendee').get();
    if (!attendeeEventsSnapshot.empty) {
      const attendeeEvents = await Promise.all(
        attendeeEventsSnapshot.docs.map(async (doc) => {
          const attendeeEventData = doc.data();
          if (attendeeEventData.eventReference) {
            try {
              // Use Firestore `DocumentReference` to get the event directly
              const referencedEventDoc = await attendeeEventData.eventReference.get();

              if (referencedEventDoc.exists) {
                const eventDetails = referencedEventDoc.data();
                return { id: referencedEventDoc.id, ...eventDetails, type: 'attendee' };
              }
            } catch (error) {
              console.error(`Error retrieving event data for attendee event: ${doc.id}`, error);
            }
          }
          return null;
        })
      );

      // Filter out any null values from the attendeeEvents array
      const resolvedAttendeeEvents = attendeeEvents.filter(event => event !== null);
      events = [...events, ...resolvedAttendeeEvents];
    }

    // Remove duplicate events by comparing their IDs
    const uniqueEvents = events.reduce((acc, event) => {
      if (!acc.some(existingEvent => existingEvent.id === event.id)) {
        acc.push(event);
      }
      return acc;
    }, []);

    res.json(uniqueEvents);
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

      if (!eventDoc.exists) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const event = eventDoc.data();

      const pollsSnapshot = await eventRef.collection('polls').get();
      const polls = pollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const mealOptions = event.mealOptions || {
          appetizers: [],
          mainCourses: [],
          desserts: []
      };
      
      res.status(200).json({
          ...event,
          mealOptions,
          polls
      });
  } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


app.get('/get-attendee-event', async (req, res) => {
  const { userId, eventId } = req.query;

  if (!userId || !eventId) {
      return res.status(400).json({ message: 'User ID and event ID are required.' });
  }

  try {
      // Fetch event details from the attendee's collection
      const eventRef = db.collection('userAccounts').doc(userId).collection('eventsAttendee').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const event = eventDoc.data();

      const mealOptions = event.mealOptions || {
          appetizers: [],
          mainCourses: [],
          desserts: []
      };

      const usersRef = db.collection('userAccounts');
      const usersSnapshot = await usersRef.get();

      let ownerId;
      for (const userDoc of usersSnapshot.docs) {
          const ownerRef = userDoc.ref.collection('eventsOwner').doc(eventId);
          const ownerDoc = await ownerRef.get();

          if (ownerDoc.exists) {
              ownerId = userDoc.id;
              break;
          }
      }

      if (!ownerId) {
          return res.status(404).json({ message: 'Event owner not found.' });
      }

      const filteredPolls = [];

      const pollsRef = db.collection('userAccounts').doc(ownerId)
          .collection('eventsOwner').doc(eventId)
          .collection('polls');
      const pollsSnapshot = await pollsRef.get();

      pollsSnapshot.forEach(pollDoc => {
          const pollData = pollDoc.data();
          const { voters } = pollData;

          if (!voters.includes(userId)) {
              filteredPolls.push({
                  id: pollDoc.id,
                  ...pollData
              });
          }
      });

      res.status(200).json({
          ...event,
          mealOptions,
          polls: filteredPolls
      });
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
  const {
    userId,
    eventId,
    guestName,
    bringGift,
    selectedAppetizer,
    selectedMainCourse,
    selectedDessert,
    confirmed,
    claimedGift,
    attendanceStatus
  } = req.body;

  // Check required fields
  if (!userId || !eventId || !guestName) {
      return res.status(400).send('Missing required fields (userId, eventId, guestName)');
  }

  try {
      const usersRef = db.collection('userAccounts');
      let eventDocRef = null;

      // Find event owner
      const usersSnapshot = await usersRef.get();
      for (const userDoc of usersSnapshot.docs) {
          const eventsOwnerRef = userDoc.ref.collection('eventsOwner').doc(eventId);
          const eventDoc = await eventsOwnerRef.get();
          if (eventDoc.exists) {
              eventDocRef = eventsOwnerRef;
              break;
          }
      }

      if (!eventDocRef) {
          return res.status(404).send('Event not found');
      }

      const eventDoc = await eventDocRef.get();
      const eventData = eventDoc.data();

      let guestUpdated = false;

      // Helper function to remove undefined fields
      const removeUndefined = (obj) => {
          return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? null : value)));
      };

      // Update guest list and claim the gift
      const updatedGuestList = eventData.guestList.map(guest => {
          if (guest.name === guestName) {
              guestUpdated = true;
              return removeUndefined({
                  ...guest,
                  bringGift: bringGift !== undefined ? bringGift : guest.bringGift,
                  mealSelection: {
                      appetizer: selectedAppetizer !== undefined ? selectedAppetizer : guest.mealSelection?.appetizer,
                      mainCourse: selectedMainCourse !== undefined ? selectedMainCourse : guest.mealSelection?.mainCourse,
                      dessert: selectedDessert !== undefined ? selectedDessert : guest.mealSelection?.dessert,
                  },
                  confirmed: confirmed !== undefined ? confirmed : guest.confirmed,
                  attendanceStatus: attendanceStatus !== undefined ? attendanceStatus : guest.attendanceStatus,
                  claimedGift: claimedGift !== undefined ? claimedGift : guest.claimedGift,
              });
          }
          return guest;
      });

      if (!guestUpdated) {
          return res.status(404).send('Guest not found');
      }

      // Update event data in Firestore
      await eventDocRef.update({
          guestList: updatedGuestList,
      });

      // Create a reference to the event in the attendee's collection
      const userRef = db.collection('userAccounts').doc(userId);
      await userRef.collection('eventsAttendee').doc(eventId).set({
          eventReference: eventDocRef, // Store as a Firestore reference object, not a string
          eventName: eventData.eventTitle,
          attendanceStatus: attendanceStatus,
          bringGift: bringGift,
          selectedAppetizer: selectedAppetizer,
          selectedMainCourse: selectedMainCourse,
          selectedDessert: selectedDessert
      });

      res.status(200).send('Guest response and attendee event collection updated successfully');
  } catch (error) {
      console.error('Error updating guest response:', error);
      res.status(500).send('Error updating guest response');
  }
});


app.post('/add-event-attendee', async (req, res) => {
  const { userId, eventId, ownerUserId } = req.body;

  if (!userId || !eventId || !ownerUserId) {
    return res.status(400).json({ message: 'User ID, Event ID, and Owner User ID are required.' });
  }

  try {
    // Reference to the user in `userAccounts`
    const userRef = db.collection('userAccounts').doc(userId);

    // Reference to the owner's event document in `eventsOwner`
    const ownerEventRef = db.collection('userAccounts').doc(ownerUserId).collection('eventsOwner').doc(eventId);

    // Store the document path as a string instead of a `DocumentReference` object
    const ownerEventPath = ownerEventRef.path;

    await userRef.collection('eventsAttendee').doc(eventId).set({
      eventReference: ownerEventPath,  // Save the path as a string
      eventName: "Event Name Here",    // Placeholder values - update as needed
      attendanceStatus: "confirm"      // Placeholder values - update as needed
    });

    res.status(200).json({ message: 'Event reference added to attendee list successfully!' });
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

// Load Google Maps API key from the config file
const googleMapsConfigPath = path.join(__dirname, 'google-maps-config.json');
const googleMapsConfig = JSON.parse(fs.readFileSync(googleMapsConfigPath, 'utf8'));
const googleMapsApiKey = googleMapsConfig.maps_api_key;

// API route to validate addresses
app.get('/validate-address', (req, res) => {
    const address = req.query.address;

    if (!address) {
        return res.status(400).json({ message: 'Address is required.' });
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;

    // Make the request to the Google Maps API
    https.get(geocodeUrl, (response) => {
        let data = '';

        // Collect the data from the response
        response.on('data', (chunk) => {
            data += chunk;
        });

        // Once the response is complete
        response.on('end', () => {
            try {
                const result = JSON.parse(data);

                if (result.status === 'OK' && result.results.length > 0) {
                    // Address is valid, return the location
                    return res.json({ valid: true, location: result.results[0].geometry.location });
                } else {
                    // Address is invalid
                    return res.json({ valid: false, message: 'Invalid address.' });
                }
            } catch (error) {
                console.error('Error parsing response:', error);
                res.status(500).json({ message: 'Error processing address validation response.' });
            }
        });
    }).on('error', (error) => {
        console.error('Error validating address:', error);
        res.status(500).json({ message: 'Error validating address.' });
    });
});

app.get('/load-google-maps', (req, res) => {
  // Load the API key from the google-maps-config.json file
  const apiKey = googleMapsConfig.maps_api_key;

  // Send the Google Maps API script URL with the API key
  res.json({ googleMapsScript: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places` });
});

app.get('/get-user-info', async (req, res) => {
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
    res.status(200).json({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      createdAt: userData.createdAt.toDate().toISOString() // Convert Firestore timestamp to ISO string
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

app.post('/modify-event-rsvp', async (req, res) => {
  const { userId, eventId, guestName, invitationSent, thankYouSent } = req.body;

  if (!userId || !eventId || !guestName) {
      return res.status(400).json({ message: 'User ID, Event ID, and Guest Name are required.' });
  }

  try {
      const eventRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      const eventData = eventDoc.data();
      const guestList = eventData.guestList || [];

      const updatedGuestList = guestList.map(guest => {
          if (guest.name === guestName) {
              return {
                  ...guest,
                  invitationSent: invitationSent,
                  thankYouSent: thankYouSent
              };
          }
          return guest;
      });

      await eventRef.update({
          guestList: updatedGuestList
      });

      res.status(200).json({ message: 'Guest RSVP information updated successfully.' });
  } catch (error) {
      console.error('Error updating guest RSVP information:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Existing get-itinerary endpoint
app.get('/get-itinerary', async (req, res) => {
  const { userId, eventId } = req.query;

  if (!userId || !eventId) {
    return res.status(400).json({ message: 'User ID and Event ID are required.' });
  }

  try {
    let fullItinerary = [];

    // Fetch itinerary from `eventsOwner`
    const ownerEventRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(eventId);
    const ownerEventDoc = await ownerEventRef.get();

    if (ownerEventDoc.exists) {
      const ownerEventData = ownerEventDoc.data();
      fullItinerary = [...fullItinerary, ...(ownerEventData.itinerary || [])];
    }

    // Fetch itinerary from `eventsAttendee`
    const attendeeEventRef = db.collection('userAccounts').doc(userId).collection('eventsAttendee').doc(eventId);
    const attendeeEventDoc = await attendeeEventRef.get();

    if (attendeeEventDoc.exists) {
      const attendeeEventData = attendeeEventDoc.data();

      // Use the Firestore reference object directly to get the document
      const eventReference = attendeeEventData.eventReference;

      if (eventReference) {
        // Directly use `get()` on the `DocumentReference`
        const referencedEventDoc = await eventReference.get();

        if (referencedEventDoc.exists) {
          const eventData = referencedEventDoc.data();

          // Add the referenced event's itinerary if it exists
          if (eventData && eventData.itinerary) {
            fullItinerary = [...fullItinerary, ...eventData.itinerary];
          }
        }
      }
    }

    // Remove duplicate events by ID
    const uniqueItinerary = fullItinerary.reduce((acc, event) => {
      if (!acc.some(existingEvent => existingEvent.id === event.id)) {
        acc.push(event);
      }
      return acc;
    }, []);

    res.status(200).json({ itinerary: uniqueItinerary });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});



app.post('/save-itinerary', async (req, res) => {
  const { userId, eventId, itinerary } = req.body;

  if (!userId || !eventId || !Array.isArray(itinerary)) {
    return res.status(400).json({ message: 'User ID, Event ID, and a valid itinerary array are required.' });
  }

  try {
    // Reference to the event in `eventsOwner` collection of the user
    const ownerEventRef = db.collection('userAccounts').doc(userId).collection('eventsOwner').doc(eventId);

    // Check if the event exists in the owner's collection
    const ownerEventDoc = await ownerEventRef.get();

    if (ownerEventDoc.exists) {
      // If the event is found in `eventsOwner`, update the itinerary there
      await ownerEventRef.update({ itinerary: itinerary });
      console.log(`Itinerary saved successfully in the owner's event collection for event ID: ${eventId}`);
      return res.status(200).json({ message: 'Itinerary saved successfully in the owner\'s event collection.' });
    }

    // If not found in `eventsOwner`, check `eventsAttendee`
    const attendeeEventRef = db.collection('userAccounts').doc(userId).collection('eventsAttendee').doc(eventId);
    const attendeeEventDoc = await attendeeEventRef.get();

    if (attendeeEventDoc.exists) {
      const attendeeEventData = attendeeEventDoc.data();
      const eventReference = attendeeEventData.eventReference;

      if (eventReference && eventReference instanceof admin.firestore.DocumentReference) {
        // Use the DocumentReference directly to update the original owner event document
        console.log(`Navigating to the owner's event using reference path: ${eventReference.path}`);

        // Update the itinerary in the original owner's event document
        await eventReference.update({ itinerary: itinerary });
        console.log(`Itinerary saved successfully in the referenced owner's event collection at path: ${eventReference.path}`);
        return res.status(200).json({ message: 'Itinerary saved successfully in the referenced owner\'s event collection.' });
      } else {
        console.error(`Invalid or missing DocumentReference in attendee document for event ID: ${eventId}`);
        return res.status(404).json({ message: 'Invalid or missing DocumentReference in attendee document.' });
      }
    }

    // If neither found, return error
    return res.status(404).json({ message: 'Event not found in the owner\'s or attendee\'s collection.' });
  } catch (error) {
    console.error('Error saving itinerary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
