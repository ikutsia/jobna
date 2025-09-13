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

    // Simple ATS analysis without OpenAI
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
    ];
    const foundKeywords = technicalKeywords.filter(
      (keyword) =>
        jdTextLower.includes(keyword) && cvTextLower.includes(keyword)
    );

    const keywordScore = Math.round(
      (foundKeywords.length / technicalKeywords.length) * 100
    );
    const overallScore = Math.min(keywordScore + 30, 100);

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

    const analysis = {
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
    console.error("Analysis error:", error);
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
