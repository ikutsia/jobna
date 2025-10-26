const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize AI models
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Task complexity definitions
const TASK_COMPLEXITY = {
  SIMPLE: {
    models: ["gpt-3.5-turbo"],
    maxTokens: 500,
    temperature: 0.1,
    tasks: [
      "keyword_extraction",
      "basic_format_check",
      "contact_info_extraction",
      "section_identification",
      "simple_scoring",
    ],
  },
  COMPLEX: {
    models: ["gemini-2.0-flash-exp"],
    maxTokens: 2000,
    temperature: 0.3,
    tasks: [
      "semantic_analysis",
      "experience_evaluation",
      "content_quality_assessment",
      "education_matching",
      "overall_ats_score",
      "recommendation_generation",
    ],
  },
};

// Smart task router
function routeTask(taskType, content) {
  const complexity = Object.keys(TASK_COMPLEXITY).find((level) =>
    TASK_COMPLEXITY[level].tasks.includes(taskType)
  );

  return {
    model: complexity === "SIMPLE" ? "gpt-3.5-turbo" : "gemini-2.0-flash-exp",
    complexity: complexity || "SIMPLE",
    config: TASK_COMPLEXITY[complexity || "SIMPLE"],
  };
}

// GPT-3.5 executor for simple tasks
async function executeGPTTask(prompt, config) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    return {
      success: true,
      result: completion.choices[0].message.content,
      model: "gpt-3.5-turbo",
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("GPT task execution error:", error);
    return {
      success: false,
      error: error.message,
      model: "gpt-3.5-turbo",
    };
  }
}

// Gemini 1.5 executor for complex tasks
async function executeGeminiTask(prompt, config) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      result: text,
      model: "gemini-2.0-flash-exp",
      tokensUsed: 0, // Gemini doesn't provide token count in the same way
    };
  } catch (error) {
    console.error("Gemini task execution error:", error);
    return {
      success: false,
      error: error.message,
      model: "gemini-2.0-flash-exp",
    };
  }
}

// Main task executor
async function executeTask(taskType, content, additionalData = {}) {
  const routing = routeTask(taskType, content);
  const config = routing.config;

  console.log(
    `🎯 Routing task '${taskType}' to ${routing.model} (${routing.complexity})`
  );

  let prompt;

  // Generate appropriate prompt based on task type
  switch (taskType) {
    case "keyword_extraction":
      prompt = `Extract technical and professional keywords from this job description. Return only a JSON array of unique keywords:

Job Description: ${content}

Return format: ["keyword1", "keyword2", "keyword3"]`;
      break;

    case "semantic_analysis":
      prompt = `Analyze the semantic match between this CV and job description. Focus on understanding context and meaning, not just keyword matching.

CV: ${content}
Job Description: ${additionalData.jdText}

Provide analysis in JSON format:
{
  "semanticMatch": {
    "score": 0-100,
    "reasoning": "detailed explanation",
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"]
  }
}`;
      break;

    case "experience_evaluation":
      prompt = `Evaluate the experience match between CV and job requirements. Consider both quantity and quality of experience.

CV: ${content}
Job Description: ${additionalData.jdText}

Provide analysis in JSON format:
{
  "experienceAnalysis": {
    "score": 0-100,
    "yearsRequired": number,
    "yearsFound": number,
    "quality": "assessment of experience quality",
    "relevance": "how relevant the experience is"
  }
}`;
      break;

    case "content_quality_assessment":
      prompt = `Assess the quality of CV content, focusing on achievements, action verbs, and professional presentation.

CV: ${content}

Provide analysis in JSON format:
{
  "contentQuality": {
    "score": 0-100,
    "achievements": "assessment of quantified achievements",
    "actionVerbs": "assessment of action verb usage",
    "professionalTone": "assessment of professional language",
    "suggestions": ["suggestion1", "suggestion2"]
  }
}`;
      break;

    default:
      prompt = `Analyze this content: ${content}`;
  }

  // Execute with appropriate model
  if (routing.model === "gpt-3.5-turbo") {
    return await executeGPTTask(prompt, config);
  } else {
    return await executeGeminiTask(prompt, config);
  }
}

// Parallel task execution for efficiency
async function executeParallelTasks(tasks) {
  const results = await Promise.all(
    tasks.map((task) =>
      executeTask(task.type, task.content, task.additionalData)
    )
  );

  return results.reduce((acc, result, index) => {
    acc[tasks[index].type] = result;
    return acc;
  }, {});
}

module.exports = {
  executeTask,
  executeParallelTasks,
  routeTask,
  TASK_COMPLEXITY,
};
