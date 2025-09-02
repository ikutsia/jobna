import React from "react";
import { Link } from "react-router-dom";

function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/signup"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
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
            Back to Sign Up
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Welcome to Jobna AI ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website, mobile applications, and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                </p>
              </section>

              {/* Service Description */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Service Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Jobna AI provides AI-powered job search assistance, including CV analysis, job description matching, application optimization, and career guidance. Our platform uses artificial intelligence to help users improve their job search effectiveness and increase their chances of being hired.
                </p>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. User Accounts
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    To access certain features of our Service, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </div>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Acceptable Use
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    You agree not to use our Service to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Upload malicious content or attempt to compromise security</li>
                    <li>Impersonate others or provide false information</li>
                    <li>Interfere with the Service's operation</li>
                    <li>Use automated systems to access the Service</li>
                  </ul>
                </div>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Privacy and Data Protection
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy. By using our Service, you consent to our collection and use of information as described in our Privacy Policy.
                </p>
              </section>

              {/* AI and Content */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. AI-Generated Content and Recommendations
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    Our Service uses artificial intelligence to provide recommendations and analysis. You acknowledge that:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>AI recommendations are suggestions and not guaranteed outcomes</li>
                    <li>You remain responsible for your job applications and career decisions</li>
                    <li>We are not liable for employment outcomes or hiring decisions</li>
                    <li>AI analysis is based on available data and may not be comprehensive</li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Intellectual Property
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  The Service and its original content, features, and functionality are owned by Jobna AI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </section>

              {/* User Content */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. User Content
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    You retain ownership of content you submit to our Service. By submitting content, you grant us a worldwide, non-exclusive license to use, modify, and display your content for the purpose of providing our Service.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    You represent that you have the right to grant this license and that your content does not violate any third-party rights.
                  </p>
                </div>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Disclaimers
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Warranties of merchantability and fitness for a particular purpose</li>
                    <li>Warranties that the Service will be uninterrupted or error-free</li>
                    <li>Warranties regarding the accuracy of AI recommendations</li>
                    <li>Warranties regarding employment outcomes or job offers</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  IN NO EVENT SHALL JOBNA AI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  11. Termination
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and access to the Service at any time, with or without cause, with or without notice. You may terminate your account at any time by contacting us.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  12. Changes to Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  13. Governing Law
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Jobna AI operates, without regard to its conflict of law provisions.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  14. Contact Information
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> legal@jobna.ai<br />
                    <strong>Address:</strong> [Your Company Address]<br />
                    <strong>Phone:</strong> [Your Phone Number]
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Accept & Continue to Sign Up
            </Link>
            <Link
              to="/"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
