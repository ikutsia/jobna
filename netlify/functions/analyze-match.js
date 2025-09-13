const OpenAI = require("openai");

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ATS Analysis functions (simplified server-side version)
const extractJobKeywords = (jdText) => {
  if (!jdText) return { required: [], preferred: [], technical: [], soft: [] };

  const text = jdText.toLowerCase();

  // Common technical skills patterns
  const technicalPatterns = [
    /\b(javascript|js|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|typescript|dart)\b/g,
    /\b(react|angular|vue|node\.?js|express|django|flask|spring|laravel|rails|asp\.net|jquery)\b/g,
    /\b(mysql|postgresql|mongodb|redis|sqlite|oracle|sql server|dynamodb|elasticsearch)\b/g,
    /\b(aws|azure|gcp|google cloud|amazon web services|microsoft azure|kubernetes|docker)\b/g,
    /\b(git|github|gitlab|jenkins|ci\/cd|devops|agile|scrum|jira|confluence|figma|sketch)\b/g,
    /\b(sql|nosql|machine learning|ai|artificial intelligence|data science|analytics|tableau|power bi)\b/g,
    /\b(html|css|sass|scss|bootstrap|tailwind|responsive design|rest api|graphql|microservices)\b/g,
  ];

  const softSkillsPatterns = [
    /\b(leadership|communication|teamwork|collaboration|problem solving|analytical|creative|innovative)\b/g,
    /\b(project management|time management|organization|attention to detail|multitasking)\b/g,
    /\b(customer service|client relations|stakeholder management|presentation|negotiation)\b/g,
  ];

  const keywords = {
    required: [],
    preferred: [],
    technical: [],
    soft: [],
  };

  technicalPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.technical.push(...matches.map((m) => m.toLowerCase()));
    }
  });

  softSkillsPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.soft.push(...matches.map((m) => m.toLowerCase()));
    }
  });

  Object.keys(keywords).forEach((key) => {
    keywords[key] = [...new Set(keywords[key])].sort();
  });

  keywords.required = [...keywords.technical];
  keywords.preferred = [...keywords.soft];

  return keywords;
};

const calculateATSScore = (cvText, jdText) => {
  if (!cvText || !jdText) {
    return {
      overallScore: 0,
      breakdown: {},
      recommendations: [],
      grade: "F",
    };
  }

  const jobKeywords = extractJobKeywords(jdText);
  const cvTextLower = cvText.toLowerCase();
  const jdTextLower = jdText.toLowerCase();

  // Calculate keyword match score (40% weight)
  const allKeywords = [...jobKeywords.required, ...jobKeywords.preferred];
  const totalKeywords = allKeywords.length;
  let matchedKeywords = 0;

  if (totalKeywords > 0) {
    allKeywords.forEach((keyword) => {
      const regex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "g"
      );
      const matches = cvTextLower.match(regex);
      if (matches && matches.length > 0) {
        matchedKeywords++;
      }
    });
  }

  const keywordScore =
    totalKeywords > 0
      ? Math.round((matchedKeywords / totalKeywords) * 100)
      : 100;

  // Calculate experience match score (25% weight)
  const jdExperienceMatch = jdTextLower.match(
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/
  );
  const requiredYears = jdExperienceMatch ? parseInt(jdExperienceMatch[1]) : 0;
  const cvExperienceMatch = cvTextLower.match(
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/
  );
  const candidateYears = cvExperienceMatch ? parseInt(cvExperienceMatch[1]) : 0;

  let experienceScore = 0;
  if (requiredYears === 0) {
    experienceScore = 100;
  } else if (candidateYears >= requiredYears) {
    experienceScore = 100;
  } else if (candidateYears > 0) {
    experienceScore = Math.round((candidateYears / requiredYears) * 100);
  }

  // Calculate education match score (15% weight)
  const educationKeywords = [
    "bachelor",
    "master",
    "phd",
    "degree",
    "diploma",
    "certification",
  ];
  let educationScore = 0;
  educationKeywords.forEach((edu) => {
    if (jdTextLower.includes(edu) && cvTextLower.includes(edu)) {
      educationScore += 20;
    }
  });
  educationScore = Math.min(educationScore, 100);

  // Calculate format score (10% weight)
  let formatScore = 0;
  if (cvText.includes("experience") || cvText.includes("work history"))
    formatScore += 20;
  if (cvText.includes("education") || cvText.includes("academic"))
    formatScore += 20;
  if (cvText.includes("skills") || cvText.includes("technical"))
    formatScore += 20;
  if (cvText.includes("@") && cvText.includes(".")) formatScore += 20;
  if (cvText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) formatScore += 20;

  // Calculate content quality score (10% weight)
  let contentScore = 0;
  const numbers = cvText.match(/\d+%/g);
  if (numbers && numbers.length > 0) contentScore += 30;

  const actionVerbs = [
    "achieved",
    "improved",
    "increased",
    "decreased",
    "managed",
    "led",
    "developed",
    "created",
    "implemented",
  ];
  const hasActionVerbs = actionVerbs.some((verb) => cvTextLower.includes(verb));
  if (hasActionVerbs) contentScore += 30;

  const technicalTerms = cvText.match(
    /\b(javascript|python|java|react|angular|sql|aws|git)\b/gi
  );
  if (technicalTerms && technicalTerms.length > 3) contentScore += 40;

  // Calculate weighted overall score
  const overallScore = Math.round(
    keywordScore * 0.4 +
      experienceScore * 0.25 +
      educationScore * 0.15 +
      formatScore * 0.1 +
      contentScore * 0.1
  );

  // Determine grade
  const getGrade = (score) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 75) return "C+";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  // Generate recommendations
  const recommendations = [];
  if (keywordScore < 70) {
    recommendations.push({
      type: "critical",
      category: "Keywords",
      message: `Only ${matchedKeywords}/${totalKeywords} required keywords found. Add missing keywords to improve ATS score.`,
      impact: "High",
    });
  }
  if (experienceScore < 80) {
    recommendations.push({
      type: "important",
      category: "Experience",
      message: `Experience level may not match requirements. Consider highlighting relevant experience more prominently.`,
      impact: "Medium",
    });
  }
  if (formatScore < 80) {
    recommendations.push({
      type: "format",
      category: "Format",
      message: `Resume format could be more ATS-friendly. Use standard sections and avoid complex layouts.`,
      impact: "Low",
    });
  }

  return {
    overallScore,
    grade: getGrade(overallScore),
    breakdown: {
      keywordMatch: {
        score: keywordScore,
        matched: matchedKeywords,
        total: totalKeywords,
      },
      experienceMatch: {
        score: experienceScore,
        required: requiredYears,
        candidate: candidateYears,
      },
      educationMatch: { score: educationScore },
      format: { score: formatScore },
      contentQuality: { score: contentScore },
    },
    recommendations,
  };
};

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

    // Calculate ATS score and analysis (simplified)
    let atsAnalysis;
    try {
      atsAnalysis = calculateATSScore(cvText, jdText);
    } catch (atsError) {
      console.error("ATS Analysis error:", atsError);
      atsAnalysis = {
        overallScore: 0,
        grade: "F",
        breakdown: {},
        recommendations: [],
      };
    }

    // Add ATS analysis to the response
    parsedResponse.atsAnalysis = atsAnalysis;

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
