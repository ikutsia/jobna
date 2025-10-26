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
    console.log("🧪 Testing ATS Analysis setup...");

    // Check environment variables
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    console.log("🔍 Environment Variables Check:");
    console.log(
      "  - GEMINI_API_KEY:",
      hasGeminiKey ? "✅ Available" : "❌ Missing"
    );
    console.log(
      "  - OPENAI_API_KEY:",
      hasOpenAIKey ? "✅ Available" : "❌ Missing"
    );

    if (!hasGeminiKey) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          message: "ATS Analysis Test Results",
          issues: [
            {
              type: "configuration",
              message: "GEMINI_API_KEY is missing",
              solution:
                "Add GEMINI_API_KEY to your Netlify environment variables",
              impact: "High - This will cause ATS analysis to fail",
            },
          ],
          environment: {
            GEMINI_API_KEY: "Missing",
            OPENAI_API_KEY: hasOpenAIKey ? "Available" : "Missing",
          },
          nextSteps: [
            "1. Get a Gemini API key from Google AI Studio",
            "2. Add GEMINI_API_KEY to your Netlify environment variables",
            "3. Redeploy your site",
            "4. Test the analysis again",
          ],
        }),
      };
    }

    // Test Gemini API connection
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const geminiModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const testPrompt =
        "Say 'Gemini API is working!' and return only that message.";
      const result = await geminiModel.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();

      console.log("✅ Gemini API test successful!");

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          message: "ATS Analysis Test Results",
          status: "All systems operational",
          tests: {
            environmentVariables:
              "✅ All required environment variables are set",
            geminiAPI: "✅ Gemini API connection successful",
            analysisFunction: "✅ Ready to perform ATS analysis",
          },
          environment: {
            GEMINI_API_KEY: "Available",
            OPENAI_API_KEY: hasOpenAIKey ? "Available" : "Missing",
          },
          geminiResponse: text.trim(),
        }),
      };
    } catch (geminiError) {
      console.error("❌ Gemini API test failed:", geminiError);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          message: "ATS Analysis Test Results",
          status: "Gemini API connection failed",
          issues: [
            {
              type: "api_error",
              message: "Gemini API connection failed",
              details: geminiError.message,
              solution: "Check your GEMINI_API_KEY and try again",
              impact: "High - This will cause ATS analysis to fail",
            },
          ],
          environment: {
            GEMINI_API_KEY: "Available but invalid",
            OPENAI_API_KEY: hasOpenAIKey ? "Available" : "Missing",
          },
          nextSteps: [
            "1. Verify your GEMINI_API_KEY is correct",
            "2. Check if you have sufficient quota",
            "3. Try generating a new API key",
            "4. Test the analysis again",
          ],
        }),
      };
    }
  } catch (error) {
    console.error("❌ Test function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        message: "Test function encountered an error",
        error: error.message,
      }),
    };
  }
};
