// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, RecaptchaVerifier } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { Firestore, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSANGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const currentApps = getApps();
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let firestore: Firestore;
if (!currentApps.length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  firestore = getFirestore(app);
} else {
  app = currentApps[0];
  auth = getAuth(app);
  storage = getStorage(app);
  firestore = getFirestore(app);
}
// if (process.env.NODE_ENV === "development") {
//   connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
// }

export { app, auth, storage, firestore, RecaptchaVerifier };
