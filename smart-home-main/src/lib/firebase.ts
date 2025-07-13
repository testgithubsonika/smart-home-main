// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cyberpunk-85ee8.firebaseapp.com",
  projectId: "cyberpunk-85ee8",
  storageBucket: "cyberpunk-85ee8.firebasestorage.app",
  messagingSenderId: "818564329414",
  appId: "1:818564329414:web:6ca62254c3c0b70a154cc7",
  measurementId: "G-0VY9NR06BM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export the app instance for other uses
export default app;