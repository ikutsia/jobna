import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// User Profile Operations
export const createUserProfile = async (uid, userData) => {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Create profile error:", error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteUserProfile = async (uid) => {
  try {
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
  } catch (error) {
    console.error("Delete profile error:", error);
    return { success: false, error: error.message };
  }
};

// Job Application Operations (for future use)
export const saveJobApplication = async (uid, jobData) => {
  try {
    const docRef = await addDoc(collection(db, "jobApplications"), {
      userId: uid,
      ...jobData,
      createdAt: serverTimestamp(),
      status: "pending",
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Save job application error:", error);
    return { success: false, error: error.message };
  }
};

export const getUserJobApplications = async (uid) => {
  try {
    const q = query(
      collection(db, "jobApplications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const applications = [];

    querySnapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, data: applications };
  } catch (error) {
    console.error("Get job applications error:", error);
    return { success: false, error: error.message };
  }
};

// Resume Analysis Operations (for future use)
export const saveResumeAnalysis = async (uid, analysisData) => {
  try {
    const docRef = await addDoc(collection(db, "resumeAnalyses"), {
      userId: uid,
      ...analysisData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Save resume analysis error:", error);
    return { success: false, error: error.message };
  }
};

export const getUserResumeAnalyses = async (uid) => {
  try {
    const q = query(
      collection(db, "resumeAnalyses"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const analyses = [];

    querySnapshot.forEach((doc) => {
      analyses.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { success: true, data: analyses };
  } catch (error) {
    console.error("Get resume analyses error:", error);
    return { success: false, error: error.message };
  }
};

// Utility Functions
export const checkUserExists = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Check user exists error:", error);
    return false;
  }
};

export const getCollectionCount = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.size;
  } catch (error) {
    console.error("Get collection count error:", error);
    return 0;
  }
};
