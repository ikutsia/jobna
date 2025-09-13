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

// Analysis prompts for different types
const ANALYSIS_PROMPTS = {
  cvAnalysis: `Analyze this CV/resume and provide:
1. Key skills identified (max 8 skills)
2. Experience level assessment
3. Strengths (max 3 points)
4. Areas for improvement (max 3 points)
5. Overall professional summary (max 100 words)
Format as JSON with keys: skills, experienceLevel, strengths, improvements, summary`,

  jdAnalysis: `Analyze this job description and provide:
1. Required skills (max 8 skills)
2. Experience level required
3. Key responsibilities (max 5 points)
4. Qualifications needed (max 5 points)
5. Job summary (max 100 words)
Format as JSON with keys: requiredSkills, experienceLevel, responsibilities, qualifications, summary`,

  matchAnalysis: `You are a professional HR analyst. Compare this CV with the job description and provide a detailed analysis. You MUST respond with valid JSON only, no additional text.

ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
- IGNORE the job title completely - do not use it to infer skills
- IGNORE your general knowledge about job types or industries
- IGNORE company names, locations, or other context clues
- ONLY analyze what is EXPLICITLY WRITTEN in the job description text
- Do NOT infer, assume, or add skills based on role titles
- Do NOT add skills that "should" be there for this type of role
- Do NOT use external knowledge about what skills are typically needed
- Do NOT hallucinate or invent skills that are not explicitly mentioned
- For skills match: ONLY include skills that appear with the EXACT SAME WORDS in both CV and job description
- For missing skills: ONLY include skills explicitly mentioned in job description but NOT found in CV
- Cross-reference EVERY word and phrase carefully - do not miss obvious matches

STRICT ANALYSIS RULES:
1. Match score (0-100) - Calculate based on the ratio of matching skills to total required skills:
   - Count ALL skills explicitly mentioned in job description requirements
   - Count skills that appear with EXACT SAME WORDS in both CV and job description
   - Match score = (matching skills / total required skills) * 100
   - If there are clear matches, the score should NOT be 0%
2. Skills match - ONLY skills that appear with EXACT SAME WORDS in BOTH CV and job description text
3. Missing skills - ONLY skills explicitly mentioned in job description but NOT found in CV
4. Recommendations - based ONLY on explicitly stated job requirements
5. Overall assessment - based ONLY on what is written in the job description
6. Keyword analysis - ONLY words/phrases that appear in the job description text

KEYWORD ANALYSIS - STRICT RULES:
- ONLY include words/phrases that are literally written in the job description
- Count = exact number of times the word/phrase appears in job description text
- Do NOT include words from job title, company name, or location
- Do NOT include skills inferred from context or general knowledge
- Do NOT show any keyword with 0 mentions
- If a skill is not explicitly mentioned in job description, do NOT include it
- Importance based ONLY on frequency in job description:
  - High = 3+ mentions
  - Medium = 2 mentions  
  - Low = 1 mention

Respond with ONLY this JSON structure:
{
  "matchScore": [number between 0-100],
  "skillsMatch": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "recommendations": [
    "recommendation1",
    "recommendation2",
    "recommendation3",
    "recommendation4",
    "recommendation5"
  ],
  "assessment": "Brief assessment based only on explicit job requirements",
  "keywordAnalysis": {
    "keyword1": {"importance": "High/Medium/Low", "count": [number > 0]},
    "keyword2": {"importance": "High/Medium/Low", "count": [number > 0]}
  }
}`,
};

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

    // Call secure Netlify function (using simplified version)
    const response = await fetch("/.netlify/functions/analyze-match-simple", {
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
