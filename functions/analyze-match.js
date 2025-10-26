console.log("🔧 MODULE LOADING: Starting analyze-match module...");

let genAI, geminiModel;

try {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  console.log("✅ GoogleGenerativeAI imported successfully");

  // Initialize Gemini AI model
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  console.log("✅ Gemini model initialized");
} catch (error) {
  console.error("❌ MODULE LOADING ERROR:", error);
  throw error;
}

exports.handler = async (event, context) => {
  console.log("🚀 ANALYZE-MATCH FUNCTION CALLED!");
  console.log("🔍 DEBUG: HTTP Method:", event.httpMethod);
  console.log("🔍 DEBUG: Event body:", event.body ? "Present" : "Missing");

  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    console.log("🔍 DEBUG: Parsing request body...");
    let cvText, jdText, userId;

    try {
      const parsedBody = JSON.parse(event.body);
      cvText = parsedBody.cvText;
      jdText = parsedBody.jdText;
      userId = parsedBody.userId;
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    console.log("🔍 DEBUG: Request data:", {
      cvTextLength: cvText?.length || 0,
      jdTextLength: jdText?.length || 0,
      userId: userId?.substring(0, 8) + "...",
    });

    if (!cvText || !jdText || !userId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Debug: Check if Gemini API key is available
    console.log(
      "🔍 DEBUG: GEMINI_API_KEY available:",
      !!process.env.GEMINI_API_KEY
    );
    console.log(
      "🔍 DEBUG: GEMINI_API_KEY length:",
      process.env.GEMINI_API_KEY?.length || 0
    );

    // AI-powered ATS analysis using Gemini
    console.log("🤖 Starting AI analysis with Gemini...");
    console.log("🔍 GEMINI ONLY MODE: Using pure Gemini API (no OpenAI)");
    console.log(
      "🔍 GEMINI_API_KEY status:",
      !!process.env.GEMINI_API_KEY ? "✅ Available" : "❌ Missing"
    );

    // TEST_MODE removed - always use real Gemini analysis

    // Perform comprehensive AI analysis with Gemini
    console.log("🚀 CALLING GEMINI API FOR REAL ANALYSIS...");
    const analysisResult = await performAIAnalysis(cvText, jdText);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: analysisResult,
        tokensUsed: 0,
      }),
    };
  } catch (error) {
    console.error("AI Analysis error:", error);

    // Provide more specific error messages
    let errorMessage = "Internal server error";
    let details = error.message;

    if (error.message.includes("API key") || !process.env.GEMINI_API_KEY) {
      errorMessage = "Gemini API key not configured. Please contact support.";
      details =
        "The GEMINI_API_KEY environment variable is missing or invalid.";
    } else if (
      error.message.includes("quota") ||
      error.message.includes("limit")
    ) {
      errorMessage = "API quota exceeded. Please try again later.";
      details = "The API service has reached its usage limit.";
    } else if (
      error.message.includes("network") ||
      error.message.includes("timeout")
    ) {
      errorMessage =
        "Network error. Please check your connection and try again.";
      details = "Unable to connect to the AI service.";
    }

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: errorMessage,
        details: details,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

// AI-powered analysis function using Gemini
async function performAIAnalysis(cvText, jdText) {
  console.log("🤖 Starting AI analysis with Gemini...");

  // CRITICAL: Check API key before attempting any analysis
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing!");
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please configure it in Netlify environment variables."
    );
  }

  console.log(
    "✅ GEMINI_API_KEY found, length:",
    process.env.GEMINI_API_KEY.length
  );
  console.log(
    "✅ GEMINI_API_KEY starts with:",
    process.env.GEMINI_API_KEY.substring(0, 4)
  );

  // Validate API key format
  if (!process.env.GEMINI_API_KEY.startsWith("AIza")) {
    console.error("❌ Invalid GEMINI_API_KEY format!");
    throw new Error(
      "GEMINI_API_KEY does not have valid format. It should start with 'AIza'."
    );
  }

  try {
    // Comprehensive keyword analysis
    const keywordPrompt = `Extract and compare ALL relevant technical and professional keywords from both the CV and Job Description. Be comprehensive - include all important terms, skills, technologies, and qualifications. There are NO limits on the number of keywords.

CV: ${cvText}
Job Description: ${jdText}

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON. Start with { and end with }.

{
  "jobKeywords": ["keyword1", "keyword2", "keyword3", "..."],
  "cvKeywords": ["keyword1", "keyword2", "keyword3", "..."],
  "matchedKeywords": ["keyword1", "keyword2", "..."],
  "missingKeywords": ["keyword1", "keyword2", "..."],
  "matchPercentage": 75
}`;

    console.log("📝 Analyzing keywords...");
    let keywordText;
    try {
      const keywordResult = await geminiModel.generateContent(keywordPrompt);
      const keywordResponse = await keywordResult.response;
      keywordText = keywordResponse.text();
      console.log(
        "🔍 DEBUG: Keyword analysis response length:",
        keywordText?.length || 0
      );
    } catch (error) {
      console.error("❌ Keyword analysis failed:", error);
      throw error;
    }

    // Experience analysis
    const experiencePrompt = `Analyze the experience match between this CV and job description. Be very specific and detailed.

CV: ${cvText}
Job Description: ${jdText}

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON. Start with { and end with }.

{
  "experienceAnalysis": {
    "score": 85,
    "yearsRequired": 5,
    "yearsFound": 8,
    "quality": "Excellent match with relevant experience",
    "relevance": "Highly relevant experience in the same field",
    "specificMismatches": [
      {
        "jobRequirement": "Specific requirement",
        "cvInformation": "What CV shows",
        "match": "Match assessment"
      }
    ],
    "overallAssessment": "Detailed assessment of experience match"
  }
}`;

    console.log("🧠 Analyzing experience...");
    let experienceText;
    try {
      const experienceResult = await geminiModel.generateContent(
        experiencePrompt
      );
      const experienceResponse = await experienceResult.response;
      experienceText = experienceResponse.text();
      console.log(
        "🔍 DEBUG: Experience analysis response length:",
        experienceText?.length || 0
      );
    } catch (error) {
      console.error("❌ Experience analysis failed:", error);
      throw error;
    }

    // Content quality analysis
    const contentPrompt = `Assess the CV content quality. Be very specific about what you find.

CV: ${cvText}

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON. Start with { and end with }.

{
  "contentQuality": {
    "score": 78,
    "achievements": "Assessment of quantified achievements",
    "actionVerbs": "Assessment of action verb usage",
    "professionalTone": "Assessment of professional language",
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "geminiAnalysis": "This analysis was performed by AI"
  }
}`;

    console.log("📊 Analyzing content quality...");
    let contentText;
    try {
      const contentResult = await geminiModel.generateContent(contentPrompt);
      const contentResponse = await contentResult.response;
      contentText = contentResponse.text();
      console.log(
        "🔍 DEBUG: Content quality analysis response length:",
        contentText?.length || 0
      );
    } catch (error) {
      console.error("❌ Content quality analysis failed:", error);
      throw error;
    }

    // Parse responses with robust JSON extraction
    const parseJsonResponse = (text, fallback = {}) => {
      try {
        // Method 1: Direct JSON object
        const directMatch = text.match(/\{[\s\S]*?\}/);
        if (directMatch) {
          return JSON.parse(directMatch[0]);
        }

        // Method 2: JSON between code blocks
        const codeBlockMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          return JSON.parse(codeBlockMatch[1]);
        }

        // Method 3: Look for specific field patterns
        const fieldMatch = text.match(
          /\{[\s\S]*"(jobKeywords|cvKeywords|experienceAnalysis|contentQuality)"[\s\S]*?\}/
        );
        if (fieldMatch) {
          return JSON.parse(fieldMatch[0]);
        }

        return fallback;
      } catch (e) {
        console.error("JSON parsing failed:", e);
        return fallback;
      }
    };

    console.log("🔍 DEBUG: Parsing keyword analysis...");
    const keywordAnalysis = parseJsonResponse(keywordText, {
      jobKeywords: [],
      cvKeywords: [],
      matchedKeywords: [],
      missingKeywords: [],
      matchPercentage: 0,
    });
    console.log("🔍 DEBUG: Keyword analysis parsed:", {
      matchPercentage: keywordAnalysis.matchPercentage,
      matchedCount: keywordAnalysis.matchedKeywords?.length || 0,
      totalCount: keywordAnalysis.jobKeywords?.length || 0,
    });

    const experienceAnalysis = parseJsonResponse(experienceText, {
      experienceAnalysis: {
        score: 0,
        yearsRequired: 0,
        yearsFound: 0,
        quality: "Analysis failed",
        relevance: "Analysis failed",
        specificMismatches: [],
        overallAssessment: "Analysis failed",
      },
    });

    const contentQualityAnalysis = parseJsonResponse(contentText, {
      contentQuality: {
        score: 0,
        achievements: "Analysis failed",
        actionVerbs: "Analysis failed",
        professionalTone: "Analysis failed",
        suggestions: [],
        geminiAnalysis: "Analysis failed",
      },
    });

    // Calculate overall score
    const scores = [
      keywordAnalysis.matchPercentage || 0,
      experienceAnalysis.experienceAnalysis?.score || 0,
      contentQualityAnalysis.contentQuality?.score || 0,
    ].filter((score) => score > 0);

    const overallScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    // Determine grade
    let grade = "F";
    if (overallScore >= 90) grade = "A+";
    else if (overallScore >= 85) grade = "A";
    else if (overallScore >= 80) grade = "A-";
    else if (overallScore >= 75) grade = "B+";
    else if (overallScore >= 70) grade = "B";
    else if (overallScore >= 65) grade = "B-";
    else if (overallScore >= 60) grade = "C+";
    else if (overallScore >= 55) grade = "C";
    else if (overallScore >= 50) grade = "C-";
    else if (overallScore >= 45) grade = "D+";
    else if (overallScore >= 40) grade = "D";
    else if (overallScore >= 35) grade = "D-";

    // Generate recommendations with proper structure
    const recommendations = [];
    if (keywordAnalysis.matchPercentage < 70) {
      recommendations.push({
        type: "important",
        title: "Improve Keyword Matching",
        description:
          "Include more relevant keywords from the job description to increase your ATS compatibility score.",
        impact: "High",
      });
    }
    if (experienceAnalysis.experienceAnalysis?.score < 70) {
      recommendations.push({
        type: "critical",
        title: "Address Experience Gaps",
        description:
          "Highlight more relevant experience or address missing requirements to better match the job description.",
        impact: "High",
      });
    }
    if (contentQualityAnalysis.contentQuality?.score < 70) {
      recommendations.push({
        type: "important",
        title: "Enhance Content Quality",
        description:
          "Improve content quality with quantified achievements and strong action verbs to make your CV more compelling.",
        impact: "Medium",
      });
    }

    // Add Gemini-specific recommendations if available
    if (
      contentQualityAnalysis.contentQuality?.suggestions &&
      contentQualityAnalysis.contentQuality.suggestions.length > 0
    ) {
      contentQualityAnalysis.contentQuality.suggestions.forEach(
        (suggestion, index) => {
          recommendations.push({
            type: "important",
            title: `Content Improvement ${index + 1}`,
            description: suggestion,
            impact: "Medium",
          });
        }
      );
    }

    const analysis = {
      matchScore: overallScore,
      skillsMatch: keywordAnalysis.matchedKeywords || [],
      missingSkills: keywordAnalysis.missingKeywords || [],
      recommendations: recommendations,
      assessment: `Your CV scored ${overallScore}% (Grade: ${grade}) for ATS compatibility. ${
        overallScore >= 80
          ? "Excellent! Your CV is well-optimized for ATS systems."
          : overallScore >= 60
          ? "Good, but there's room for improvement."
          : "Your CV needs significant improvements for better ATS compatibility."
      }`,
      keywordAnalysis: {
        score: keywordAnalysis.matchPercentage || 0,
        found: keywordAnalysis.matchedKeywords?.length || 0,
        total: keywordAnalysis.jobKeywords?.length || 0,
        matches: keywordAnalysis.matchedKeywords || [],
        description: `${keywordAnalysis.matchedKeywords?.length || 0} out of ${
          keywordAnalysis.jobKeywords?.length || 0
        } keywords found`,
      },
      experienceAnalysis: experienceAnalysis.experienceAnalysis || {},
      contentQualityAnalysis: contentQualityAnalysis.contentQuality || {},
      atsAnalysis: {
        overallScore,
        grade,
        breakdown: {
          keywordMatch: {
            score: keywordAnalysis.matchPercentage || 0,
            matched: keywordAnalysis.matchedKeywords?.length || 0,
            total: keywordAnalysis.jobKeywords?.length || 0,
          },
          experienceMatch: {
            score: experienceAnalysis.experienceAnalysis?.score || 0,
            yearsRequired:
              experienceAnalysis.experienceAnalysis?.yearsRequired || 0,
            yearsFound: experienceAnalysis.experienceAnalysis?.yearsFound || 0,
          },
          contentQuality: {
            score: contentQualityAnalysis.contentQuality?.score || 0,
          },
        },
        recommendations,
      },
      modelUsed: "Gemini 2.0 Flash (Pure Gemini - No OpenAI)",
      analysisTimestamp: new Date().toISOString(),
    };

    console.log("✅ GEMINI AI analysis completed successfully");
    console.log("🎯 CONFIRMED: Used pure Gemini API (no OpenAI fallback)");
    console.log("🔍 DEBUG: Final analysis result:", {
      matchScore: analysis.matchScore,
      skillsMatchCount: analysis.skillsMatch?.length || 0,
      missingSkillsCount: analysis.missingSkills?.length || 0,
      recommendationsCount: analysis.recommendations?.length || 0,
      atsScore: analysis.atsAnalysis?.overallScore || 0,
    });
    return analysis;
  } catch (error) {
    console.error("AI analysis error:", error);

    // Provide more specific error information
    let errorType = "unknown";
    let errorMessage = "Analysis failed - please try again";

    if (error.message.includes("API key") || !process.env.GEMINI_API_KEY) {
      errorType = "configuration";
      errorMessage =
        "Gemini API key not configured. Please contact support to resolve this issue.";
    } else if (
      error.message.includes("quota") ||
      error.message.includes("limit")
    ) {
      errorType = "quota";
      errorMessage =
        "API quota exceeded. Please try again later or contact support.";
    } else if (
      error.message.includes("network") ||
      error.message.includes("timeout")
    ) {
      errorType = "network";
      errorMessage =
        "Network error occurred. Please check your connection and try again.";
    }

    return {
      matchScore: 0,
      skillsMatch: [],
      missingSkills: [],
      recommendations: [errorMessage],
      assessment: `AI analysis encountered an error (${errorType}). ${errorMessage}`,
      keywordAnalysis: {
        score: 0,
        found: 0,
        total: 0,
        matches: [],
        description: `Analysis failed: ${errorType}`,
      },
      experienceAnalysis: {
        score: 0,
        yearsRequired: 0,
        yearsFound: 0,
        quality: `Analysis failed: ${errorType}`,
      },
      contentQualityAnalysis: {
        score: 0,
        achievements: `Analysis failed: ${errorType}`,
        actionVerbs: `Analysis failed: ${errorType}`,
        professionalTone: `Analysis failed: ${errorType}`,
        suggestions: [],
      },
      atsAnalysis: {
        overallScore: 0,
        grade: "F",
        breakdown: {
          keywordMatch: { score: 0, matched: 0, total: 0 },
          experienceMatch: { score: 0, yearsRequired: 0, yearsFound: 0 },
          contentQuality: { score: 0 },
        },
        recommendations: [
          {
            type: "critical",
            title: "Analysis Failed",
            description: errorMessage,
            impact: "High",
            errorType: errorType,
          },
        ],
      },
      modelUsed: "Gemini AI (Failed)",
      analysisTimestamp: new Date().toISOString(),
      error: error.message,
      errorType: errorType,
    };
  }
}
