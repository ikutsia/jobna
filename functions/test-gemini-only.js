const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini only
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
    const { cvText, jdText } = JSON.parse(event.body);

    if (!cvText || !jdText) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing CV or JD text" }),
      };
    }

    console.log("🧪 TESTING: Gemini-only analysis...");
    console.log("🔑 Gemini API Key exists:", !!process.env.GEMINI_API_KEY);
    console.log(
      "🔑 API Key preview:",
      process.env.GEMINI_API_KEY?.substring(0, 10) + "..."
    );

    // Test 1: Simple keyword extraction with Gemini
    const keywordPrompt = `Extract exactly 10 technical and professional keywords from this job description. Return ONLY a JSON array:

Job Description: ${jdText}

Return format: ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"]`;

    console.log("📝 Testing keyword extraction...");
    const keywordResult = await geminiModel.generateContent(keywordPrompt);
    const keywordResponse = await keywordResult.response;
    const keywordText = keywordResponse.text();

    console.log(
      "📝 Gemini keyword response:",
      keywordText.substring(0, 200) + "..."
    );

    // Test 2: Experience analysis with Gemini
    const experiencePrompt = `Analyze the experience match between this CV and job description. Be very specific and detailed.

CV: ${cvText}
Job Description: ${jdText}

Provide analysis in this EXACT JSON format:
{
  "experienceAnalysis": {
    "score": 85,
    "yearsRequired": 5,
    "yearsFound": 8,
    "quality": "Excellent match with relevant experience",
    "relevance": "Highly relevant experience in the same field",
    "geminiAnalysis": "This is a Gemini-only analysis - you can tell because of this specific field"
  }
}`;

    console.log("🧠 Testing experience analysis...");
    const experienceResult = await geminiModel.generateContent(
      experiencePrompt
    );
    const experienceResponse = await experienceResult.response;
    const experienceText = experienceResponse.text();

    console.log(
      "🧠 Gemini experience response:",
      experienceText.substring(0, 200) + "..."
    );

    // Test 3: Content quality with Gemini
    const contentPrompt = `Assess the CV content quality. Be very specific about what you find.

CV: ${cvText}

Provide analysis in this EXACT JSON format:
{
  "contentQuality": {
    "score": 78,
    "achievements": "Found 3 quantified achievements",
    "actionVerbs": "Good use of action verbs like 'managed', 'led', 'implemented'",
    "professionalTone": "Professional and well-written",
    "suggestions": ["Add more numbers", "Include more technical skills"],
    "geminiAnalysis": "This analysis was done by Gemini 1.5-flash model"
  }
}`;

    console.log("📊 Testing content quality analysis...");
    const contentResult = await geminiModel.generateContent(contentPrompt);
    const contentResponse = await contentResult.response;
    const contentText = contentResponse.text();

    console.log(
      "📊 Gemini content response:",
      contentText.substring(0, 200) + "..."
    );

    // Parse responses
    let keywordAnalysis, experienceAnalysis, contentAnalysis;

    try {
      const keywordMatch = keywordText.match(/\[[\s\S]*?\]/);
      keywordAnalysis = keywordMatch ? JSON.parse(keywordMatch[0]) : [];
    } catch (e) {
      keywordAnalysis = ["Failed to parse keywords"];
    }

    try {
      const experienceMatch = experienceText.match(/\{[\s\S]*?\}/);
      experienceAnalysis = experienceMatch
        ? JSON.parse(experienceMatch[0])
        : {};
    } catch (e) {
      experienceAnalysis = { error: "Failed to parse experience analysis" };
    }

    try {
      const contentMatch = contentText.match(/\{[\s\S]*?\}/);
      contentAnalysis = contentMatch ? JSON.parse(contentMatch[0]) : {};
    } catch (e) {
      contentAnalysis = { error: "Failed to parse content analysis" };
    }

    const testResult = {
      success: true,
      modelUsed: "Gemini 1.5-flash ONLY (Test Mode)",
      timestamp: new Date().toISOString(),
      tests: {
        keywordExtraction: {
          result: keywordAnalysis,
          rawResponse: keywordText.substring(0, 300) + "...",
        },
        experienceAnalysis: {
          result: experienceAnalysis,
          rawResponse: experienceText.substring(0, 300) + "...",
        },
        contentQuality: {
          result: contentAnalysis,
          rawResponse: contentText.substring(0, 300) + "...",
        },
      },
      environment: {
        geminiApiKeyExists: !!process.env.GEMINI_API_KEY,
        apiKeyPreview: process.env.GEMINI_API_KEY?.substring(0, 10) + "...",
      },
    };

    console.log("✅ Gemini-only test completed successfully");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(testResult),
    };
  } catch (error) {
    console.error("❌ Gemini test error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        modelUsed: "Gemini 1.5-flash (Failed)",
        environment: {
          geminiApiKeyExists: !!process.env.GEMINI_API_KEY,
          apiKeyPreview: process.env.GEMINI_API_KEY?.substring(0, 10) + "...",
        },
      }),
    };
  }
};
