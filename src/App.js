import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div>
              <h1 className="text-2xl font-bold text-blue-600">jobna</h1>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
                Your Dashboard
              </button>
              <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded">
                Sign Up
              </button>
              <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded">
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Main Call to Action */}
          <h1 className="text-5xl font-black text-gray-900 mb-8">
            Tired of laboring with the job search and applying manually?
          </h1>

          <h2 className="text-3xl font-bold text-blue-600 mb-8">
            Supercharge your job search, applications and monitoring using our
            powerful tools built just for you!
          </h2>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">
              Upload CV
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg">
              Upload job description
            </button>
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg">
              Analyze now!
            </button>
          </div>

          {/* Subtitle - moved below buttons */}
          <p className="text-xl text-orange-600 font-semibold">
            Hack into the mind of the employer using powerful AI tools and
            increase your odds of being noticed, interviewed and hired.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">jobna</h3>
            <p className="text-gray-400">
              Empowering job seekers with AI-powered tools to land their dream
              jobs faster and more effectively.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
