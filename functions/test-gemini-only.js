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

    // Test 1: Keyword extraction from both CV and Job Description
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

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON. Start with { and end with }.

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

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON. Start with { and end with }.

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
      // Try multiple methods for keyword JSON parsing
      let keywordJson = null;

      // Method 1: Direct JSON object
      const keywordMatch = keywordText.match(/\{[\s\S]*?\}/);
      if (keywordMatch) {
        try {
          keywordJson = JSON.parse(keywordMatch[0]);
        } catch (e) {
          console.log("Keyword Method 1 failed, trying method 2...");
        }
      }

      // Method 2: JSON between code blocks
      if (!keywordJson) {
        const codeBlockMatch = keywordText.match(
          /```json\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            keywordJson = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.log("Keyword Method 2 failed, using raw response...");
          }
        }
      }

      keywordAnalysis = keywordJson || {
        error: "Failed to parse keyword analysis",
        rawResponse: keywordText.substring(0, 500) + "...",
      };
    } catch (e) {
      keywordAnalysis = {
        error: "Failed to parse keyword analysis",
        rawResponse: keywordText.substring(0, 500) + "...",
      };
    }

    try {
      // Try multiple JSON extraction methods
      let experienceJson = null;

      // Method 1: Look for JSON object
      const experienceMatch = experienceText.match(/\{[\s\S]*?\}/);
      if (experienceMatch) {
        try {
          experienceJson = JSON.parse(experienceMatch[0]);
        } catch (e) {
          console.log("Method 1 failed, trying method 2...");
        }
      }

      // Method 2: Look for JSON between code blocks
      if (!experienceJson) {
        const codeBlockMatch = experienceText.match(
          /```json\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            experienceJson = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.log("Method 2 failed, trying method 3...");
          }
        }
      }

      // Method 3: Look for any JSON-like structure
      if (!experienceJson) {
        const anyJsonMatch = experienceText.match(
          /\{[\s\S]*"experienceAnalysis"[\s\S]*?\}/
        );
        if (anyJsonMatch) {
          try {
            experienceJson = JSON.parse(anyJsonMatch[0]);
          } catch (e) {
            console.log("Method 3 failed, using raw response...");
          }
        }
      }

      experienceAnalysis = experienceJson || {
        error: "Failed to parse experience analysis",
        rawResponse: experienceText.substring(0, 500) + "...",
      };
    } catch (e) {
      experienceAnalysis = {
        error: "Failed to parse experience analysis",
        rawResponse: experienceText.substring(0, 500) + "...",
      };
    }

    try {
      // Try multiple JSON extraction methods for content
      let contentJson = null;

      // Method 1: Look for JSON object
      const contentMatch = contentText.match(/\{[\s\S]*?\}/);
      if (contentMatch) {
        try {
          contentJson = JSON.parse(contentMatch[0]);
        } catch (e) {
          console.log("Content Method 1 failed, trying method 2...");
        }
      }

      // Method 2: Look for JSON between code blocks
      if (!contentJson) {
        const codeBlockMatch = contentText.match(
          /```json\s*(\{[\s\S]*?\})\s*```/
        );
        if (codeBlockMatch) {
          try {
            contentJson = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.log("Content Method 2 failed, trying method 3...");
          }
        }
      }

      // Method 3: Look for any JSON-like structure
      if (!contentJson) {
        const anyJsonMatch = contentText.match(
          /\{[\s\S]*"contentQuality"[\s\S]*?\}/
        );
        if (anyJsonMatch) {
          try {
            contentJson = JSON.parse(anyJsonMatch[0]);
          } catch (e) {
            console.log("Content Method 3 failed, using raw response...");
          }
        }
      }

      contentAnalysis = contentJson || {
        error: "Failed to parse content analysis",
        rawResponse: contentText.substring(0, 500) + "...",
      };
    } catch (e) {
      contentAnalysis = {
        error: "Failed to parse content analysis",
        rawResponse: contentText.substring(0, 500) + "...",
      };
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
