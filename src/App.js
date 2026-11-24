import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import UploadCV from "./components/UploadCV";
import UploadJobDescription from "./components/UploadJobDescription";
import AnalyzeNow from "./components/AnalyzeNow";
import TermsOfService from "./components/TermsOfService";
import PrivacyPolicy from "./components/PrivacyPolicy";
import PersonalAccount from "./components/PersonalAccount";
import BrowseJobs from "./components/BrowseJobs";
import AIDashboard from "./components/AIDashboard";
import AppShell from "./components/AppShell";

function HomePage() {
  return (
    <section className="py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="mb-6 md:mb-8">
          <h1 className="inline-block max-w-full text-3xl md:text-5xl font-black text-gray-900 leading-tight transition-transform hover:scale-[1.02]">
            Tired of laboring with the job search and applying manually?
          </h1>
        </div>

        <div className="mb-6 md:mb-8">
          <h2 className="inline-block max-w-full text-xl md:text-3xl font-bold text-blue-600 leading-tight transition-transform hover:scale-[1.02]">
            Supercharge your job search, applications and monitoring using
            powerful AI tools built just for you!
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-6 md:mb-8">
          <Link
            to="/upload-cv"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            Upload CV
          </Link>
          <Link
            to="/upload-job-description"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            Upload job description
          </Link>
          <Link
            to="/analyze-now"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            Analyze now!
          </Link>
          <Link
            to="/browse-jobs"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            Browse Jobs
          </Link>
          <a
            href="https://chromewebstore.google.com/detail/jobna/ogdciaclgeoomemcfmfhjdonkmmhhaei"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base text-center"
          >
            Get Chrome Extension
          </a>
        </div>

        <p className="inline-block max-w-full text-lg md:text-xl text-orange-600 font-semibold leading-relaxed transition-transform hover:scale-[1.02]">
          Hack into the mind of the employer using AI and increase your odds of
          being noticed, interviewed and hired.
        </p>
      </div>
    </section>
  );
}

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/account" element={<PersonalAccount />} />
          <Route path="/upload-cv" element={<UploadCV />} />
          <Route
            path="/upload-job-description"
            element={<UploadJobDescription />}
          />
          <Route path="/analyze-now" element={<AnalyzeNow />} />
          <Route path="/browse-jobs" element={<BrowseJobs />} />
          <Route path="/ai-dashboard" element={<AIDashboard />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
