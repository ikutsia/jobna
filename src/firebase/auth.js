import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Chrome extension ID (Jobna LinkedIn lead capture)
const EXTENSION_ID = "cdchpfeiabfdgacbfaggafggncghminh";

/**
 * Sync the logged-in Firebase user to the Chrome extension so job leads
 * can be saved under the real Firebase uid (not a local tester ID).
 */
export const syncAuthUserToExtension = (user) => {
  try {
    if (
      !user ||
      typeof window === "undefined" ||
      !window.chrome?.runtime?.sendMessage
    ) {
      return;
    }

    window.chrome.runtime.sendMessage(
      EXTENSION_ID,
      { action: "SET_AUTH_USER", userId: user.uid },
      (response) => {
        if (window.chrome.runtime.lastError) {
          // Extension not installed / not allowed to receive messages from this origin
          console.log(
            "Chrome extension not available:",
            window.chrome.runtime.lastError.message
          );
          return;
        }

        if (response?.success) {
          console.log(
            "Extension authenticated successfully with UID:",
            user.uid
          );
        }
      }
    );
  } catch (error) {
    console.log("Could not sync auth to Chrome extension:", error.message);
  }
};

// Keep the extension in sync whenever Firebase auth state changes
// (login, signup, refresh, or returning session).
onAuthStateChanged(auth, (user) => {
  syncAuthUserToExtension(user);
});

// User registration with profile creation
export const registerUser = async (email, password, userData) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      jobTitle: userData.jobTitle || "",
      experience: userData.experience || "",
      country: userData.country || "",
      yearOfBirth: userData.yearOfBirth || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agreeToTerms: userData.agreeToTerms,
    });

    // Update display name
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`,
    });

    // Send email verification (optional)
    await sendEmailVerification(user);

    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
    };
  }
};

// User login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
    };
  }
};

// User logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Password reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
    };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { success: true, profile: userDoc.data() };
    } else {
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Get profile error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    syncAuthUserToExtension(user);
    callback(user);
  });
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
