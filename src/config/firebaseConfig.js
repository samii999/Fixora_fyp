// src/config/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Optional: Analytics is not available in React Native without native setup
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC_cA4gbFrQeqPpmYQUOy09SoCASAav_bU",
  authDomain: "fixora-6e85b.firebaseapp.com",
  databaseURL: "https://fixora-6e85b-default-rtdb.firebaseio.com",
  projectId: "fixora-6e85b",
  storageBucket: "fixora-6e85b.firebasestorage.app",
  messagingSenderId: "477321569879",
  appId: "1:477321569879:web:7dde80c83b9f1977252512",
  measurementId: "G-XXNLKQREBZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Analytics only works with web or native builds
// const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
