import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA",
  authDomain: "smartinvoicesapp-ebb2c.firebaseapp.com",
  projectId: "smartinvoicesapp-ebb2c",
  storageBucket: "smartinvoicesapp-ebb2c.appspot.com",
  messagingSenderId: "665203531882",
  appId: "1:665203531882:web:e793ac17dc0f5b5d92aa13"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
