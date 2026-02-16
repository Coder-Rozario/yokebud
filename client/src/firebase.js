// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqjx0dhWajIAtfs348S2s8iSKpWiqU8oQ",
  authDomain: "yokebud-85802.firebaseapp.com",
  projectId: "yokebud-85802",
  storageBucket: "yokebud-85802.firebasestorage.app",
  messagingSenderId: "359027482860",
  appId: "1:359027482860:web:3286f24352f18adffa45c9",
  measurementId: "G-LQRPX6BC52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Export authentication methods
export {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword
};

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;