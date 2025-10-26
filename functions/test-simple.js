exports.handler = async (event, context) => {
  console.log("🧪 SIMPLE TEST FUNCTION CALLED!");

  try {
    console.log("🔍 Testing basic functionality...");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        message: "Simple test function is working!",
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Simple test failed:", error);

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

