const OpenAI = require("openai");

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional HR analyst. Provide concise, actionable feedback.",
        },
        {
          role: "user",
          content: `Analyze this job description and provide:
1. Required skills (max 8 skills)
2. Experience level required
3. Key responsibilities (max 5 points)
4. Qualifications needed (max 5 points)
5. Job summary (max 100 words)
Format as JSON with keys: requiredSkills, experienceLevel, responsibilities, qualifications, summary

Job Description:
${jdText}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      parsedResponse = {
        requiredSkills: [],
        experienceLevel: "Unknown",
        responsibilities: ["Analysis completed"],
        qualifications: ["Format could be improved"],
        summary: response,
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
