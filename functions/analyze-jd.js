const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Handle CORS preflight
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

  try {
    const { jdText, userId } = JSON.parse(event.body);

    if (!jdText || !userId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    console.log("🤖 Starting JD analysis with Gemini...");
    console.log(
      "🔍 DEBUG: GEMINI_API_KEY available:",
      !!process.env.GEMINI_API_KEY
    );

    const prompt = `Analyze this job description and provide:
1. Required skills (max 8 skills)
2. Experience level required
3. Key responsibilities (max 5 points)
4. Qualifications needed (max 5 points)
5. Job summary (max 100 words)
Format as JSON with keys: requiredSkills, experienceLevel, responsibilities, qualifications, summary

Job Description:
${jdText}`;

    console.log("📝 Sending request to Gemini...");
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    console.log("🔍 DEBUG: Gemini response length:", responseText?.length || 0);
    const tokensUsed = 0; // Gemini doesn't provide token usage in the same way

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      parsedResponse = {
        requiredSkills: [],
        experienceLevel: "Unknown",
        responsibilities: ["Analysis completed"],
        qualifications: ["Format could be improved"],
        summary: responseText,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: parsedResponse,
        tokensUsed,
      }),
    };
  } catch (error) {
    console.error("JD Analysis error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
