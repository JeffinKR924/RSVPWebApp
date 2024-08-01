// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQyFZaExqokV5RFIU1i-dz6hT-4F1yAvE",
  authDomain: "rsvplease-4f2d3.firebaseapp.com",
  projectId: "rsvplease-4f2d3",
  storageBucket: "rsvplease-4f2d3.appspot.com",
  messagingSenderId: "977993001518",
  appId: "1:977993001518:web:4da5929f00c85c2b6c0dbf",
  measurementId: "G-PBMSSZSBDE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {app, auth}