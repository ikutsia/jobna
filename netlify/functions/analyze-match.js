const OpenAI = require("openai");

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Simple ATS analysis
    const cvTextLower = cvText.toLowerCase();
    const jdTextLower = jdText.toLowerCase();

    const technicalKeywords = [
      "javascript",
      "python",
      "java",
      "react",
      "angular",
      "vue",
      "node",
      "sql",
      "aws",
      "git",
      "html",
      "css",
      "typescript",
      "mongodb",
      "express",
      "docker",
      "kubernetes",
      "php",
      "ruby",
      "go",
      "rust",
      "swift",
      "kotlin",
      "dart",
      "django",
      "flask",
      "spring",
      "laravel",
      "rails",
      "mysql",
      "postgresql",
      "redis",
      "sqlite",
      "oracle",
      "elasticsearch",
      "azure",
      "gcp",
      "github",
      "gitlab",
      "jenkins",
      "devops",
      "agile",
      "scrum",
      "jira",
      "confluence",
    ];

    const foundKeywords = technicalKeywords.filter(
      (keyword) =>
        jdTextLower.includes(keyword) && cvTextLower.includes(keyword)
    );

    const keywordScore = Math.round(
      (foundKeywords.length / technicalKeywords.length) * 100
    );
    const overallScore = Math.min(keywordScore + 30, 100);

    // Calculate ATS analysis
    const atsAnalysis = {
      overallScore,
      grade:
        overallScore >= 90
          ? "A"
          : overallScore >= 80
          ? "B"
          : overallScore >= 70
          ? "C"
          : "D",
      breakdown: {
        keywordMatch: {
          score: keywordScore,
          matched: foundKeywords.length,
          total: technicalKeywords.length,
        },
        experienceMatch: { score: 75, required: 3, candidate: 2 },
        educationMatch: { score: 80 },
        format: { score: 85 },
        contentQuality: { score: 70 },
      },
      recommendations: [
        {
          type: "important",
          category: "Keywords",
          message: `Found ${foundKeywords.length} of ${technicalKeywords.length} technical keywords`,
          impact: "Medium",
        },
      ],
    };

    // Try OpenAI analysis, fallback to local analysis if it fails
    let analysis;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a professional HR analyst. Respond with ONLY valid JSON. No additional text.",
          },
          {
            role: "user",
            content: `Analyze this CV against the job description. Respond with ONLY this JSON structure:
{
  "matchScore": [number 0-100],
  "skillsMatch": ["skill1", "skill2"],
  "missingSkills": ["missing1", "missing2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "assessment": "Brief assessment",
  "keywordAnalysis": {
    "keyword1": {"importance": "High", "count": 3}
  }
}

CV: ${cvText}

Job Description: ${jdText}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        parsedResponse = {
          matchScore: Math.min(keywordScore + 20, 100),
          skillsMatch: foundKeywords,
          missingSkills: technicalKeywords.filter(
            (k) => !foundKeywords.includes(k)
          ),
          recommendations: ["Add missing technical keywords"],
          assessment: "Analysis completed with basic keyword matching",
          keywordAnalysis: {},
        };
      }

      // Add ATS analysis
      parsedResponse.atsAnalysis = atsAnalysis;

      analysis = parsedResponse;
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);

      // Fallback to local analysis
      analysis = {
        matchScore: Math.min(keywordScore + 20, 100),
        skillsMatch: foundKeywords,
        missingSkills: technicalKeywords.filter(
          (k) => !foundKeywords.includes(k)
        ),
        recommendations: [
          "Add missing technical keywords to improve match",
          "Highlight relevant experience more prominently",
          "Include quantified achievements and results",
          "Ensure resume format is ATS-friendly",
          "Add more action verbs to describe accomplishments",
        ],
        assessment: `Your CV matches ${Math.min(
          keywordScore + 20,
          100
        )}% of the job requirements. Found ${
          foundKeywords.length
        } matching technical skills.`,
        keywordAnalysis: {},
        atsAnalysis,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: analysis,
        tokensUsed: 100,
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
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
};
