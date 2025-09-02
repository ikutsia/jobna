import React from "react";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Privacy Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  At Jobna AI ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered job search platform and services.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      2.1 Personal Information
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      We collect personal information that you provide directly to us, including:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                      <li>Name, email address, and contact information</li>
                      <li>Professional information (job title, experience, skills)</li>
                      <li>Resume/CV content and job preferences</li>
                      <li>Account credentials and profile information</li>
                      <li>Communication preferences and feedback</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      2.2 Usage Information
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      We automatically collect certain information about your use of our services:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                      <li>Log data (IP address, browser type, access times)</li>
                      <li>Device information and identifiers</li>
                      <li>Usage patterns and feature interactions</li>
                      <li>Performance data and error reports</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      2.3 AI Analysis Data
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      To provide AI-powered job matching and recommendations, we collect:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                      <li>Resume content for AI analysis and optimization</li>
                      <li>Job description data for matching algorithms</li>
                      <li>Application history and success metrics</li>
                      <li>Feedback on AI recommendations and suggestions</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    We use the collected information for the following purposes:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Provide and maintain our AI-powered job search services</li>
                    <li>Analyze resumes and provide optimization recommendations</li>
                    <li>Match job seekers with relevant opportunities</li>
                    <li>Improve our AI algorithms and service quality</li>
                    <li>Send important updates and service notifications</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Ensure platform security and prevent fraud</li>
                    <li>Comply with legal obligations and enforce our terms</li>
                  </ul>
                </div>
              </section>

              {/* AI and Machine Learning */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. AI and Machine Learning
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    Our platform uses artificial intelligence and machine learning to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Analyze resume content and identify key skills and experiences</li>
                    <li>Match candidates with job opportunities based on compatibility</li>
                    <li>Provide personalized career recommendations and insights</li>
                    <li>Optimize resume content for better ATS compatibility</li>
                    <li>Improve our matching algorithms over time</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    Your data helps train and improve our AI models to provide better services for all users. We implement appropriate safeguards to protect your privacy during AI processing.
                  </p>
                </div>
              </section>

              {/* Information Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Information Sharing and Disclosure
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our platform</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    <li><strong>Consent:</strong> When you explicitly authorize us to share specific information</li>
                    <li><strong>Aggregated Data:</strong> Statistical information that cannot identify individual users</li>
                  </ul>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Data Security
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    We implement comprehensive security measures to protect your information:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure authentication and access controls</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Employee training on data protection practices</li>
                    <li>Incident response procedures and monitoring</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but commit to maintaining industry-standard protections.
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Data Retention
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. We may retain certain information for longer periods when required by law or for legitimate business purposes. You may request deletion of your account and associated data at any time.
                </p>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Your Privacy Rights
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    Depending on your location, you may have the following rights:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of your personal information</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                    <li><strong>Portability:</strong> Receive your data in a portable format</li>
                    <li><strong>Restriction:</strong> Limit how we process your information</li>
                    <li><strong>Objection:</strong> Object to certain processing activities</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    To exercise these rights, please contact us using the information provided below.
                  </p>
                </div>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Cookies and Tracking Technologies
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    We use cookies and similar technologies to enhance your experience:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our services</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Security Cookies:</strong> Help protect against fraud and security threats</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    You can control cookie settings through your browser preferences, though disabling certain cookies may affect service functionality.
                  </p>
                </div>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Third-Party Services
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Our platform may integrate with third-party services and websites. We are not responsible for the privacy practices of these external services. We encourage you to review their privacy policies before providing any personal information.
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  11. Children's Privacy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected such information, we will take steps to delete it promptly.
                </p>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  12. International Data Transfers
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  13. Changes to This Privacy Policy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  14. Contact Us
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> privacy@jobna.ai<br />
                    <strong>Address:</strong> [Your Company Address]<br />
                    <strong>Phone:</strong> [Your Phone Number]<br />
                    <strong>Data Protection Officer:</strong> dpo@jobna.ai
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

export default PrivacyPolicy;
