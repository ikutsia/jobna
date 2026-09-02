import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "../firebase/auth";
import { auth } from "../firebase/config";
import {
  getUserProfile,
  getUserJobLeads,
  updateUserProfile,
} from "../firebase/firestore";

function PersonalAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updateMessage, setUpdateMessage] = useState("");
  const [jobLeads, setJobLeads] = useState([]);
  const [jobLeadsLoading, setJobLeadsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        const [profileResult, jobLeadsResult] = await Promise.all([
          getUserProfile(currentUser.uid),
          getUserJobLeads(currentUser.uid),
        ]);

        if (profileResult.success) {
          setUserProfile(profileResult.data);
          setEditForm(profileResult.data);
        }

        if (jobLeadsResult.success) {
          setJobLeads(jobLeadsResult.data);
        } else {
          console.error("Error fetching job leads:", jobLeadsResult.error);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setJobLeadsLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setUpdateMessage("");
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm(userProfile);
    setUpdateMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const result = await updateUserProfile(user.uid, editForm);
      if (result.success) {
        setUserProfile(editForm);
        setEditing(false);
        setUpdateMessage("Profile updated successfully!");
        setTimeout(() => setUpdateMessage(""), 3000);
      } else {
        setUpdateMessage("Error updating profile: " + result.error);
      }
    } catch (error) {
      setUpdateMessage("Error updating profile: " + error.message);
    }
  };

  const getLeadTitle = (lead) =>
    lead.title || lead.jobTitle || lead.position || "Untitled job lead";

  const getLeadCompany = (lead) =>
    lead.company || lead.companyName || lead.organization || "";

  const getLeadDescription = (lead) =>
    lead.description ||
    lead.jobDescription ||
    lead.fullDescription ||
    lead.summary ||
    "";

  const formatLeadDate = (value) => {
    if (!value) return "Unknown date";

    if (typeof value.toDate === "function") {
      return value.toDate().toLocaleDateString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "Unknown date"
      : parsed.toLocaleDateString();
  };

  const handleAnalyzeLead = (lead) => {
    const leadTitle = getLeadTitle(lead);
    const leadCompany = getLeadCompany(lead);
    const leadLocation = lead.location || lead.city || "";
    const leadDescription = getLeadDescription(lead);

    const jdText = [
      leadTitle && `Job Title: ${leadTitle}`,
      leadCompany && `Company: ${leadCompany}`,
      leadLocation && `Location: ${leadLocation}`,
      leadDescription && `Description:\n${leadDescription}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    localStorage.setItem("jdText", jdText);
    localStorage.setItem(
      "uploadedJD",
      JSON.stringify({
        fileName: `${leadTitle}.txt`,
        fileType: "Captured Job Lead",
        uploadedAt: new Date().toISOString(),
        source: lead.sourceUrl || lead.url || "Saved job lead",
      })
    );

    navigate("/analyze-now");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {userProfile?.firstName
                ? `${userProfile.firstName}'s Personal Account`
                : "Personal Account"}
            </h1>
            <p className="text-gray-600">
              Manage your profile and account settings
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Success/Error Message */}
        {updateMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              updateMessage.includes("successfully")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {updateMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Profile Information
                </h2>
                {!editing && (
                  <button
                    onClick={handleEdit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={editForm.firstName || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={editForm.lastName || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={editForm.jobTitle || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience
                      </label>
                      <select
                        name="experience"
                        value={editForm.experience || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select experience</option>
                        <option value="0-1">0-1 years</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={editForm.country || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year of Birth
                      </label>
                      <input
                        type="number"
                        name="yearOfBirth"
                        value={editForm.yearOfBirth || ""}
                        onChange={handleInputChange}
                        min="1950"
                        max="2010"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <p className="text-gray-900">
                        {userProfile?.firstName || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <p className="text-gray-900">
                        {userProfile?.lastName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <p className="text-gray-900">
                        {userProfile?.jobTitle || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience
                      </label>
                      <p className="text-gray-900">
                        {userProfile?.experience || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <p className="text-gray-900">
                        {userProfile?.country || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year of Birth
                      </label>
                      <p className="text-gray-900">
                        {userProfile?.yearOfBirth || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {userProfile?.createdAt
                        ? new Date(userProfile.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column - AI Dashboard and Quick Actions */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            {/* AI Dashboard */}
            <div className="bg-black rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-start gap-2 mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Your AI Dashboard
                </h3>
                <p className="text-red-400 text-sm ml-1">Coming soon!</p>
              </div>
              <div className="border-b border-gray-600 mb-6"></div>
              <div className="grid grid-cols-5 gap-0">
                <div className="text-center border-r border-gray-600 pr-4">
                  <div className="text-white font-medium text-sm mb-2">
                    Job leads
                  </div>
                  <div className="text-gray-300 text-xs">{jobLeads.length}</div>
                </div>
                <div className="text-center border-r border-gray-600 px-4">
                  <div className="text-white font-medium text-sm mb-2">
                    Applied
                  </div>
                  <div className="text-gray-300 text-xs">0</div>
                </div>
                <div className="text-center border-r border-gray-600 px-4">
                  <div className="text-white font-medium text-sm mb-2">
                    Post Comm
                  </div>
                  <div className="text-gray-300 text-xs">0</div>
                </div>
                <div className="text-center border-r border-gray-600 px-4">
                  <div className="text-white font-medium text-sm mb-2">
                    Not a match
                  </div>
                  <div className="text-gray-300 text-xs">0</div>
                </div>
                <div className="text-center pl-4">
                  <div className="text-white font-medium text-sm mb-2">
                    Next stage
                  </div>
                  <div className="text-gray-300 text-xs">0</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => navigate("/upload-cv")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Upload CV
              </button>
              <button
                onClick={() => navigate("/upload-job-description")}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Upload Job Description
              </button>
              <button
                onClick={() => navigate("/analyze-now")}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Analyze Now
              </button>
              <button
                onClick={() => navigate("/job-feed")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Browse Jobs
              </button>
            </div>

            {/* Saved Job Leads */}
            <div className="bg-gray-50 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Saved Job Leads
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Leads captured from the extension are saved here for quick
                    review and analysis.
                  </p>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {jobLeads.length} saved
                </span>
              </div>

              {jobLeadsLoading ? (
                <p className="text-gray-500">Loading saved job leads...</p>
              ) : jobLeads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-gray-600 font-medium">
                    No saved job leads yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Use the Chrome extension on a job posting to capture your
                    first lead.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobLeads.map((lead) => {
                    const leadTitle = getLeadTitle(lead);
                    const leadCompany = getLeadCompany(lead);
                    const leadDescription = getLeadDescription(lead);

                    return (
                      <div
                        key={lead.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {leadTitle}
                            </h4>
                            {leadCompany && (
                              <p className="text-sm font-medium text-indigo-600 mt-1">
                                {leadCompany}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Saved on {formatLeadDate(lead.createdAt)}
                            </p>
                            <p className="text-gray-700 mt-3 line-clamp-4 whitespace-pre-line">
                              {leadDescription || "No description available."}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[180px]">
                            <button
                              onClick={() => handleAnalyzeLead(lead)}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                              Analyze This Lead
                            </button>
                            {(lead.sourceUrl || lead.url) && (
                              <a
                                href={lead.sourceUrl || lead.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                              >
                                Open Source
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Account Status and Account Actions Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.emailVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.emailVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Created</span>
                  <span className="text-sm text-gray-900">
                    {user.metadata?.creationTime
                      ? new Date(
                          user.metadata.creationTime
                        ).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Sign In</span>
                  <span className="text-sm text-gray-900">
                    {user.metadata?.lastSignInTime
                      ? new Date(
                          user.metadata.lastSignInTime
                        ).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <p className="text-gray-500 text-sm">
                  Additional account actions will be available here in the
                  future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalAccount;
