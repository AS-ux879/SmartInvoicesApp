// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAWj23fIad9ec9T1fbT0XkpVLxnK9f2wg",
  authDomain: "smartinvoicesapp-ca382.firebaseapp.com",
  projectId: "smartinvoicesapp-ca382",
  storageBucket: "smartinvoicesapp-ca382.appspot.com",
  messagingSenderId: "578187855094",
  appId: "1:578187855094:web:5e4414db92c5ad17afd8d7",
  measurementId: "G-T1H667FSH3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
