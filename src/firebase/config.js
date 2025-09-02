// Firebase configuration
// Replace these values with your actual Firebase project configuration

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Debug: Log environment variables (remove in production)
console.log("🔍 Firebase Config Check:");
console.log(
  "API Key:",
  process.env.REACT_APP_FIREBASE_API_KEY ? "✅ Loaded" : "❌ Missing"
);
console.log(
  "Auth Domain:",
  process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? "✅ Loaded" : "❌ Missing"
);
console.log(
  "Project ID:",
  process.env.REACT_APP_FIREBASE_PROJECT_ID ? "✅ Loaded" : "❌ Missing"
);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate config before initialization
const requiredFields = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
const missingFields = requiredFields.filter((field) => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error("❌ Firebase config missing required fields:", missingFields);
  throw new Error(
    `Firebase configuration incomplete. Missing: ${missingFields.join(", ")}`
  );
}

console.log("✅ Firebase config validation passed");

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("✅ Firebase services initialized successfully");

export default app;
