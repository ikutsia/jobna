exports.handler = async (event, context) => {
  console.log("🧪 TESTING ANALYZE-MATCH FUNCTION");

  // Test with simple data
  const testData = {
    cvText: "TEST_MODE - This is a test CV for debugging",
    jdText: "TEST_MODE - This is a test job description for debugging",
    userId: "test-user-123",
  };

  try {
    // Import and call the analyze-match function
    const analyzeMatch = require("./analyze-match");

    // Create a mock event
    const mockEvent = {
      httpMethod: "POST",
      body: JSON.stringify(testData),
    };

    const result = await analyzeMatch.handler(mockEvent, context);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Analyze-match function test completed",
        result: result,
        debug: {
          functionCalled: "analyze-match.js",
          testData: testData,
        },
      }),
    };
  } catch (error) {
    console.error("Test error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Test failed",
        details: error.message,
        stack: error.stack,
      }),
    };
  }
};
