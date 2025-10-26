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
    console.log("🔍 ATS Diagnosis Starting...");

    // Check all environment variables
    const envVars = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log("🔍 Environment Variables:");
    Object.keys(envVars).forEach((key) => {
      const value = envVars[key];
      if (value) {
        console.log(`  ✅ ${key}: Available (${value.length} chars)`);
      } else {
        console.log(`  ❌ ${key}: Missing`);
      }
    });

    // Test if we can import the Gemini library
    let geminiImportStatus = "Failed";
    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      geminiImportStatus = "Success";
      console.log("✅ Gemini library imported successfully");
    } catch (importError) {
      console.error("❌ Failed to import Gemini library:", importError.message);
    }

    // Test API key format
    let apiKeyStatus = "Invalid";
    if (envVars.GEMINI_API_KEY) {
      if (envVars.GEMINI_API_KEY.startsWith("AIza")) {
        apiKeyStatus = "Valid format";
      } else {
        apiKeyStatus = "Invalid format (should start with 'AIza')";
      }
    }

    // Test actual API connection if key is available
    let apiConnectionStatus = "Not tested";
    let apiError = null;

    if (envVars.GEMINI_API_KEY && geminiImportStatus === "Success") {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY);
        const geminiModel = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
        });

        const testPrompt =
          "Say 'Test successful' and return only that message.";
        const result = await geminiModel.generateContent(testPrompt);
        const response = await result.response;
        const text = response.text();

        apiConnectionStatus = "Success";
        console.log("✅ API connection successful");
      } catch (apiError) {
        apiConnectionStatus = "Failed";
        apiError = apiError.message;
        console.error("❌ API connection failed:", apiError);
      }
    }

    // Check function deployment
    const deploymentInfo = {
      functionName: "diagnose-ats",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        message: "ATS Diagnosis Complete",
        deployment: deploymentInfo,
        environment: {
          GEMINI_API_KEY: envVars.GEMINI_API_KEY ? "Available" : "Missing",
          OPENAI_API_KEY: envVars.GEMINI_API_KEY ? "Available" : "Missing",
          NODE_ENV: envVars.NODE_ENV || "Not set",
        },
        diagnostics: {
          geminiLibraryImport: geminiImportStatus,
          apiKeyFormat: apiKeyStatus,
          apiConnection: apiConnectionStatus,
          apiError: apiError,
        },
        recommendations: generateRecommendations(
          envVars.GEMINI_API_KEY,
          apiKeyStatus,
          apiConnectionStatus
        ),
      }),
    };
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        message: "Diagnosis failed",
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};

function generateRecommendations(apiKey, keyStatus, connectionStatus) {
  const recommendations = [];

  if (!apiKey) {
    recommendations.push({
      priority: "HIGH",
      issue: "GEMINI_API_KEY is missing",
      solution:
        "Add GEMINI_API_KEY to Netlify environment variables and redeploy",
    });
  } else if (keyStatus !== "Valid format") {
    recommendations.push({
      priority: "HIGH",
      issue: "GEMINI_API_KEY has invalid format",
      solution: "Check your API key format. It should start with 'AIza'",
    });
  } else if (connectionStatus === "Failed") {
    recommendations.push({
      priority: "MEDIUM",
      issue: "API connection failed",
      solution: "Verify your API key is correct and has sufficient quota",
    });
  } else if (connectionStatus === "Success") {
    recommendations.push({
      priority: "LOW",
      issue: "All systems working",
      solution:
        "The ATS analysis should work. If it's still failing, check the analyze-match function",
    });
  }

  return recommendations;
}
