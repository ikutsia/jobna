import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function AppShell({ children }) {
  const { user, loading, handleLogout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleDashboardClick = () => {
    if (loading) return;
    if (user) {
      navigate("/account");
    } else {
      navigate("/login");
    }
  };

  const handleSignOut = async () => {
    await handleLogout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-12 md:h-16">
            <Link to="/" className="shrink-0">
              <h1 className="text-lg md:text-2xl font-bold text-blue-600">
                jobna AI
              </h1>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        to="/account"
                        className="text-blue-600 hover:text-blue-700 font-semibold py-2 px-4 rounded transition-colors"
                      >
                        My Account
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold py-2 px-4 rounded transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleDashboardClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                      >
                        Your AI Job Dashboard
                      </button>
                      <span className="text-red-600 font-medium text-sm">
                        Start playing around by joining our Beta...
                      </span>
                      <span className="text-red-600 font-medium text-lg">
                        →
                      </span>
                      <Link
                        to="/signup"
                        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded transition-colors"
                      >
                        Sign Up
                      </Link>
                      <Link
                        to="/login"
                        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded transition-colors"
                      >
                        Log In
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-blue-600 hover:text-blue-700 focus:outline-none focus:text-blue-700"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link
                          to="/account"
                          className="block text-blue-600 hover:text-blue-700 font-semibold py-2 px-4 rounded transition-colors"
                        >
                          My Account
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="block w-full text-left border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-red-600 font-medium text-sm py-2 px-4">
                          Feature coming soon...
                        </div>
                        <button
                          type="button"
                          className="block w-full text-left bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mb-2"
                          onClick={handleDashboardClick}
                        >
                          Your AI Job Dashboard
                        </button>
                        <Link
                          to="/signup"
                          className="block border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded transition-colors mb-2"
                        >
                          Sign Up
                        </Link>
                        <Link
                          to="/login"
                          className="block border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          Log In
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-4">jobna AI</h3>
            <p className="text-gray-400 mb-6 text-sm md:text-base leading-relaxed">
              Empowering job seekers with AI-powered tools to land their dream
              jobs faster and more effectively.
            </p>
            <div className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed">
              <p>
                We love to receive your feedback about app improvements and
                desired features here!
              </p>
              <a
                href="mailto:jobna.ai.co@gmail.com"
                className="text-blue-400 hover:text-blue-300"
              >
                jobna.ai.co@gmail.com
              </a>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-6">
              <Link
                to="/terms-of-service"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
              >
                Terms of Service
              </Link>
              <span className="text-gray-400 text-sm hidden sm:inline">•</span>
              <Link
                to="/privacy-policy"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
              >
                Privacy Policy
              </Link>
              {user && (
                <>
                  <span className="text-gray-400 text-sm hidden sm:inline">
                    •
                  </span>
                  <Link
                    to="/account"
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                  >
                    My Account
                  </Link>
                </>
              )}
            </div>

            <div className="flex justify-center space-x-6">
              <button
                type="button"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
                aria-label="X (Twitter)"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                aria-label="YouTube"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
