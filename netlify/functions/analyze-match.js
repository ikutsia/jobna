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
    const { cvText, jdText, userId } = JSON.parse(event.body);

    if (!cvText || !jdText || !userId) {
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
            "You are a professional HR analyst specializing in CV-job matching analysis. You MUST respond with ONLY valid JSON. No additional text, explanations, or formatting outside the JSON structure. The response must be parseable by JSON.parse().\n\nABSOLUTE REQUIREMENTS: IGNORE job titles, company names, and your general knowledge. ONLY analyze what is explicitly written in the job description text. Do NOT infer, assume, or add skills based on role titles or external knowledge. Focus strictly on literal text content only.",
        },
        {
          role: "user",
          content: `You are a professional HR analyst. Compare this CV with the job description and provide a detailed analysis. You MUST respond with valid JSON only, no additional text.

ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
- IGNORE the job title completely - do not use it to infer skills
- IGNORE your general knowledge about job types or industries
- IGNORE company names, locations, or other context clues
- ONLY analyze what is EXPLICITLY WRITTEN in the job description text
- Do NOT infer, assume, or add skills based on role titles
- Do NOT add skills that "should" be there for this type of role
- Do NOT use external knowledge about what skills are typically needed
- Do NOT hallucinate or invent skills that are not explicitly mentioned
- For skills match: ONLY include skills that appear with the EXACT SAME WORDS in both CV and job description
- For missing skills: ONLY include skills explicitly mentioned in job description but NOT found in CV
- Cross-reference EVERY word and phrase carefully - do not miss obvious matches

STRICT ANALYSIS RULES:
1. Match score (0-100) - Calculate based on the ratio of matching skills to total required skills:
   - Count ALL skills explicitly mentioned in job description requirements
   - Count skills that appear with EXACT SAME WORDS in both CV and job description
   - Match score = (matching skills / total required skills) * 100
   - If there are clear matches, the score should NOT be 0%
2. Skills match - ONLY skills that appear with EXACT SAME WORDS in BOTH CV and job description text
3. Missing skills - ONLY skills explicitly mentioned in job description but NOT found in CV
4. Recommendations - based ONLY on explicitly stated job requirements
5. Overall assessment - based ONLY on what is written in the job description
6. Keyword analysis - ONLY words/phrases that appear in the job description text

KEYWORD ANALYSIS - STRICT RULES:
- ONLY include words/phrases that are literally written in the job description
- Count = exact number of times the word/phrase appears in job description text
- Do NOT include words from job title, company name, or location
- Do NOT include skills inferred from context or general knowledge
- Do NOT show any keyword with 0 mentions
- If a skill is not explicitly mentioned in job description, do NOT include it
- Importance based ONLY on frequency in job description:
  - High = 3+ mentions
  - Medium = 2 mentions  
  - Low = 1 mention

Respond with ONLY this JSON structure:
{
  "matchScore": [number between 0-100],
  "skillsMatch": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "recommendations": [
    "recommendation1",
    "recommendation2",
    "recommendation3",
    "recommendation4",
    "recommendation5"
  ],
  "assessment": "Brief assessment based only on explicit job requirements",
  "keywordAnalysis": {
    "keyword1": {"importance": "High/Medium/Low", "count": [number > 0]},
    "keyword2": {"importance": "High/Medium/Low", "count": [number > 0]}
  }
}

CV Content:
${cvText}

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

      // Validate the response structure
      if (
        typeof parsedResponse.matchScore !== "number" ||
        !Array.isArray(parsedResponse.skillsMatch) ||
        !Array.isArray(parsedResponse.missingSkills) ||
        !Array.isArray(parsedResponse.recommendations) ||
        typeof parsedResponse.keywordAnalysis !== "object"
      ) {
        throw new Error("Invalid response structure from OpenAI");
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw OpenAI response:", response);

      // Try to extract useful information from the response even if it's not valid JSON
      parsedResponse = {
        matchScore: 50,
        skillsMatch: [],
        missingSkills: [],
        recommendations: [],
        assessment:
          "Analysis completed but response format was unexpected. Please try again.",
        keywordAnalysis: {},
      };

      // Try to find a match score in the response
      const scoreMatch = response.match(/(\d+)%?/);
      if (scoreMatch) {
        parsedResponse.matchScore = parseInt(scoreMatch[1]);
      }

      // Try to find skills mentioned
      const skillsMatch = response.match(/skills?[:\s]+([^.]+)/i);
      if (skillsMatch) {
        parsedResponse.skillsMatch = [skillsMatch[1].trim()];
      }
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
    console.error("Match Analysis error:", error);

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
