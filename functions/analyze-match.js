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

    // Dynamic ATS analysis using job description extraction
    const cvTextLower = cvText.toLowerCase();
    const jdTextLower = jdText.toLowerCase();

    // Extract keywords from job description dynamically
    const extractJobKeywords = (jdText) => {
      if (!jdText)
        return { required: [], preferred: [], technical: [], soft: [] };

      const text = jdText.toLowerCase();

      // Common technical skills patterns
      const technicalPatterns = [
        // Programming languages
        /\b(javascript|js|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|typescript|dart)\b/g,
        // Frameworks and libraries
        /\b(react|angular|vue|node\.?js|express|django|flask|spring|laravel|rails|asp\.net|jquery)\b/g,
        // Databases
        /\b(mysql|postgresql|mongodb|redis|sqlite|oracle|sql server|dynamodb|elasticsearch)\b/g,
        // Cloud platforms
        /\b(aws|azure|gcp|google cloud|amazon web services|microsoft azure|kubernetes|docker)\b/g,
        // Tools and technologies
        /\b(git|github|gitlab|jenkins|ci\/cd|devops|agile|scrum|jira|confluence|figma|sketch)\b/g,
        // Data and analytics
        /\b(sql|nosql|machine learning|ai|artificial intelligence|data science|analytics|tableau|power bi)\b/g,
        // Web technologies
        /\b(html|css|sass|scss|bootstrap|tailwind|responsive design|rest api|graphql|microservices)\b/g,
        // Business and procurement terms
        /\b(procurement|sourcing|strategic sourcing|category management|supplier management|vendor management)\b/g,
        /\b(spend analysis|market analysis|benchmarking|contract negotiation|stakeholder management)\b/g,
        /\b(process improvement|change management|project management|program management|risk management)\b/g,
        // Marketing terms - separated for precision
        /\b(brand marketing|digital marketing|marketing campaigns|creative marketing|advertising)\b/g,
        /\b(marketing procurement|procurement for marketing|marketing sourcing)\b/g,
        /\b(marketing|marketing strategy|marketing operations)\b/g,
        /\b(analytical|analytics|data analysis|data-driven|reporting|presentation|communication)\b/g,
        /\b(leadership|team management|cross-functional|international|global|multinational)\b/g,
        /\b(optimization|efficiency|cost reduction|savings|roi|kpi|performance|metrics)\b/g,
        // Software and systems
        /\b(sap|ariba|oracle|salesforce|microsoft office|excel|powerpoint|word|google workspace)\b/g,
        /\b(erp|crm|scm|wms|tms|bi|dashboard|reporting tools|project management software)\b/g,
      ];

      // Soft skills patterns
      const softSkillsPatterns = [
        /\b(leadership|communication|teamwork|collaboration|problem solving|analytical|creative|innovative)\b/g,
        /\b(project management|time management|organization|attention to detail|multitasking)\b/g,
        /\b(customer service|client relations|stakeholder management|presentation|negotiation)\b/g,
      ];

      // Experience level indicators
      const experiencePatterns = [
        /\b(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)\b/g,
        /\b(senior|junior|mid-level|entry-level|lead|principal|architect|manager|director)\b/g,
      ];

      // Education requirements
      const educationPatterns = [
        /\b(bachelor|master|phd|degree|diploma|certification|certified|bsc|msc|mba)\b/g,
      ];

      const keywords = {
        required: [],
        preferred: [],
        technical: [],
        soft: [],
        experience: [],
        education: [],
      };

      // Extract technical skills
      technicalPatterns.forEach((pattern) => {
        const matches = text.match(pattern);
        if (matches) {
          keywords.technical.push(...matches.map((m) => m.toLowerCase()));
        }
      });

      // Extract soft skills
      softSkillsPatterns.forEach((pattern) => {
        const matches = text.match(pattern);
        if (matches) {
          keywords.soft.push(...matches.map((m) => m.toLowerCase()));
        }
      });

      // Extract experience requirements
      experiencePatterns.forEach((pattern) => {
        const matches = text.match(pattern);
        if (matches) {
          keywords.experience.push(...matches.map((m) => m.toLowerCase()));
        }
      });

      // Extract education requirements
      educationPatterns.forEach((pattern) => {
        const matches = text.match(pattern);
        if (matches) {
          keywords.education.push(...matches.map((m) => m.toLowerCase()));
        }
      });

      // Remove duplicates and sort
      Object.keys(keywords).forEach((key) => {
        keywords[key] = [...new Set(keywords[key])].sort();
      });

      // Categorize as required vs preferred based on context
      keywords.required = [
        ...keywords.technical,
        ...keywords.experience,
        ...keywords.education,
      ];
      keywords.preferred = [...keywords.soft];

      return keywords;
    };

    // Enhanced keyword matching with synonyms and semantic variations
    const getKeywordSynonyms = (keyword) => {
      const synonymMap = {
        // Analytical skills
        analytical: [
          "analysis",
          "analytics",
          "data analysis",
          "analytical skills",
          "analytical thinking",
        ],
        analysis: [
          "analytical",
          "analytics",
          "data analysis",
          "spend analysis",
          "market analysis",
        ],
        data: [
          "data analysis",
          "data-driven",
          "data handling",
          "data processing",
        ],

        // Management terms
        management: [
          "managing",
          "managed",
          "manager",
          "leadership",
          "leading",
          "led",
        ],
        project: [
          "project management",
          "project delivery",
          "project coordination",
          "program management",
        ],
        stakeholder: [
          "stakeholders",
          "stakeholder engagement",
          "stakeholder management",
          "business partners",
        ],

        // Procurement terms
        procurement: [
          "procurement activities",
          "procurement processes",
          "procurement systems",
        ],
        sourcing: [
          "strategic sourcing",
          "sourcing activities",
          "sourcing strategies",
        ],
        supplier: [
          "suppliers",
          "supplier management",
          "supplier portfolio",
          "vendor",
          "vendors",
          "partners",
        ],
        category: ["category management", "category strategies", "categories"],

        // Marketing terms - separated for precision
        marketing: [
          "marketing activities",
          "marketing operations",
          "marketing strategy",
        ],
        "brand marketing": [
          "brand strategy",
          "brand awareness",
          "brand campaigns",
          "advertising",
          "creative marketing",
        ],
        "marketing procurement": [
          "procurement for marketing",
          "marketing sourcing",
          "marketing vendor management",
        ],

        // Process terms
        process: [
          "processes",
          "process improvement",
          "process optimization",
          "workflow",
        ],
        optimization: [
          "optimize",
          "optimizing",
          "optimized",
          "improvement",
          "improving",
        ],

        // Communication terms
        communication: [
          "communicating",
          "communicated",
          "verbal communication",
          "written communication",
        ],
        presentation: [
          "presentations",
          "presenting",
          "presented",
          "reporting",
          "reports",
        ],

        // Technical terms
        technical: ["technology", "technologies", "tech", "systems", "tools"],
        software: ["systems", "tools", "platforms", "applications"],

        // Experience terms
        experience: [
          "experienced",
          "experiences",
          "background",
          "expertise",
          "knowledge",
        ],
        skills: ["skill", "capabilities", "competencies", "abilities"],

        // Leadership terms
        leadership: ["leading", "led", "leader", "managing", "management"],
        team: ["teams", "teamwork", "collaboration", "collaborative"],

        // Change terms
        change: [
          "changes",
          "changing",
          "transformation",
          "transforming",
          "improvement",
        ],
        improvement: [
          "improve",
          "improving",
          "improved",
          "enhancement",
          "enhancing",
        ],

        // International terms
        international: ["global", "multinational", "cross-border", "worldwide"],
        "cross-functional": [
          "cross functional",
          "interdisciplinary",
          "multi-disciplinary",
        ],
      };

      return synonymMap[keyword.toLowerCase()] || [keyword];
    };

    // Check if keyword or its synonyms exist in text
    const findKeywordMatches = (keyword, text) => {
      const synonyms = getKeywordSynonyms(keyword);
      let totalMatches = 0;
      const foundVariations = [];

      synonyms.forEach((synonym) => {
        // Create flexible regex that handles compound terms
        const escapedSynonym = synonym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // For compound terms, use more flexible matching
        if (synonym.includes(" ")) {
          // For multi-word terms, match with word boundaries
          const regex = new RegExp(`\\b${escapedSynonym}\\b`, "gi");
          const matches = text.match(regex);
          if (matches) {
            totalMatches += matches.length;
            foundVariations.push(synonym);
          }
        } else {
          // For single words, match with word boundaries
          const regex = new RegExp(`\\b${escapedSynonym}\\b`, "gi");
          const matches = text.match(regex);
          if (matches) {
            totalMatches += matches.length;
            foundVariations.push(synonym);
          }
        }
      });

      return { count: totalMatches, variations: foundVariations };
    };

    // Calculate keyword match score with enhanced matching
    const calculateKeywordMatchScore = (cvText, jobKeywords) => {
      const allKeywords = [...jobKeywords.required, ...jobKeywords.preferred];
      const totalKeywords = allKeywords.length;

      if (totalKeywords === 0) {
        return { score: 0, matched: 0, total: 0, details: [] };
      }

      let matchedKeywords = 0;
      const details = [];

      allKeywords.forEach((keyword) => {
        const matchResult = findKeywordMatches(keyword, cvText);
        const count = matchResult.count;

        if (count > 0) {
          matchedKeywords++;
          details.push({
            keyword,
            count,
            found: true,
            variations: matchResult.variations,
          });
        } else {
          details.push({
            keyword,
            count: 0,
            found: false,
            variations: [],
          });
        }
      });

      const score = Math.round((matchedKeywords / totalKeywords) * 100);

      return {
        score,
        matched: matchedKeywords,
        total: totalKeywords,
        details,
      };
    };

    // Calculate experience match score
    const calculateExperienceMatchScore = (cvText, jdText) => {
      // Extract years of experience from job description
      const jdExperienceMatch = jdText.match(
        /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i
      );
      const requiredYears = jdExperienceMatch
        ? parseInt(jdExperienceMatch[1])
        : 0;

      // Extract years of experience from resume - look for various patterns
      const cvExperiencePatterns = [
        /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi,
        /(\d+)\+?\s*years?\s*(of\s*)?(international|professional|relevant)/gi,
        /(\d+)\+?\s*years?\s*(in\s*)?(procurement|management|sourcing)/gi,
      ];

      let candidateYears = 0;
      let foundExperience = "";

      // Try each pattern to find experience
      for (const pattern of cvExperiencePatterns) {
        const matches = cvText.match(pattern);
        if (matches) {
          // Find the highest number mentioned
          const years = matches.map((match) => {
            const yearMatch = match.match(/(\d+)/);
            return yearMatch ? parseInt(yearMatch[1]) : 0;
          });
          const maxYears = Math.max(...years);
          if (maxYears > candidateYears) {
            candidateYears = maxYears;
            foundExperience = matches[0];
          }
        }
      }

      // If no explicit years found, try to calculate from date ranges
      if (candidateYears === 0) {
        const datePattern = /(\d{4})\s*[–-]\s*(\d{4}|\d{2})/g;
        const dateMatches = cvText.match(datePattern);
        if (dateMatches) {
          const currentYear = new Date().getFullYear();
          const years = dateMatches.map((match) => {
            const parts = match.match(/(\d{4})\s*[–-]\s*(\d{4}|\d{2})/);
            if (parts) {
              const startYear = parseInt(parts[1]);
              const endYear =
                parts[2].length === 2
                  ? parseInt(parts[2]) > 50
                    ? 1900 + parseInt(parts[2])
                    : 2000 + parseInt(parts[2])
                  : parseInt(parts[2]);
              return endYear - startYear;
            }
            return 0;
          });
          candidateYears = Math.max(...years);
        }
      }

      let score = 0;
      if (requiredYears === 0) {
        score = 100; // No specific requirement
      } else if (candidateYears >= requiredYears) {
        score = 100; // Meets or exceeds requirement
      } else if (candidateYears > 0) {
        score = Math.round((candidateYears / requiredYears) * 100);
      }

      return {
        score,
        required: requiredYears,
        candidate: candidateYears,
        match: candidateYears >= requiredYears,
        foundExperience: foundExperience || "Calculated from date ranges",
      };
    };

    // Calculate format score
    const calculateFormatScore = (cvText) => {
      let score = 0;
      const issues = [];
      const strengths = [];

      // Check for common ATS-friendly elements with comprehensive variations
      const experienceTerms = [
        "experience",
        "work experience",
        "work history",
        "employment",
        "career",
        "professional experience",
      ];
      const hasExperience = experienceTerms.some((term) =>
        cvText.includes(term)
      );
      if (hasExperience) {
        score += 20;
        strengths.push("Has experience section");
      }

      const educationTerms = [
        "education",
        "academic",
        "qualifications",
        "degrees",
        "certifications",
        "training",
      ];
      const hasEducation = educationTerms.some((term) => cvText.includes(term));
      if (hasEducation) {
        score += 20;
        strengths.push("Has education section");
      }

      const skillsTerms = [
        "skills",
        "technical skills",
        "competencies",
        "capabilities",
        "expertise",
        "proficiencies",
      ];
      const hasSkills = skillsTerms.some((term) => cvText.includes(term));
      if (hasSkills) {
        score += 20;
        strengths.push("Has skills section");
      }
      if (cvText.includes("@") && cvText.includes(".")) {
        score += 20;
        strengths.push("Has email address");
      }
      if (cvText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) {
        score += 20;
        strengths.push("Has phone number");
      }

      // Check for potential ATS issues
      if (cvText.includes("table") || cvText.includes("column")) {
        issues.push("Contains tables/columns - may confuse ATS systems");
        score -= 10;
      }
      if (
        cvText.includes("graphic") ||
        cvText.includes("image") ||
        cvText.includes("photo")
      ) {
        issues.push("Contains graphics/images - ATS cannot read them");
        score -= 15;
      }
      if (cvText.includes("header") && cvText.includes("footer")) {
        issues.push("Contains headers/footers - may not be read by ATS");
        score -= 5;
      }
      if (cvText.match(/[^\x00-\x7F]/)) {
        issues.push("Contains special characters - may cause ATS issues");
        score -= 5;
      }

      // Check for good structure indicators with comprehensive variations
      const summaryTerms = [
        "summary",
        "professional summary",
        "objective",
        "career objective",
        "profile",
        "about",
        "overview",
        "executive summary",
      ];
      const hasSummary = summaryTerms.some((term) => cvText.includes(term));
      if (hasSummary) {
        strengths.push("Has professional summary");
        score += 5;
      }
      const achievementTerms = [
        "achievement",
        "achievements",
        "accomplishment",
        "accomplishments",
        "results",
        "success",
        "awards",
      ];
      const hasAchievements = achievementTerms.some((term) =>
        cvText.includes(term)
      );
      if (hasAchievements) {
        strengths.push("Highlights achievements");
        score += 5;
      }

      const certificationTerms = [
        "certification",
        "certifications",
        "certificate",
        "certificates",
        "certified",
        "licenses",
        "credentials",
      ];
      const hasCertifications = certificationTerms.some((term) =>
        cvText.includes(term)
      );
      if (hasCertifications) {
        strengths.push("Includes certifications");
        score += 5;
      }

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      return {
        score,
        issues,
        strengths,
        description:
          issues.length > 0
            ? `ATS-friendly with ${issues.length} potential issues`
            : "ATS-friendly structure",
      };
    };

    // Extract keywords from job description
    const jobKeywords = extractJobKeywords(jdText);
    const keywordScore = calculateKeywordMatchScore(cvTextLower, jobKeywords);
    const experienceScore = calculateExperienceMatchScore(
      cvTextLower,
      jdTextLower
    );
    const formatScore = calculateFormatScore(cvText);

    // Calculate content quality score
    const calculateContentQualityScore = (cvText) => {
      let score = 0;
      const suggestions = [];

      // Check for quantified achievements
      const numbers = cvText.match(/\d+%/g);
      if (numbers && numbers.length > 0) {
        score += 30;
      } else {
        suggestions.push(
          "Add quantified achievements (percentages, numbers, results)"
        );
      }

      // Check for action verbs
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
        "optimized",
        "delivered",
        "executed",
        "coordinated",
        "facilitated",
        "established",
        "built",
      ];
      const hasActionVerbs = actionVerbs.some((verb) =>
        cvText.toLowerCase().includes(verb)
      );
      if (hasActionVerbs) {
        score += 30;
      } else {
        suggestions.push(
          "Use strong action verbs to describe your achievements"
        );
      }

      // Check for relevant keywords
      const technicalTerms = cvText.match(
        /\b(procurement|sourcing|management|analytical|strategic|leadership|project|stakeholder|supplier|category)\b/gi
      );
      if (technicalTerms && technicalTerms.length > 5) {
        score += 40;
      } else {
        suggestions.push("Include more relevant professional keywords");
      }

      return {
        score: Math.min(score, 100),
        suggestions,
        description:
          suggestions.length === 0
            ? "Strong content with achievements and action verbs"
            : "Content could be strengthened with more achievements",
      };
    };

    const contentScore = calculateContentQualityScore(cvText);

    // Calculate education match score
    const calculateEducationMatchScore = (cvText, jdText) => {
      const educationKeywords = [
        "bachelor",
        "master",
        "phd",
        "degree",
        "diploma",
        "certification",
        "certified",
        "bsc",
        "msc",
        "mba",
        "ma",
        "ba",
      ];

      // Check if job description has specific education requirements
      const jdEducationKeywords = educationKeywords.filter((edu) =>
        jdText.includes(edu)
      );

      // Check what education the candidate has
      const cvEducationKeywords = educationKeywords.filter((edu) =>
        cvText.includes(edu)
      );

      let score = 0;
      let description = "";

      if (jdEducationKeywords.length > 0) {
        // Job has specific education requirements - check if candidate meets them
        const matchedEducation = jdEducationKeywords.filter((edu) =>
          cvEducationKeywords.includes(edu)
        );
        score = Math.round(
          (matchedEducation.length / jdEducationKeywords.length) * 100
        );
        description =
          matchedEducation.length > 0
            ? `Education requirements met: ${matchedEducation.join(", ")}`
            : `Missing education requirements: ${jdEducationKeywords.join(
                ", "
              )}`;
      } else {
        // No specific education requirements in job - give points for having education
        if (cvEducationKeywords.length > 0) {
          score = 100; // Has education, no specific requirements
          description = `Has education: ${cvEducationKeywords.join(", ")}`;
        } else {
          score = 50; // No education mentioned, but no requirements either
          description = "No education mentioned, but no specific requirements";
        }
      }

      return {
        score: Math.min(score, 100),
        found: cvEducationKeywords,
        hasEducation: cvEducationKeywords.length > 0,
        description: description,
      };
    };

    const educationScore = calculateEducationMatchScore(
      cvTextLower,
      jdTextLower
    );
    const overallScore = Math.min(keywordScore.score + 30, 100);

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
          score: keywordScore.score,
          matched: keywordScore.matched,
          total: keywordScore.total,
        },
        experienceMatch: calculateExperienceMatchScore(
          cvTextLower,
          jdTextLower
        ),
        educationMatch: calculateEducationMatchScore(cvTextLower, jdTextLower),
        format: calculateFormatScore(cvText),
        contentQuality: calculateContentQualityScore(cvText),
      },
      recommendations: [
        {
          type: "important",
          category: "Keywords",
          message: `Found ${keywordScore.matched} of ${keywordScore.total} keywords from job description`,
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
          matchScore: Math.min(keywordScore.score + 20, 100),
          skillsMatch: keywordScore.details
            .filter((d) => d.found)
            .map((d) => d.keyword),
          missingSkills: keywordScore.details
            .filter((d) => !d.found)
            .map((d) => d.keyword),
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
        matchScore: Math.min(keywordScore.score + 20, 100),
        skillsMatch: keywordScore.details
          .filter((d) => d.found)
          .map((d) => d.keyword),
        missingSkills: keywordScore.details
          .filter((d) => !d.found)
          .map((d) => d.keyword),
        recommendations: [
          "Add missing technical keywords to improve match",
          "Highlight relevant experience more prominently",
          "Include quantified achievements and results",
          "Ensure resume format is ATS-friendly",
          "Add more action verbs to describe accomplishments",
        ],
        assessment: `Your CV matches ${Math.min(
          keywordScore.score + 20,
          100
        )}% of the job requirements. Found ${
          keywordScore.matched
        } matching keywords from the job description.`,
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
