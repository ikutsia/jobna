import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../firebase/auth";

function JobFeed() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    source: "all",
    search: "",
    categories: "",
    sortBy: "datePosted",
    sortOrder: "desc",
  });
  const [stats, setStats] = useState({
    total: 0,
    returned: 0,
  });

  // Fetch jobs from API - memoized with useCallback
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(filters.source !== "all" && { source: filters.source }),
        ...(filters.search && { search: filters.search }),
        ...(filters.categories && { categories: filters.categories }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      console.log(
        `🔍 Fetching jobs: /.netlify/functions/get-jobs?${params.toString()}`
      );

      const response = await fetch(
        `/.netlify/functions/get-jobs?${params.toString()}`
      );

      console.log(`📦 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();

      console.log("📦 Response data:", {
        success: data.success,
        jobsCount: data.jobs?.length || 0,
        total: data.total,
        returned: data.returned,
      });

      if (data.success) {
        const fetchedJobs = data.jobs || [];
        setJobs(fetchedJobs);
        setStats({
          total: data.total || 0,
          returned: fetchedJobs.length,
        });

        console.log(`✅ Loaded ${fetchedJobs.length} jobs from API`);

        if (fetchedJobs.length === 0) {
          if (data.total > 0) {
            setError(
              "No jobs match your current filters. Try adjusting your search criteria."
            );
          } else {
            setError(
              "No jobs found. Click 'Sync Jobs' to fetch jobs from job sites."
            );
          }
        } else {
          setError(null); // Clear any previous errors
        }
      } else {
        throw new Error(data.error || "Failed to fetch jobs");
      }
    } catch (err) {
      console.error("Fetch jobs error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    filters.source,
    filters.search,
    filters.categories,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Fetch jobs on component mount and when filters change
  useEffect(() => {
    // Initial load
    fetchJobs();
  }, [fetchJobs]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search, fetchJobs]);

  // Handle manual sync (trigger sync-job-feeds)
  const handleSyncJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/.netlify/functions/sync-job-feeds", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync jobs");
      }

      const data = await response.json();
      console.log("Sync result:", data);

      // Show success message
      if (data.success && data.totalFetched > 0) {
        setError(null);
        // Wait a bit for Firestore to be ready, then refresh
        setTimeout(() => {
          fetchJobs();
        }, 3000);
      } else if (data.success && data.totalFetched === 0) {
        setError(
          "Sync completed but no new jobs found. Some feeds may be unavailable."
        );
        setTimeout(() => {
          fetchJobs();
        }, 2000);
      } else {
        setError(data.error || "Sync completed with errors");
        setTimeout(() => {
          fetchJobs();
        }, 2000);
      }
    } catch (err) {
      console.error("Sync error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Date not available";
    }
  };

  // Get source badge color
  const getSourceColor = (source) => {
    const colors = {
      reliefweb: "bg-blue-100 text-blue-800",
      unjobs: "bg-green-100 text-green-800",
      impactpool: "bg-purple-100 text-purple-800",
      idealist: "bg-orange-100 text-orange-800",
      eurobrussels: "bg-yellow-100 text-yellow-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  // Copy job description to localStorage for analysis
  const handleAnalyzeJob = (job) => {
    const user = getCurrentUser();
    if (!user) {
      alert("Please log in to analyze this job");
      return;
    }

    // Store job description in localStorage
    const jdText = `${job.title}\n\nOrganization: ${job.organization}\nLocation: ${job.location}\n\nDescription:\n${job.description}`;
    localStorage.setItem("jdText", jdText);

    // Redirect to analyze page
    window.location.href = "/analyze-now";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Job Feed Aggregator
              </h1>
              <p className="text-gray-600">
                Browse jobs from ReliefWeb, DevJobsIndo, and Adzuna
              </p>
            </div>
            <button
              onClick={handleSyncJobs}
              disabled={loading}
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Syncing..." : "🔄 Sync Jobs"}
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Jobs: </span>
                <span className="font-semibold text-gray-900">
                  {stats.total}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Showing: </span>
                <span className="font-semibold text-gray-900">
                  {stats.returned}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={filters.source}
                  onChange={(e) =>
                    setFilters({ ...filters, source: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="reliefweb">ReliefWeb</option>
                  <option value="devjobsindo">DevJobsIndo</option>
                  <option value="adzuna">Adzuna</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  placeholder="Search jobs..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <input
                  type="text"
                  value={filters.categories}
                  onChange={(e) =>
                    setFilters({ ...filters, categories: e.target.value })
                  }
                  placeholder="e.g., health, education"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated keywords
                </p>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="datePosted">Date Posted</option>
                  <option value="dateAdded">Date Added</option>
                  <option value="title">Title</option>
                  <option value="organization">Organization</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    setFilters({ ...filters, sortOrder: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading jobs...</p>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 mb-4">No jobs found.</p>
                <button
                  onClick={handleSyncJobs}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Sync Jobs to Get Started
                </button>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor(
                            job.source
                          )}`}
                        >
                          {job.source}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          {job.organization}
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(job.datePosted)}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {job.description?.substring(0, 300)}
                        {job.description?.length > 300 ? "..." : ""}
                      </p>

                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tags.slice(0, 5).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-colors"
                      >
                        View Original
                      </a>
                      <button
                        onClick={() => handleAnalyzeJob(job)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Analyze Match
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Link
            to="/"
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
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default JobFeed;
