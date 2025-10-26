const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "",
    };
  }

  try {
    console.log("🧪 Testing Gemini API connection...");

    // Check if API key is available
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    console.log("🔍 DEBUG: GEMINI_API_KEY available:", hasApiKey);
    console.log(
      "🔍 DEBUG: GEMINI_API_KEY length:",
      process.env.GEMINI_API_KEY?.length || 0
    );

    if (!hasApiKey) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY not found in environment variables",
        }),
      };
    }

    // Initialize Gemini AI model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    // Test with a simple prompt
    const testPrompt =
      "Say 'Hello, Gemini API is working!' and return only that message.";

    console.log("🤖 Sending test request to Gemini...");
    const result = await geminiModel.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini API test successful!");
    console.log("🔍 DEBUG: Response:", text);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        message: "Gemini API is working!",
        response: text,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      }),
    };
  } catch (error) {
    console.error("❌ Gemini API test failed:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString(),
      }),
    };
  }
};
