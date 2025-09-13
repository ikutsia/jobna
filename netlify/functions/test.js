exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: true,
      message: "Netlify functions are working!",
      timestamp: new Date().toISOString(),
    }),
  };
};
