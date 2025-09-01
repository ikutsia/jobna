import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";

function UploadJobDescription() {
  const [fileData, setFileData] = useState({
    file: null,
    fileName: "",
    fileSize: "",
    isUploading: false,
    uploadProgress: 0,
  });

  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
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
          file: "Please upload a PDF, DOC, DOCX, or TXT file",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          file: "File size must be less than 5MB",
        }));
        return;
      }

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
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      simulateUpload();

      // Simulate form submission
      setTimeout(() => {
        console.log("Job description uploaded:", fileData);
        alert("Job description uploaded successfully!");
      }, 2500);
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
            Upload a job description to analyze requirements and optimize your application
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Job Description File
              </h2>

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
                      Supports PDF, DOC, DOCX, TXT (Max 5MB)
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

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={fileData.isUploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
              >
                {fileData.isUploading ? "Uploading..." : "Upload Job Description"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadJobDescription;
