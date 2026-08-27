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
 *
 * Uses two channels:
 * 1) chrome.runtime.sendMessage(extensionId) when externally_connectable works
 * 2) window.postMessage picked up by the extension's jobna-bridge content script
 */
export const syncAuthUserToExtension = async (user) => {
  try {
    if (typeof window === "undefined") {
      return;
    }

    if (!user) {
      window.postMessage(
        { source: "jobna-web-app", action: "CLEAR_AUTH_USER" },
        window.location.origin
      );
      if (window.chrome?.runtime?.sendMessage) {
        window.chrome.runtime.sendMessage(
          EXTENSION_ID,
          { action: "CLEAR_AUTH_USER" },
          () => {
            void window.chrome.runtime.lastError;
          }
        );
      }
      return;
    }

    let idToken = null;
    try {
      idToken = await user.getIdToken(true);
    } catch (tokenError) {
      console.log("Could not refresh Firebase ID token:", tokenError.message);
    }

    const payload = {
      action: "SET_AUTH_USER",
      userId: user.uid,
      idToken,
    };

    // Backup channel: content script on this origin forwards to background
    window.postMessage(
      { source: "jobna-web-app", ...payload },
      window.location.origin
    );
    console.log(
      "Posted SET_AUTH_USER to page bridge for UID:",
      user.uid
    );

    if (!window.chrome?.runtime?.sendMessage) {
      console.log(
        "chrome.runtime.sendMessage unavailable; relying on Jobna page bridge content script."
      );
      return;
    }

    console.log(
      "Sending SET_AUTH_USER via chrome.runtime to extension",
      EXTENSION_ID
    );

    window.chrome.runtime.sendMessage(EXTENSION_ID, payload, (response) => {
      if (window.chrome.runtime.lastError) {
        console.log(
          "Chrome extension direct channel unavailable:",
          window.chrome.runtime.lastError.message
        );
        return;
      }

      if (response?.success) {
        console.log(
          "Extension authenticated successfully with UID:",
          user.uid
        );
      } else {
        console.log("Chrome extension responded without success:", response);
      }
    });
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
