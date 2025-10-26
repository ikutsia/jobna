// For LOCAL TESTING ONLY - Direct Gemini API calls from React
// DO NOT USE THIS IN PRODUCTION - API key will be exposed to browser

import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variable
const API_KEY =
  process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to list available models
export const listAvailableModels = async () => {
  try {
    const client = genAI;
    const models = await client.listModels();
    console.log("Available models:", models);
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
  }
};

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export const analyzeMatchLocal = async (cvText, jdText) => {
  try {
    console.log("🤖 Local Gemini Analysis (FOR TESTING ONLY)");

    if (!API_KEY) {
      throw new Error("Gemini API key not configured for local testing");
    }

    // List available models for debugging
    console.log("🔍 Available models:", model.model);

    // Simple analysis prompt
    const prompt = `Analyze the match between this CV and job description. Return ONLY valid JSON with this structure:
{
  "matchScore": 85,
  "skillsMatch": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "recommendations": ["rec1", "rec2"],
  "assessment": "Detailed assessment",
  "keywordAnalysis": {
    "score": 85,
    "found": 10,
    "total": 12,
    "matches": ["keyword1", "keyword2"],
    "description": "10 out of 12 keywords found"
  },
  "atsAnalysis": {
    "overallScore": 85,
    "grade": "B+",
    "breakdown": {
      "keywordMatch": {"score": 90},
      "experienceMatch": {"score": 85},
      "contentQuality": {"score": 80}
    },
    "recommendations": []
  }
}

CV: ${cvText}
Job Description: ${jdText}`;

    console.log("📝 Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Received response from Gemini");

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } else {
      throw new Error("No valid JSON in Gemini response");
    }
  } catch (error) {
    console.error("Local Gemini analysis error:", error);
    throw error;
  }
};
