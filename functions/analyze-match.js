const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.handler = async (event, context) => {
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
    const { cvText, jdText, userId } = JSON.parse(event.body);

    if (!cvText || !jdText || !userId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // AI-powered ATS analysis using Gemini
    console.log("🤖 Starting AI analysis with Gemini...");

    // Perform comprehensive AI analysis
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

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
};

// AI-powered analysis function using Gemini
async function performAIAnalysis(cvText, jdText) {
  console.log("🤖 Starting AI analysis with Gemini...");

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
    const keywordResult = await geminiModel.generateContent(keywordPrompt);
    const keywordResponse = await keywordResult.response;
    const keywordText = keywordResponse.text();

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
    const experienceResult = await geminiModel.generateContent(
      experiencePrompt
    );
    const experienceResponse = await experienceResult.response;
    const experienceText = experienceResponse.text();

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
    const contentResult = await geminiModel.generateContent(contentPrompt);
    const contentResponse = await contentResult.response;
    const contentText = contentResponse.text();

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

    const keywordAnalysis = parseJsonResponse(keywordText, {
      jobKeywords: [],
      cvKeywords: [],
      matchedKeywords: [],
      missingKeywords: [],
      matchPercentage: 0,
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

    // Generate recommendations
    const recommendations = [];
    if (keywordAnalysis.matchPercentage < 70) {
      recommendations.push(
        "Include more relevant keywords from the job description"
      );
    }
    if (experienceAnalysis.experienceAnalysis?.score < 70) {
      recommendations.push(
        "Highlight more relevant experience or address missing requirements"
      );
    }
    if (contentQualityAnalysis.contentQuality?.score < 70) {
      recommendations.push(
        "Improve content quality with quantified achievements and action verbs"
      );
    }

    const analysis = {
      matchScore: overallScore,
      skillsMatch: keywordAnalysis.matchedKeywords || [],
      missingSkills: keywordAnalysis.missingKeywords || [],
      recommendations: recommendations.concat(
        contentQualityAnalysis.contentQuality?.suggestions || []
      ),
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
      modelUsed: "AI Analysis",
      analysisTimestamp: new Date().toISOString(),
    };

    console.log("✅ AI analysis completed successfully");
    return analysis;
  } catch (error) {
    console.error("AI analysis error:", error);
    return {
      matchScore: 0,
      skillsMatch: [],
      missingSkills: [],
      recommendations: ["Analysis failed - please try again"],
      assessment: "AI analysis encountered an error. Please try again.",
      keywordAnalysis: {
        score: 0,
        found: 0,
        total: 0,
        matches: [],
        description: "Analysis failed",
      },
      experienceAnalysis: {
        score: 0,
        yearsRequired: 0,
        yearsFound: 0,
        quality: "Analysis failed",
      },
      contentQualityAnalysis: {
        score: 0,
        achievements: "Analysis failed",
        actionVerbs: "Analysis failed",
        professionalTone: "Analysis failed",
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
        recommendations: ["Analysis failed"],
      },
      modelUsed: "AI Analysis (Failed)",
      analysisTimestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}
