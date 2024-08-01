const express = require('express');
const app = express();
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');

let hostname = "localhost";
let port = 3000;

const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.get('/login-page', (req, res) => {
  res.sendFile(path.join(__dirname, "app", "login-page", "login.html"));
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


app.get('/signup-page', (req, res) => {
  res.sendFile(path.join(__dirname, "app", "signup-page", "signup.html"));
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});