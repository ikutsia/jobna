import React, { useState } from "react";

const AIAnalysisToggle = ({ onToggle, isHybridEnabled }) => {
  const [isEnabled, setIsEnabled] = useState(isHybridEnabled);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onToggle(newState);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Analysis Mode
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  isEnabled ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  isEnabled ? "text-blue-700" : "text-gray-500"
                }`}
              >
                {isEnabled
                  ? "Hybrid AI (GPT-3.5 + Gemini 1.5)"
                  : "Traditional Analysis"}
              </span>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              {isEnabled
                ? "Advanced AI analysis using both OpenAI and Google Gemini for enhanced accuracy"
                : "Rule-based analysis with regex patterns and predefined logic"}
            </p>
          </div>
        </div>

        <div className="ml-4">
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {isEnabled && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Hybrid AI Benefits:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>GPT-3.5:</strong> Fast keyword extraction and basic
              analysis
            </li>
            <li>
              • <strong>Gemini 1.5:</strong> Advanced semantic understanding and
              context analysis
            </li>
            <li>
              • <strong>Parallel Processing:</strong> Faster overall analysis
              time
            </li>
            <li>
              • <strong>Enhanced Accuracy:</strong> Better understanding of
              complex requirements
            </li>
          </ul>
        </div>
      )}

      {!isEnabled && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Traditional Analysis:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Rule-based keyword matching with regex patterns</li>
            <li>• Predefined scoring algorithms</li>
            <li>• Fast and predictable results</li>
            <li>• Lower API costs</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisToggle;
