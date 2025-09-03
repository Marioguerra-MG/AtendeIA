// Import compat ou modular dependendo do seu setup

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";



// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDOJn5H2t6D5_Nwmgm6pb7lLmuWZyEI3Ok",
  authDomain: "agenda-saas-93543.firebaseapp.com",
  projectId: "agenda-saas-93543",
  storageBucket: "agenda-saas-93543.firebasestorage.app",
  messagingSenderId: "768416859620",
  appId: "1:768416859620:web:368557e1e6e7d53971f3f1"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };