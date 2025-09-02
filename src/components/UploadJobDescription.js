import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { analyzeJD, getRemainingCalls } from "../firebase/openai";
import { getCurrentUser } from "../firebase/auth";
import { extractTextFromFile, validateFile } from "../utils/textExtractor";

function UploadJobDescription() {
  const [fileData, setFileData] = useState({
    file: null,
    fileName: "",
    fileSize: "",
    isUploading: false,
    uploadProgress: 0,
  });

  const [analysisData, setAnalysisData] = useState({
    isAnalyzing: false,
    analysisComplete: false,
    analysisResults: null,
    error: null,
  });

  const [usageInfo, setUsageInfo] = useState({
    remainingCalls: 0,
    isLoading: true,
  });

  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file) {
      try {
        validateFile(file);

        setFileData({
          file: file,
          fileName: file.name,
          fileSize: (file.size / 1024 / 1024).toFixed(2) + " MB",
          isUploading: false,
          uploadProgress: 0,
        });

        // Clear file error
        if (errors.file) {
          setErrors((prev) => ({
            ...prev,
            file: "",
          }));
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          file: error.message,
        }));
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const removeFile = () => {
    setFileData({
      file: null,
      fileName: "",
      fileSize: "",
      isUploading: false,
      uploadProgress: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Reset analysis data when file is removed
    setAnalysisData({
      isAnalyzing: false,
      analysisComplete: false,
      analysisResults: null,
      error: null,
    });
    // Reset success message
    setUploadSuccess(false);
    // Clear localStorage when file is removed
    localStorage.removeItem("jdText");
    localStorage.removeItem("uploadedJD");
  };

  // Check user's remaining API calls
  const checkUsage = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        const remaining = await getRemainingCalls(user.uid);
        setUsageInfo({ remainingCalls: remaining, isLoading: false });
      }
    } catch (error) {
      console.error("Error checking usage:", error);
      setUsageInfo({ remainingCalls: 0, isLoading: false });
    }
  };

  // Analyze JD with OpenAI
  const handleAnalyze = async () => {
    if (!fileData.file) {
      setErrors((prev) => ({ ...prev, file: "Please select a file first" }));
      return;
    }

    try {
      setAnalysisData((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }));

      const user = getCurrentUser();
      if (!user) {
        throw new Error("Please log in to analyze your job description");
      }

      // Check usage limits
      if (usageInfo.remainingCalls <= 0) {
        throw new Error(
          "Monthly API call limit reached. Please upgrade or wait until next month."
        );
      }

      // Extract text from file
      const fileText = await extractTextFromFile(fileData.file);

      // Store JD text in localStorage for AnalyzeNow component
      localStorage.setItem("jdText", fileText);
      localStorage.setItem(
        "uploadedJD",
        JSON.stringify({
          name: fileData.fileName,
          size: fileData.fileSize,
          type: fileData.file.type,
        })
      );

      // Analyze with OpenAI
      const results = await analyzeJD(fileText, user.uid);

      setAnalysisData({
        isAnalyzing: false,
        analysisComplete: true,
        analysisResults: results,
        error: null,
      });

      // Update usage info
      await checkUsage();
    } catch (error) {
      console.error("JD Analysis error:", error);

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
        analysisResults: null,
        error: errorMessage,
      });
    }
  };

  // Load usage info on component mount
  React.useEffect(() => {
    checkUsage();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!fileData.file) {
      newErrors.file = "Please upload a job description file";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulateUpload = () => {
    setFileData((prev) => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    const interval = setInterval(() => {
      setFileData((prev) => {
        if (prev.uploadProgress >= 100) {
          clearInterval(interval);
          return { ...prev, isUploading: false };
        }
        return { ...prev, uploadProgress: prev.uploadProgress + 10 };
      });
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      simulateUpload();

      try {
        // Extract text from file and store in localStorage
        if (fileData.file) {
          const fileText = await extractTextFromFile(fileData.file);

          // Store JD text in localStorage for AnalyzeNow component
          localStorage.setItem("jdText", fileText);
          localStorage.setItem(
            "uploadedJD",
            JSON.stringify({
              name: fileData.fileName,
              size: fileData.fileSize,
              type: fileData.file.type,
            })
          );

          console.log(
            "Job description text extracted and stored:",
            fileText.substring(0, 100) + "..."
          );
        }

        // Simulate form submission
        setTimeout(() => {
          console.log("Job description uploaded:", fileData);
          setUploadSuccess(true);
          // Auto-hide success message after 5 seconds
          setTimeout(() => setUploadSuccess(false), 5000);
        }, 2500);
      } catch (error) {
        console.error("Error extracting job description text:", error);
        setErrors((prev) => ({
          ...prev,
          file: "Error processing file. Please try again.",
        }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
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
            Upload Job Description
          </h1>
          <p className="text-gray-600">
            Upload a job description to analyze requirements and optimize your
            application
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Job Description File
              </h2>

              {/* Success Message */}
              {uploadSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-400 mr-2"
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
                    <p className="text-sm text-green-800">
                      Job description uploaded successfully! You can now analyze
                      it or upload your CV.
                    </p>
                  </div>
                  <div className="mt-3">
                    <Link
                      to="/analyze-now"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded"
                    >
                      Go to Analysis Page
                    </Link>
                  </div>
                </div>
              )}

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-green-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!fileData.file ? (
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
                    <p className="text-lg text-gray-600 mb-2">
                      Drag and drop your job description here, or{" "}
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="text-green-600 hover:text-green-500 font-medium"
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, DOCX, TXT files (Max 5MB)
                    </p>
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
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {fileData.fileName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {fileData.fileSize}
                        </p>
                        {fileData.isUploading && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${fileData.uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Uploading... {fileData.uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {errors.file && (
                <p className="mt-2 text-sm text-red-600">{errors.file}</p>
              )}
            </div>

            {/* Usage Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    API Usage This Month
                  </h3>
                  <p className="text-sm text-blue-600">
                    {usageInfo.isLoading
                      ? "Loading..."
                      : `${usageInfo.remainingCalls} analyses remaining`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">Free Tier Limit</p>
                  <p className="text-sm font-medium text-blue-800">
                    50 calls/month
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Button */}
            {fileData.file && !analysisData.analysisComplete && (
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    analysisData.isAnalyzing || usageInfo.remainingCalls <= 0
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
                >
                  {analysisData.isAnalyzing
                    ? "Analyzing..."
                    : "Analyze JD with AI"}
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysisData.analysisComplete && analysisData.analysisResults && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  AI Analysis Results
                </h3>

                {/* Required Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.analysisResults.requiredSkills?.map(
                      (skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">
                    Experience Level Required
                  </h4>
                  <p className="text-sm text-blue-600">
                    {analysisData.analysisResults.experienceLevel}
                  </p>
                </div>

                {/* Responsibilities */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">
                    Key Responsibilities
                  </h4>
                  <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                    {analysisData.analysisResults.responsibilities?.map(
                      (responsibility, index) => (
                        <li key={index}>{responsibility}</li>
                      )
                    )}
                  </ul>
                </div>

                {/* Qualifications */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">
                    Qualifications Needed
                  </h4>
                  <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                    {analysisData.analysisResults.qualifications?.map(
                      (qualification, index) => (
                        <li key={index}>{qualification}</li>
                      )
                    )}
                  </ul>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-sm font-medium text-blue-700 mb-2">
                    Job Summary
                  </h4>
                  <p className="text-sm text-blue-600">
                    {analysisData.analysisResults.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {analysisData.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600">{analysisData.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={fileData.isUploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
              >
                {fileData.isUploading
                  ? "Uploading..."
                  : "Upload Job Description"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadJobDescription;
