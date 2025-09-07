import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  analyzeMatch,
  getRemainingCalls,
  getCostEstimate,
} from "../firebase/openai";
import { getCurrentUser } from "../firebase/auth";

function AnalyzeNow() {
  const [analysisData, setAnalysisData] = useState({
    isAnalyzing: false,
    analysisProgress: 0,
    analysisComplete: false,
  });

  const [analysisResults, setAnalysisResults] = useState({
    matchScore: 0,
    skillsMatch: [],
    missingSkills: [],
    recommendations: [],
    assessment: "",
    keywordAnalysis: {},
  });

  const [usageInfo, setUsageInfo] = useState({
    remainingCalls: 0,
    isLoading: true,
  });

  const [costInfo, setCostInfo] = useState({
    tokensUsed: 0,
    cost: "0.0000",
    remaining: "5.0000",
    isLoading: true,
  });

  // Check user's remaining API calls and cost
  const checkUsage = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        const remaining = await getRemainingCalls(user.uid);
        const cost = await getCostEstimate(user.uid);
        setUsageInfo({ remainingCalls: remaining, isLoading: false });
        setCostInfo({ ...cost, isLoading: false });
      }
    } catch (error) {
      console.error("Error checking usage:", error);
      setUsageInfo({ remainingCalls: 0, isLoading: false });
      setCostInfo({
        tokensUsed: 0,
        cost: "0.0000",
        remaining: "5.0000",
        isLoading: false,
      });
    }
  };

  // Demo mode for testing without OpenAI API
  const handleDemoMode = () => {
    setAnalysisData((prev) => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    // Simulate analysis progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setAnalysisData((prev) => ({
        ...prev,
        analysisProgress: progress,
      }));

      if (progress >= 100) {
        clearInterval(interval);

        // Set demo results with proper structure
        setAnalysisResults({
          matchScore: 78,
          skillsMatch: ["JavaScript", "React", "Node.js", "Git", "Agile"],
          missingSkills: ["Docker", "Kubernetes", "AWS"],
          recommendations: [
            "Add Docker experience to your CV",
            "Include cloud platform experience (AWS/Azure/GCP)",
            "Highlight any containerization knowledge",
            "Add Kubernetes or similar orchestration tools",
            "Consider getting cloud certifications",
          ],
          assessment:
            "Good technical foundation with modern web development skills, but missing cloud and containerization experience that's increasingly important for DevOps roles.",
          keywordAnalysis: {
            JavaScript: { importance: "High", count: 5 },
            React: { importance: "High", count: 4 },
            "Node.js": { importance: "Medium", count: 3 },
            Docker: { importance: "High", count: 2 },
            AWS: { importance: "Medium", count: 2 },
          },
        });

        setAnalysisData({
          isAnalyzing: false,
          analysisComplete: true,
          analysisProgress: 100,
          error: null,
        });
      }
    }, 500);
  };

  // Real analysis with OpenAI
  const handleAnalyze = async () => {
    try {
      setAnalysisData((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }));

      const user = getCurrentUser();
      if (!user) {
        throw new Error("Please log in to analyze your CV and job description");
      }

      // Check usage limits
      if (usageInfo.remainingCalls <= 0) {
        throw new Error(
          "Monthly API call limit reached. Please upgrade or wait until next month."
        );
      }

      // Get actual uploaded files from localStorage
      const cvText = localStorage.getItem("cvText");
      const jdText = localStorage.getItem("jdText");

      if (!cvText || !jdText) {
        throw new Error(
          "Please upload both CV and Job Description files first. Go to the upload pages to add your documents."
        );
      }

      // Analyze match with OpenAI using actual uploaded files
      const results = await analyzeMatch(cvText, jdText, user.uid);

      setAnalysisResults(results);
      setAnalysisData({
        isAnalyzing: false,
        analysisComplete: true,
        analysisProgress: 100,
      });

      // Update usage info
      await checkUsage();
    } catch (error) {
      console.error("Analysis error:", error);

      let errorMessage = error.message;

      // Handle specific OpenAI errors
      if (error.message.includes("429") || error.message.includes("quota")) {
        errorMessage =
          "OpenAI API quota exceeded. Please check your billing or wait until next month.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "OpenAI API key not configured. Please check your environment setup.";
      }

      setAnalysisData({
        isAnalyzing: false,
        analysisComplete: false,
        analysisProgress: 0,
        error: errorMessage,
      });
    }
  };

  // Load usage info on component mount
  useEffect(() => {
    checkUsage();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 80) return "bg-blue-100";
    if (score >= 70) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Usage Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                API Calls Remaining
              </h3>
              <p className="text-lg font-bold text-blue-600">
                {usageInfo.isLoading ? "..." : usageInfo.remainingCalls}
              </p>
              <p className="text-xs text-blue-600">Free tier: 50/month</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Cost This Month
              </h3>
              <p className="text-lg font-bold text-blue-600">
                ${costInfo.isLoading ? "..." : costInfo.cost}
              </p>
              <p className="text-xs text-blue-600">Budget: $5.00</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Remaining Budget
              </h3>
              <p className="text-lg font-bold text-blue-600">
                ${costInfo.isLoading ? "..." : costInfo.remaining}
              </p>
              <p className="text-xs text-blue-600">Free tier limit</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyze Your CV Against Job Description
          </h1>
          <p className="text-gray-600">
            Get detailed insights on how well your CV matches the job
            requirements
          </p>
        </div>

        {!analysisData.analysisComplete ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-8">
              {/* File Upload Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Required Files Status
                </h3>

                {/* CV Status */}
                <div className="flex items-center justify-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      localStorage.getItem("cvText")
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    CV:{" "}
                    {localStorage.getItem("cvText")
                      ? "✅ Uploaded"
                      : "❌ Not uploaded"}
                  </span>
                </div>

                {/* Job Description Status */}
                <div className="flex items-center justify-center space-x-3">
                  <div
                    className={`w-4 h-5 rounded-full ${
                      localStorage.getItem("jdText")
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    Job Description:{" "}
                    {localStorage.getItem("jdText")
                      ? "✅ Uploaded"
                      : "❌ Not uploaded"}
                  </span>
                </div>

                {/* Instructions */}
                {(!localStorage.getItem("cvText") ||
                  !localStorage.getItem("jdText")) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Please upload both your CV and Job Description files first
                      before starting analysis.
                    </p>
                    <div className="mt-3 space-x-3">
                      <Link
                        to="/upload-cv"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded"
                      >
                        Upload CV
                      </Link>
                      <Link
                        to="/upload-job-description"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded"
                      >
                        Upload Job Description
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {analysisData.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-800">{analysisData.error}</p>
                  </div>
                </div>
              )}

              {/* Analysis Progress */}
              {analysisData.isAnalyzing && (
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${analysisData.analysisProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Analyzing... {analysisData.analysisProgress}%
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={
                    analysisData.isAnalyzing ||
                    !localStorage.getItem("cvText") ||
                    !localStorage.getItem("jdText")
                  }
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none text-lg"
                >
                  {analysisData.isAnalyzing ? "Analyzing..." : "Start Analysis"}
                </button>

                <button
                  onClick={handleDemoMode}
                  disabled={analysisData.isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none text-lg"
                >
                  {analysisData.isAnalyzing ? "Analyzing..." : "Demo Mode"}
                </button>
              </div>

              {/* Demo Mode Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Demo Mode:</strong> Try the demo to see sample
                  analysis results without using OpenAI API calls. This is
                  useful when you've exceeded your API quota or want to test the
                  interface.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            {/* Match Score */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Analysis Results
              </h2>

              <div className="text-center mb-8">
                <div
                  className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(
                    analysisResults.matchScore
                  )} mb-4`}
                >
                  <span
                    className={`text-4xl font-bold ${getScoreColor(
                      analysisResults.matchScore
                    )}`}
                  >
                    {analysisResults.matchScore}%
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Match Score
                </h3>
                <p className="text-gray-600">
                  Your CV matches {analysisResults.matchScore}% of the job
                  requirements
                </p>
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Matching Skills */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Matching Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.skillsMatch &&
                  analysisResults.skillsMatch.length > 0 ? (
                    analysisResults.skillsMatch.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No matching skills found yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 text-red-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.missingSkills &&
                  analysisResults.missingSkills.length > 0 ? (
                    analysisResults.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No missing skills identified yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-6 h-6 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Recommendations
              </h3>
              <ul className="space-y-3">
                {analysisResults.recommendations &&
                analysisResults.recommendations.length > 0 ? (
                  analysisResults.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    )
                  )
                ) : (
                  <li className="text-gray-500 text-sm">
                    No recommendations available yet.
                  </li>
                )}
              </ul>
            </div>

            {/* Overall Assessment */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-6 h-5 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Overall Assessment
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  {analysisResults.assessment || "No assessment available yet."}
                </p>
              </div>
            </div>

            {/* Keyword Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Keyword Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResults.keywordAnalysis &&
                Object.keys(analysisResults.keywordAnalysis).length > 0 ? (
                  Object.entries(analysisResults.keywordAnalysis).map(
                    ([keyword, data]) => (
                      <div
                        key={keyword}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">
                            {keyword}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              data.importance === "High"
                                ? "bg-red-100 text-red-800"
                                : data.importance === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {data.importance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Mentioned {data.count} times
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    <p>No keyword analysis available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* New Analysis Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setAnalysisData({
                    isAnalyzing: false,
                    analysisProgress: 0,
                    analysisComplete: false,
                  });
                  setAnalysisResults({
                    matchScore: 0,
                    skillsMatch: [],
                    missingSkills: [],
                    recommendations: [],
                    assessment: "",
                    keywordAnalysis: {},
                  });
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyzeNow;
