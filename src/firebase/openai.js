import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./config";

// Note: OpenAI API calls now go through secure Netlify functions
// API key is no longer exposed in the browser

// Free tier limits
const FREE_TIER_LIMITS = {
  monthlyCalls: 50, // Conservative limit to stay within $5/month
  maxTokensPerCall: 1000, // Limit token usage per analysis
  costPer1kTokens: 0.002, // GPT-3.5-turbo pricing
};

// Analysis prompts are now handled by Netlify functions

// Check user's monthly usage
export const checkUserUsage = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      if (userData.apiUsage && userData.apiUsage[currentMonth]) {
        return userData.apiUsage[currentMonth];
      }
    }
    return 0;
  } catch (error) {
    console.error("Error checking user usage:", error);
    return 0;
  }
};

// Update user's monthly usage
export const updateUserUsage = async (userId, tokensUsed) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      [`apiUsage.${currentMonth}`]: increment(1),
      [`apiUsage.${currentMonth}Tokens`]: increment(tokensUsed || 0),
      lastApiCall: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating user usage:", error);
  }
};

// Analyze CV using secure Netlify function
export const analyzeCV = async (cvText, userId) => {
  try {
    // Check usage limits
    const currentUsage = await checkUserUsage(userId);
    if (currentUsage >= FREE_TIER_LIMITS.monthlyCalls) {
      throw new Error(
        "Monthly API call limit reached. Please upgrade or wait until next month."
      );
    }

    // Call secure Netlify function
    const response = await fetch("/.netlify/functions/analyze-cv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvText,
        userId,
      }),
    });

    // Check if the response is ok before parsing JSON
    if (!response.ok) {
      throw new Error(
        `Function call failed with status: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Analysis failed");
    }

    // Update usage
    await updateUserUsage(userId, result.tokensUsed);

    return result.data;
  } catch (error) {
    console.error("CV Analysis error:", error);
    throw error;
  }
};

// Analyze Job Description using secure Netlify function
export const analyzeJD = async (jdText, userId) => {
  try {
    // Check usage limits
    const currentUsage = await checkUserUsage(userId);
    if (currentUsage >= FREE_TIER_LIMITS.monthlyCalls) {
      throw new Error(
        "Monthly API call limit reached. Please upgrade or wait until next month."
      );
    }

    // Call secure Netlify function
    const response = await fetch("/.netlify/functions/analyze-jd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jdText,
        userId,
      }),
    });

    // Check if the response is ok before parsing JSON
    if (!response.ok) {
      throw new Error(
        `Function call failed with status: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Analysis failed");
    }

    // Update usage
    await updateUserUsage(userId, result.tokensUsed);

    return result.data;
  } catch (error) {
    console.error("JD Analysis error:", error);
    throw error;
  }
};

// Analyze CV-JD match using secure Netlify function
export const analyzeMatch = async (cvText, jdText, userId) => {
  try {
    // Check usage limits
    const currentUsage = await checkUserUsage(userId);
    if (currentUsage >= FREE_TIER_LIMITS.monthlyCalls) {
      throw new Error(
        "Monthly API call limit reached. Please upgrade or wait until next month."
      );
    }

    // Call secure Netlify function
    const response = await fetch("/.netlify/functions/analyze-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvText,
        jdText,
        userId,
      }),
    });

    // Check if the response is ok before parsing JSON
    if (!response.ok) {
      throw new Error(
        `Function call failed with status: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Analysis failed");
    }

    // Update usage
    await updateUserUsage(userId, result.tokensUsed);

    return result.data;
  } catch (error) {
    console.error("Match Analysis error:", error);
    throw error;
  }
};

// Get user's remaining API calls for the month
export const getRemainingCalls = async (userId) => {
  const currentUsage = await checkUserUsage(userId);
  return Math.max(0, FREE_TIER_LIMITS.monthlyCalls - currentUsage);
};

// Get cost estimate for user
export const getCostEstimate = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (userData.apiUsage && userData.apiUsage[`${currentMonth}Tokens`]) {
        const tokensUsed = userData.apiUsage[`${currentMonth}Tokens`];
        const cost = (tokensUsed / 1000) * FREE_TIER_LIMITS.costPer1kTokens;
        return {
          tokensUsed,
          cost: cost.toFixed(4),
          remaining: (5 - cost).toFixed(4),
        };
      }
    }
    return { tokensUsed: 0, cost: "0.0000", remaining: "5.0000" };
  } catch (error) {
    console.error("Error getting cost estimate:", error);
    return { tokensUsed: 0, cost: "0.0000", remaining: "5.0000" };
  }
};
