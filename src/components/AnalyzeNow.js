import React, { useState } from "react";
import { Link } from "react-router-dom";

function AnalyzeNow() {
  const [analysisData, setAnalysisData] = useState({
    cvFile: null,
    jobDescriptionFile: null,
    isAnalyzing: false,
    analysisProgress: 0,
    analysisComplete: false,
  });

  const [analysisResults, setAnalysisResults] = useState({
    matchScore: 0,
    skillsMatch: [],
    missingSkills: [],
    recommendations: [],
    keywordAnalysis: {},
  });

  const [errors, setErrors] = useState({});

  const handleFileSelect = (file, type) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [type]: "Please upload a PDF, DOC, DOCX, or TXT file",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          [type]: "File size must be less than 5MB",
        }));
        return;
      }

      setAnalysisData((prev) => ({
        ...prev,
        [type]: {
          file: file,
          fileName: file.name,
          fileSize: (file.size / 1024 / 1024).toFixed(2) + " MB",
        },
      }));

      // Clear error
      if (errors[type]) {
        setErrors((prev) => ({
          ...prev,
          [type]: "",
        }));
      }
    }
  };

  const handleCVUpload = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file, "cvFile");
  };

  const handleJobDescriptionUpload = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file, "jobDescriptionFile");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!analysisData.cvFile) {
      newErrors.cvFile = "Please upload your CV/resume";
    }

    if (!analysisData.jobDescriptionFile) {
      newErrors.jobDescriptionFile = "Please upload a job description";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulateAnalysis = () => {
    setAnalysisData((prev) => ({ ...prev, isAnalyzing: true, analysisProgress: 0 }));

    const interval = setInterval(() => {
      setAnalysisData((prev) => {
        if (prev.analysisProgress >= 100) {
          clearInterval(interval);
          return { ...prev, isAnalyzing: false, analysisComplete: true };
        }
        return { ...prev, analysisProgress: prev.analysisProgress + 5 };
      });
    }, 200);
  };

  const generateMockResults = () => {
    const mockResults = {
      matchScore: Math.floor(Math.random() * 30) + 70, // 70-100
      skillsMatch: [
        "JavaScript", "React", "Node.js", "Python", "Git", "Agile"
      ],
      missingSkills: [
        "Docker", "Kubernetes", "AWS", "TypeScript"
      ],
      recommendations: [
        "Add Docker experience to your resume",
        "Include AWS cloud services in your skills section",
        "Highlight your TypeScript knowledge",
        "Add more quantifiable achievements",
        "Include relevant certifications"
      ],
      keywordAnalysis: {
        "JavaScript": { count: 8, importance: "High" },
        "React": { count: 6, importance: "High" },
        "Node.js": { count: 4, importance: "Medium" },
        "Python": { count: 3, importance: "Medium" },
        "Git": { count: 5, importance: "High" },
        "Agile": { count: 7, importance: "High" }
      }
    };
    setAnalysisResults(mockResults);
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (validateForm()) {
      simulateAnalysis();
      
      // Generate mock results after analysis completes
      setTimeout(() => {
        generateMockResults();
      }, 2500);
    }
  };

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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyze Your CV Against Job Description
          </h1>
          <p className="text-gray-600">
            Get detailed insights on how well your CV matches the job requirements
          </p>
        </div>

        {!analysisData.analysisComplete ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleAnalyze} className="space-y-8">
              {/* File Upload Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CV Upload */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Upload Your CV/Resume
                  </h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {!analysisData.cvFile ? (
                      <div>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-4"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-gray-600 mb-2">Upload your CV/resume</p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleCVUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-8 w-8 text-green-500 mr-3"
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {analysisData.cvFile.fileName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {analysisData.cvFile.fileSize}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAnalysisData(prev => ({ ...prev, cvFile: null }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.cvFile && (
                    <p className="mt-2 text-sm text-red-600">{errors.cvFile}</p>
                  )}
                </div>

                {/* Job Description Upload */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Upload Job Description
                  </h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {!analysisData.jobDescriptionFile ? (
                      <div>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-4"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-gray-600 mb-2">Upload job description</p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleJobDescriptionUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-8 w-8 text-green-500 mr-3"
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {analysisData.jobDescriptionFile.fileName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {analysisData.jobDescriptionFile.fileSize}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAnalysisData(prev => ({ ...prev, jobDescriptionFile: null }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.jobDescriptionFile && (
                    <p className="mt-2 text-sm text-red-600">{errors.jobDescriptionFile}</p>
                  )}
                </div>
              </div>

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

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={analysisData.isAnalyzing}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
                >
                  {analysisData.isAnalyzing ? "Analyzing..." : "Analyze Now"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            {/* Match Score */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
              
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(analysisResults.matchScore)} mb-4`}>
                  <span className={`text-4xl font-bold ${getScoreColor(analysisResults.matchScore)}`}>
                    {analysisResults.matchScore}%
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Match Score</h3>
                <p className="text-gray-600">
                  Your CV matches {analysisResults.matchScore}% of the job requirements
                </p>
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Matching Skills */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Matching Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.skillsMatch.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.missingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recommendations
              </h3>
              <ul className="space-y-3">
                {analysisResults.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Keyword Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Keyword Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysisResults.keywordAnalysis).map(([keyword, data]) => (
                  <div key={keyword} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{keyword}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        data.importance === "High" ? "bg-red-100 text-red-800" :
                        data.importance === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {data.importance}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Mentioned {data.count} times</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Analysis Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setAnalysisData({
                    cvFile: null,
                    jobDescriptionFile: null,
                    isAnalyzing: false,
                    analysisProgress: 0,
                    analysisComplete: false,
                  });
                  setAnalysisResults({
                    matchScore: 0,
                    skillsMatch: [],
                    missingSkills: [],
                    recommendations: [],
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
