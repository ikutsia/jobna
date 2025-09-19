const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize AI models
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Task routing logic
const TASK_ROUTING = {
  // Simple tasks for GPT-3.5 (fast, cheap)
  SIMPLE: [
    "keyword_extraction",
    "basic_format_check",
    "contact_info_extraction",
    "section_identification",
  ],
  // Complex tasks for Gemini 1.5 (advanced reasoning)
  COMPLEX: [
    "semantic_analysis",
    "experience_evaluation",
    "content_quality_assessment",
    "education_matching",
    "overall_ats_score",
  ],
};

// GPT-3.5 for simple keyword extraction
async function extractKeywordsWithGPT(cvText, jdText) {
  const prompt = `Extract technical and professional keywords from this job description. Return only a JSON array of unique keywords:

Job Description: ${jdText}

Return format: ["keyword1", "keyword2", "keyword3"]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.1,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error("GPT keyword extraction error:", error);
    return [];
  }
}

// Gemini 1.5 for complex semantic analysis
async function analyzeSemanticMatchWithGemini(
  cvText,
  jdText,
  extractedKeywords
) {
  const prompt = `Analyze the semantic match between this CV and job description. Focus on understanding context, not just keyword matching.

CV: ${cvText}

Job Description: ${jdText}

Extracted Keywords: ${JSON.stringify(extractedKeywords)}

Provide a detailed analysis in JSON format:
{
  "semanticMatch": {
    "score": 0-100,
    "reasoning": "detailed explanation",
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"],
    "recommendations": ["rec1", "rec2"]
  },
  "experienceAnalysis": {
    "score": 0-100,
    "yearsRequired": number,
    "yearsFound": number,
    "quality": "assessment of experience quality"
  },
  "contentQuality": {
    "score": 0-100,
    "achievements": "assessment of quantified achievements",
    "actionVerbs": "assessment of action verb usage",
    "professionalTone": "assessment of professional language"
  }
}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  } catch (error) {
    console.error("Gemini semantic analysis error:", error);
    return {
      semanticMatch: {
        score: 0,
        reasoning: "Analysis failed",
        strengths: [],
        gaps: [],
        recommendations: [],
      },
      experienceAnalysis: {
        score: 0,
        yearsRequired: 0,
        yearsFound: 0,
        quality: "Analysis failed",
      },
      contentQuality: {
        score: 0,
        achievements: "Analysis failed",
        actionVerbs: "Analysis failed",
        professionalTone: "Analysis failed",
      },
    };
  }
}

// Hybrid analysis combining both models
async function performHybridAnalysis(cvText, jdText, userId) {
  console.log("🤖 Starting hybrid AI analysis...");

  // Step 1: Use GPT-3.5 for fast keyword extraction
  console.log("📝 GPT-3.5: Extracting keywords...");
  const keywords = await extractKeywordsWithGPT(cvText, jdText);

  // Step 2: Use Gemini 1.5 for complex semantic analysis
  console.log("🧠 Gemini 1.5: Performing semantic analysis...");
  const semanticAnalysis = await analyzeSemanticMatchWithGemini(
    cvText,
    jdText,
    keywords
  );

  // Step 3: Combine results
  const hybridResult = {
    keywordAnalysis: {
      totalKeywords: keywords.length,
      foundKeywords: keywords.filter((keyword) =>
        cvText.toLowerCase().includes(keyword.toLowerCase())
      ).length,
      keywords: keywords,
    },
    semanticAnalysis: semanticAnalysis,
    overallScore: Math.round(
      (semanticAnalysis.semanticMatch.score +
        semanticAnalysis.experienceAnalysis.score +
        semanticAnalysis.contentQuality.score) /
        3
    ),
    modelUsed: "Hybrid (GPT-3.5 + Gemini 1.5)",
    analysisTimestamp: new Date().toISOString(),
  };

  console.log("✅ Hybrid analysis completed");
  return hybridResult;
}

exports.handler = async (event, context) => {
  // Handle CORS
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
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

    // Perform hybrid analysis
    const analysisResult = await performHybridAnalysis(cvText, jdText, userId);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: analysisResult,
        tokensUsed: 0, // Will be calculated based on actual usage
      }),
    };
  } catch (error) {
    console.error("Hybrid analysis error:", error);
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
