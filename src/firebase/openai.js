import OpenAI from "openai";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./config";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use backend proxy
});

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

  matchAnalysis: `Compare this CV with the job description and provide a detailed analysis. You MUST respond with valid JSON only, no additional text.

Analyze the following aspects:
1. Match score (0-100) - how well the CV matches the job requirements
2. Skills match - list of skills that appear in both CV and job description
3. Missing skills - list of skills mentioned in job description but not in CV
4. Recommendations - 5 specific, actionable suggestions to improve the CV
5. Overall assessment - brief summary of the match quality
6. Keyword analysis - analyze key terms and their importance/frequency

Respond with ONLY this JSON structure:
{
  "matchScore": 75,
  "skillsMatch": ["JavaScript", "React", "Git"],
  "missingSkills": ["Docker", "AWS"],
  "recommendations": [
    "Add Docker experience to your CV",
    "Include cloud platform experience",
    "Highlight project management skills",
    "Add specific metrics and achievements",
    "Include relevant certifications"
  ],
  "assessment": "Good technical skills match but missing some modern DevOps and cloud skills that are increasingly important for this role.",
  "keywordAnalysis": {
    "JavaScript": {"importance": "High", "count": 5},
    "React": {"importance": "High", "count": 4},
    "Docker": {"importance": "High", "count": 2},
    "AWS": {"importance": "Medium", "count": 2}
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

// Analyze CV using OpenAI
export const analyzeCV = async (cvText, userId) => {
  try {
    // Check usage limits
    const currentUsage = await checkUserUsage(userId);
    if (currentUsage >= FREE_TIER_LIMITS.monthlyCalls) {
      throw new Error(
        "Monthly API call limit reached. Please upgrade or wait until next month."
      );
    }

    // Truncate CV text to save tokens
    const truncatedCV = cvText.slice(0, 2000); // Limit to first 2000 characters

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional HR analyst. Provide concise, actionable feedback.",
        },
        {
          role: "user",
          content: `${ANALYSIS_PROMPTS.cvAnalysis}\n\nCV Content:\n${truncatedCV}`,
        },
      ],
      max_tokens: FREE_TIER_LIMITS.maxTokensPerCall,
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    // Update usage
    await updateUserUsage(userId, tokensUsed);

    // Parse JSON response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, return formatted text
      return {
        skills: [],
        experienceLevel: "Unknown",
        strengths: ["Analysis completed"],
        improvements: ["Format could be improved"],
        summary: response,
      };
    }
  } catch (error) {
    console.error("CV Analysis error:", error);
    throw error;
  }
};

// Analyze Job Description using OpenAI
export const analyzeJD = async (jdText, userId) => {
  try {
    // Check usage limits
    const currentUsage = await checkUserUsage(userId);
    if (currentUsage >= FREE_TIER_LIMITS.monthlyCalls) {
      throw new Error(
        "Monthly API call limit reached. Please upgrade or wait until next month."
      );
    }

    // Truncate JD text to save tokens
    const truncatedJD = jdText.slice(0, 2000);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional HR analyst. Provide concise, actionable feedback.",
        },
        {
          role: "user",
          content: `${ANALYSIS_PROMPTS.jdAnalysis}\n\nJob Description:\n${truncatedJD}`,
        },
      ],
      max_tokens: FREE_TIER_LIMITS.maxTokensPerCall,
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    // Update usage
    await updateUserUsage(userId, tokensUsed);

    // Parse JSON response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      return {
        requiredSkills: [],
        experienceLevel: "Unknown",
        responsibilities: ["Analysis completed"],
        qualifications: ["Format could be improved"],
        summary: response,
      };
    }
  } catch (error) {
    console.error("JD Analysis error:", error);
    throw error;
  }
};

// Analyze CV-JD match using OpenAI
export const analyzeMatch = async (cvText, jdText, userId) => {
  try {
    // Check usage limits
    const currentUsage = await checkUserUsage(userId);
    if (currentUsage >= FREE_TIER_LIMITS.monthlyCalls) {
      throw new Error(
        "Monthly API call limit reached. Please upgrade or wait until next month."
      );
    }

    // Truncate both texts to save tokens
    const truncatedCV = cvText.slice(0, 1000);
    const truncatedJD = jdText.slice(0, 1000);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional HR analyst. You MUST respond with ONLY valid JSON. No additional text, explanations, or formatting outside the JSON structure. The response must be parseable by JSON.parse().",
        },
        {
          role: "user",
          content: `${ANALYSIS_PROMPTS.matchAnalysis}\n\nCV Content:\n${truncatedCV}\n\nJob Description:\n${truncatedJD}`,
        },
      ],
      max_tokens: FREE_TIER_LIMITS.maxTokensPerCall,
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    // Log the raw response for debugging
    console.log("OpenAI Raw Response:", response);
    console.log("Response type:", typeof response);
    console.log("Response length:", response.length);

    // Update usage
    await updateUserUsage(userId, tokensUsed);

    // Parse JSON response
    try {
      const parsedResponse = JSON.parse(response);

      // Validate the response structure
      if (
        !parsedResponse.matchScore ||
        !parsedResponse.skillsMatch ||
        !parsedResponse.missingSkills ||
        !parsedResponse.recommendations ||
        !parsedResponse.keywordAnalysis
      ) {
        throw new Error("Invalid response structure from OpenAI");
      }

      return parsedResponse;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw OpenAI response:", response);

      // Try to extract useful information from the response even if it's not valid JSON
      let extractedData = {
        matchScore: 50,
        skillsMatch: [],
        missingSkills: [],
        recommendations: [],
        assessment:
          "Analysis completed but response format was unexpected. Please try again.",
        keywordAnalysis: {},
      };

      // Try to find a match score in the response
      const scoreMatch = response.match(/(\d+)%?/);
      if (scoreMatch) {
        extractedData.matchScore = parseInt(scoreMatch[1]);
      }

      // Try to find skills mentioned
      const skillsMatch = response.match(/skills?[:\s]+([^.]+)/i);
      if (skillsMatch) {
        extractedData.skillsMatch = [skillsMatch[1].trim()];
      }

      return extractedData;
    }
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
