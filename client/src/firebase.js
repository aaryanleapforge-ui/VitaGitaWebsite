import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCkZpw5Knimf0KQ6OQ8G4fV5DK3SGZj5s",
  authDomain: "vitagita.firebaseapp.com",
  projectId: "vitagita",
  storageBucket: "vitagita.appspot.com",
  messagingSenderId: "147856937008",
  appId: "1:147856937008:web:294bc8e06e9ad3941f9df5",
  measurementId: "G-DN1K5MLH5H",
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
