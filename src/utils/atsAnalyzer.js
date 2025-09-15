/**
 * ATS (Applicant Tracking System) Analysis Utilities
 * Provides ATS score prediction, keyword analysis, and optimization suggestions
 */

/**
 * Extract keywords from job description text
 * @param {string} jdText - Job description text
 * @returns {Object} - Extracted keywords with importance levels
 */
export const extractJobKeywords = (jdText) => {
  if (!jdText) return { required: [], preferred: [], technical: [], soft: [] };

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

/**
 * Calculate keyword density in resume
 * @param {string} cvText - Resume text
 * @param {Array} keywords - Keywords to analyze
 * @returns {Object} - Keyword density analysis
 */
export const calculateKeywordDensity = (cvText, keywords) => {
  if (!cvText || !keywords || keywords.length === 0) {
    return { density: {}, recommendations: [] };
  }

  const text = cvText.toLowerCase();
  const totalWords = text.split(/\s+/).length;
  const density = {};
  const recommendations = [];

  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(
      `\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "g"
    );
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    const percentage = ((count / totalWords) * 100).toFixed(2);

    density[keyword] = {
      count,
      percentage: parseFloat(percentage),
      status: getKeywordStatus(count, percentage),
    };

    // Generate recommendations
    if (count === 0) {
      recommendations.push({
        type: "missing",
        keyword,
        message: `Add "${keyword}" to your resume - it's mentioned in the job description`,
      });
    } else if (count === 1 && parseFloat(percentage) < 0.1) {
      recommendations.push({
        type: "low",
        keyword,
        message: `Consider mentioning "${keyword}" more prominently or in multiple sections`,
      });
    } else if (count > 3) {
      recommendations.push({
        type: "high",
        keyword,
        message: `Good use of "${keyword}" - appears ${count} times`,
      });
    }
  });

  return { density, recommendations };
};

/**
 * Determine keyword status based on count and density
 * @param {number} count - Number of occurrences
 * @param {string} percentage - Percentage of total words
 * @returns {string} - Status (missing, low, good, high)
 */
const getKeywordStatus = (count, percentage) => {
  if (count === 0) return "missing";
  if (count === 1 && parseFloat(percentage) < 0.1) return "low";
  if (count >= 2 && parseFloat(percentage) >= 0.1) return "good";
  if (count >= 3) return "high";
  return "low";
};

/**
 * Calculate ATS score based on multiple factors
 * @param {string} cvText - Resume text
 * @param {string} jdText - Job description text
 * @returns {Object} - ATS score breakdown and overall score
 */
export const calculateATSScore = (cvText, jdText) => {
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
  const keywordScore = calculateKeywordMatchScore(cvTextLower, jobKeywords);

  // Calculate experience match score (25% weight)
  const experienceScore = calculateExperienceMatchScore(
    cvTextLower,
    jdTextLower
  );

  // Calculate education match score (15% weight)
  const educationScore = calculateEducationMatchScore(cvTextLower, jdTextLower);

  // Calculate format score (10% weight)
  const formatScore = calculateFormatScore(cvText);

  // Calculate content quality score (10% weight)
  const contentScore = calculateContentQualityScore(cvText);

  // Calculate weighted overall score
  const overallScore = Math.round(
    keywordScore.score * 0.4 +
      experienceScore.score * 0.25 +
      educationScore.score * 0.15 +
      formatScore.score * 0.1 +
      contentScore.score * 0.1
  );

  // Determine grade
  const grade = getATSScoreGrade(overallScore);

  // Generate recommendations
  const recommendations = generateATSRecommendations({
    keywordScore,
    experienceScore,
    educationScore,
    formatScore,
    contentScore,
    overallScore,
  });

  return {
    overallScore,
    grade,
    breakdown: {
      keywordMatch: keywordScore,
      experienceMatch: experienceScore,
      educationMatch: educationScore,
      format: formatScore,
      contentQuality: contentScore,
    },
    recommendations,
  };
};

/**
 * Calculate keyword match score
 * @param {string} cvText - Resume text (lowercase)
 * @param {Object} jobKeywords - Extracted job keywords
 * @returns {Object} - Keyword match score and details
 */
