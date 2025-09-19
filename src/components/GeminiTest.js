import React, { useState } from "react";

const GeminiTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const testGeminiOnly = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Get CV and JD from localStorage (same as your main app)
      const cvText = localStorage.getItem("cvText");
      const jdText = localStorage.getItem("jdText");

      if (!cvText || !jdText) {
        throw new Error(
          "Please upload CV and Job Description first in the main app"
        );
      }

      console.log("🧪 Starting Gemini-only test...");

      const response = await fetch("/.netlify/functions/test-gemini-only", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText,
          jdText,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Test failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setResults(data);
      console.log("✅ Gemini test results:", data);
    } catch (err) {
      setError(err.message);
      console.error("❌ Gemini test error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Gemini-Only Test
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        This test uses ONLY Gemini 1.5-flash to analyze your CV and job
        description. It will help us verify that Gemini is working and see the
        difference in analysis quality.
      </p>

      <button
        onClick={testGeminiOnly}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-medium ${
          isLoading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Testing Gemini..." : "Test Gemini Only"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Error:</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              ✅ Test Results - {results.modelUsed}
            </h4>
            <p className="text-sm text-green-700">
              Environment: Gemini API Key exists:{" "}
              {results.environment?.geminiApiKeyExists ? "Yes" : "No"}
            </p>
            <p className="text-sm text-green-700">
              API Key Preview: {results.environment?.apiKeyPreview}
            </p>
          </div>

          {results.tests && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="text-sm font-semibold text-blue-800 mb-2">
                  Keywords Found:
                </h5>
                <p className="text-sm text-blue-700">
                  {JSON.stringify(
                    results.tests.keywordExtraction.result,
                    null,
                    2
                  )}
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h5 className="text-sm font-semibold text-purple-800 mb-2">
                  Experience Analysis:
                </h5>
                <p className="text-sm text-purple-700">
                  {JSON.stringify(
                    results.tests.experienceAnalysis.result,
                    null,
                    2
                  )}
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                <h5 className="text-sm font-semibold text-orange-800 mb-2">
                  Content Quality:
                </h5>
                <p className="text-sm text-orange-700">
                  {JSON.stringify(results.tests.contentQuality.result, null, 2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiTest;
