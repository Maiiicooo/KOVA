import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { firebaseConfig } from "./firebaseconfig"; // import config

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);

export async function saveEmail(email) {
  try {
    await addDoc(collection(db, "emails"), { email, timestamp: serverTimestamp() });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