const calculateKeywordMatchScore = (cvText, jobKeywords) => {
  const allKeywords = [...jobKeywords.required, ...jobKeywords.preferred];
  const totalKeywords = allKeywords.length;

  if (totalKeywords === 0) {
    return { score: 0, matched: 0, total: 0, details: [] };
  }

  let matchedKeywords = 0;
  const details = [];

  allKeywords.forEach((keyword) => {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "g"
    );
    const matches = cvText.match(regex);
    const count = matches ? matches.length : 0;

    if (count > 0) {
      matchedKeywords++;
      details.push({
        keyword,
        count,
        found: true,
      });
    } else {
      details.push({
        keyword,
        count: 0,
        found: false,
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

/**
 * Calculate experience match score
 * @param {string} cvText - Resume text (lowercase)
 * @param {string} jdText - Job description text (lowercase)
 * @returns {Object} - Experience match score
 */
const calculateExperienceMatchScore = (cvText, jdText) => {
  // Extract years of experience from job description
  const jdExperienceMatch = jdText.match(
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/
  );
  const requiredYears = jdExperienceMatch ? parseInt(jdExperienceMatch[1]) : 0;

  // Extract years of experience from resume
  const cvExperienceMatch = cvText.match(
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/
  );
  const candidateYears = cvExperienceMatch ? parseInt(cvExperienceMatch[1]) : 0;

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
  };
};

/**
 * Calculate education match score
 * @param {string} cvText - Resume text (lowercase)
 * @param {string} jdText - Job description text (lowercase)
 * @returns {Object} - Education match score
 */
const calculateEducationMatchScore = (cvText, jdText) => {
  const educationKeywords = [
    "bachelor",
    "master",
    "phd",
    "degree",
    "diploma",
    "certification",
  ];
  let score = 0;
  const foundEducation = [];

  educationKeywords.forEach((edu) => {
    if (jdText.includes(edu) && cvText.includes(edu)) {
      score += 20;
      foundEducation.push(edu);
    }
  });

  return {
    score: Math.min(score, 100),
    found: foundEducation,
    hasEducation:
      cvText.includes("degree") ||
      cvText.includes("bachelor") ||
      cvText.includes("master"),
  };
};

/**
 * Calculate format score
 * @param {string} cvText - Resume text
 * @returns {Object} - Format score
 */
const calculateFormatScore = (cvText) => {
  let score = 0;
  const issues = [];

  // Check for common ATS-friendly elements
  if (cvText.includes("experience") || cvText.includes("work history"))
    score += 20;
  if (cvText.includes("education") || cvText.includes("academic")) score += 20;
  if (cvText.includes("skills") || cvText.includes("technical")) score += 20;
  if (cvText.includes("@") && cvText.includes(".")) score += 20; // Email format
  if (cvText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) score += 20; // Phone number

  // Check for potential issues
  if (cvText.includes("table") || cvText.includes("column")) {
    issues.push("Avoid tables and columns - they can confuse ATS systems");
  }
  if (cvText.includes("graphic") || cvText.includes("image")) {
    issues.push("Remove graphics and images - ATS cannot read them");
  }

  return {
    score: Math.min(score, 100),
    issues,
  };
};

/**
 * Calculate content quality score
 * @param {string} cvText - Resume text
 * @returns {Object} - Content quality score
 */
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
  ];
  const hasActionVerbs = actionVerbs.some((verb) =>
    cvText.toLowerCase().includes(verb)
  );
  if (hasActionVerbs) {
    score += 30;
  } else {
    suggestions.push("Use strong action verbs to describe your achievements");
  }

  // Check for relevant keywords
  const technicalTerms = cvText.match(
    /\b(javascript|python|java|react|angular|sql|aws|git)\b/gi
  );
  if (technicalTerms && technicalTerms.length > 3) {
    score += 40;
  } else {
    suggestions.push("Include more relevant technical keywords");
  }

  return {
    score: Math.min(score, 100),
    suggestions,
  };
};

/**
 * Get ATS score grade
 * @param {number} score - Overall ATS score
 * @returns {string} - Grade (A+, A, B+, B, C+, C, D, F)
 */
const getATSScoreGrade = (score) => {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
};

/**
 * Generate ATS optimization recommendations
 * @param {Object} scores - All score breakdowns
 * @returns {Array} - Array of recommendations
 */
const generateATSRecommendations = (scores) => {
  const recommendations = [];

  // Keyword recommendations
  if (scores.keywordScore.score < 70) {
    recommendations.push({
      type: "critical",
      category: "Keywords",
      message: `Only ${scores.keywordScore.matched}/${scores.keywordScore.total} required keywords found. Add missing keywords to improve ATS score.`,
      impact: "High",
    });
  }

  // Experience recommendations
  if (scores.experienceScore.score < 80) {
    recommendations.push({
      type: "important",
      category: "Experience",
      message: `Experience level may not match requirements. Consider highlighting relevant experience more prominently.`,
      impact: "Medium",
    });
  }

  // Education recommendations
  if (scores.educationScore.score < 60) {
    recommendations.push({
      type: "important",
      category: "Education",
      message: `Education section may be missing or incomplete. Ensure all relevant degrees and certifications are listed.`,
      impact: "Medium",
    });
  }

  // Format recommendations
  if (scores.formatScore.score < 80) {
    recommendations.push({
      type: "format",
      category: "Format",
      message: `Resume format could be more ATS-friendly. Use standard sections and avoid complex layouts.`,
      impact: "Low",
    });
  }

  // Content recommendations
  if (scores.contentScore.score < 70) {
    recommendations.push({
      type: "content",
      category: "Content",
      message: `Add more quantified achievements and action verbs to strengthen your resume.`,
      impact: "Medium",
    });
  }

  return recommendations;
};

/**
 * Get ATS score color for UI display
 * @param {number} score - ATS score
 * @returns {string} - CSS color class
 */
export const getATSScoreColor = (score) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 60) return "text-orange-600";
  return "text-red-600";
};

/**
 * Get ATS score background color for UI display
 * @param {number} score - ATS score
 * @returns {string} - CSS background color class
 */
export const getATSScoreBgColor = (score) => {
  if (score >= 90) return "bg-green-100";
  if (score >= 80) return "bg-blue-100";
  if (score >= 70) return "bg-yellow-100";
  if (score >= 60) return "bg-orange-100";
  return "bg-red-100";
};
