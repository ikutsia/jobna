// Test Firebase connection
import { auth, db } from "./config";

export function testFirebaseConnection() {
  try {
    console.log("Firebase Auth:", auth ? "✅ Connected" : "❌ Not connected");
    console.log(
      "Firebase Firestore:",
      db ? "✅ Connected" : "❌ Not connected"
    );

    // Test if we can access Firebase config
    if (auth && db) {
      console.log("✅ Firebase is properly initialized");
      return true;
    } else {
      console.log("❌ Firebase initialization failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Firebase connection error:", error);
    return false;
  }
}
