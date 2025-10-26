const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  console.log("🧪 GEMINI DEBUG TEST STARTED");

  // Check environment variables
  console.log("🔍 Environment Variables Check:");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  console.log(
    "GEMINI_API_KEY length:",
    process.env.GEMINI_API_KEY?.length || 0
  );
  console.log(
    "GEMINI_API_KEY starts with:",
    process.env.GEMINI_API_KEY?.substring(0, 4) || "N/A"
  );

  if (!process.env.GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "GEMINI_API_KEY not found in environment variables",
        debug: {
          envKeys: Object.keys(process.env).filter(
            (key) => key.includes("GEMINI") || key.includes("OPENAI")
          ),
          nodeEnv: process.env.NODE_ENV,
        },
      }),
    };
  }

  try {
    // Test Gemini API connection
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(
      "Hello, this is a test. Respond with 'Gemini is working!'"
    );
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Gemini API is working!",
        response: text,
        debug: {
          apiKeyLength: process.env.GEMINI_API_KEY.length,
          apiKeyPrefix: process.env.GEMINI_API_KEY.substring(0, 4),
          model: "gemini-2.0-flash-exp",
        },
      }),
    };
  } catch (error) {
    console.error("Gemini test error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Gemini API test failed",
        details: error.message,
        debug: {
          apiKeyExists: !!process.env.GEMINI_API_KEY,
          apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        },
      }),
    };
  }
};
