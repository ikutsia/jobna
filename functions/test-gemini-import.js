exports.handler = async (event, context) => {
  console.log("🧪 GEMINI IMPORT TEST FUNCTION CALLED!");

  try {
    console.log("🔍 Testing Gemini import...");

    // Test if we can import the module
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    console.log("✅ GoogleGenerativeAI imported successfully");

    // Test if we can create an instance
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ GoogleGenerativeAI instance created");

    // Test if we can get a model
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Gemini model created");

    console.log(
      "🔍 DEBUG: GEMINI_API_KEY available:",
      !!process.env.GEMINI_API_KEY
    );
    console.log(
      "🔍 DEBUG: GEMINI_API_KEY length:",
      process.env.GEMINI_API_KEY?.length || 0
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        message: "Gemini import test successful!",
        apiKeyAvailable: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Gemini import test failed:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
