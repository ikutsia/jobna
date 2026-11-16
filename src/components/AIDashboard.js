import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  getUserJobLeads,
  updateUserJobLeadFolder,
  deleteUserJobLead,
} from "../firebase/firestore";
import {
  JOB_LEAD_FOLDERS,
  countLeadsInFolder,
  getLeadFolder,
  getNextFolderId,
} from "../utils/jobLeadFolders";

function getLeadTitle(lead) {
  return lead.title || lead.jobTitle || lead.position || "Untitled job lead";
}

function getLeadCompany(lead) {
  return lead.company || lead.companyName || lead.organization || "";
}

function getLeadDescription(lead) {
  return (
    lead.description ||
    lead.jobDescription ||
    lead.fullDescription ||
    lead.summary ||
    ""
  );
}

function LeadTextToggle({ text }) {
  const [expanded, setExpanded] = useState(false);
  const description = text || "No description available.";

  return (
    <div className="mt-3">
      <button
        type="button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => setExpanded((open) => !open)}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        {expanded ? "Hide text" : "Show text"}
      </button>
      {expanded && (
        <p className="mt-3 text-gray-700 whitespace-pre-line">{description}</p>
      )}
    </div>
  );
}

function formatLeadDate(value) {
  if (!value) return "Unknown date";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Unknown date"
    : parsed.toLocaleDateString();
}

function AIDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobLeads, setJobLeads] = useState([]);
  const [activeFolder, setActiveFolder] = useState("job-leads");
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dropFolderId, setDropFolderId] = useState(null);
  const [moveError, setMoveError] = useState("");
  const [deletingLeadId, setDeletingLeadId] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        const result = await getUserJobLeads(currentUser.uid);
        if (result.success) {
          setJobLeads(result.data);
        } else {
          console.error("Error fetching job leads:", result.error);
        }
      } catch (error) {
        console.error("Error fetching job leads:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const folderLeads = jobLeads.filter(
    (lead) => getLeadFolder(lead) === activeFolder
  );

  const handleDropOnFolder = async (folderId, leadId) => {
    setDropFolderId(null);
    setDraggingLeadId(null);

    if (!leadId || !user?.uid) {
      return;
    }

    const lead = jobLeads.find((item) => item.id === leadId);
    if (!lead || getLeadFolder(lead) === folderId) {
      return;
    }

    const previousFolder = getLeadFolder(lead);
    setMoveError("");
    setJobLeads((prev) =>
      prev.map((item) =>
        item.id === leadId ? { ...item, folder: folderId } : item
      )
    );

    const result = await updateUserJobLeadFolder(user.uid, leadId, folderId);
    if (!result.success) {
      setJobLeads((prev) =>
        prev.map((item) =>
          item.id === leadId ? { ...item, folder: previousFolder } : item
        )
      );
      setMoveError("Could not move this job lead. Please try again.");
    }
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

  const handleDeleteLead = (lead) => {
    setDeleteError("");
    setLeadToDelete(lead);
  };

  const handleCancelDeleteLead = () => {
    if (deletingLeadId) return;
    setLeadToDelete(null);
    setDeleteError("");
  };

  const handleConfirmDeleteLead = async () => {
    if (!leadToDelete || !user?.uid) return;

    setDeletingLeadId(leadToDelete.id);
    setDeleteError("");
    try {
      const result = await deleteUserJobLead(user.uid, leadToDelete.id);
      if (result.success) {
        setJobLeads((prev) =>
          prev.filter((item) => item.id !== leadToDelete.id)
        );
        setLeadToDelete(null);
      } else {
        console.error("Error deleting job lead:", result.error);
        setDeleteError("Could not delete this job lead. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting job lead:", error);
      setDeleteError("Could not delete this job lead. Please try again.");
    } finally {
      setDeletingLeadId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
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
          <Link
            to="/account"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
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
            Back to My Account
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your AI Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Open a folder to see its job leads. Drag a card onto another folder to
          move it.
        </p>

        {moveError && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
            {moveError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {JOB_LEAD_FOLDERS.map((folder) => {
            const isActive = activeFolder === folder.id;
            const isDropTarget = dropFolderId === folder.id;
            const count = countLeadsInFolder(jobLeads, folder.id);

            return (
              <div
                key={folder.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveFolder(folder.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveFolder(folder.id);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropFolderId(folder.id);
                }}
                onDragLeave={() => {
                  setDropFolderId((current) =>
                    current === folder.id ? null : current
                  );
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const leadId =
                    event.dataTransfer.getData("text/plain") || draggingLeadId;
                  handleDropOnFolder(folder.id, leadId);
                }}
                className={`rounded-xl p-4 text-left border-2 transition-all cursor-pointer ${
                  isDropTarget
                    ? "border-indigo-500 bg-indigo-100 scale-[1.03]"
                    : isActive
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <svg
                    className={`w-10 h-10 ${
                      isActive ? "text-indigo-600" : "text-amber-500"
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">
                    {count}
                  </span>
                </div>
                <p className="font-semibold text-gray-900">{folder.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {JOB_LEAD_FOLDERS.find((folder) => folder.id === activeFolder)?.label}
          </h2>

          {folderLeads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-gray-600 font-medium">
                No job leads in this folder yet.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Drag a card from another folder onto this one to move it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {folderLeads.map((lead) => {
                const nextFolderId = getNextFolderId(getLeadFolder(lead));

                return (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(event) => {
                    if (event.target.closest("button, a")) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData("text/plain", lead.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingLeadId(lead.id);
                    setMoveError("");
                  }}
                  onDragEnd={() => {
                    setDraggingLeadId(null);
                    setDropFolderId(null);
                  }}
                  className={`group/card relative bg-gray-50 border border-gray-200 rounded-lg p-4 pr-20 cursor-grab hover:shadow-md transition-shadow ${
                    draggingLeadId === lead.id ? "opacity-60" : ""
                  }`}
                >
                  <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover/card:opacity-100 group-has-[:is(button,a):hover]/card:opacity-0">
                    Drag and drop into another folder
                  </span>
                  {nextFolderId && (
                    <button
                      type="button"
                      title="Move this lead to next folder"
                      aria-label="Move this lead to next folder"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDropOnFolder(nextFolderId, lead.id);
                      }}
                      className="group absolute top-3 right-3 text-indigo-600 hover:text-indigo-800"
                    >
                      <svg
                        className="w-8 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 32 20"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2 10h22"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 4l8 6-8 6"
                        />
                      </svg>
                      <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                        Move this lead to next folder
                      </span>
                    </button>
                  )}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getLeadTitle(lead)}
                      </h3>
                      {getLeadCompany(lead) && (
                        <p className="text-sm font-medium text-indigo-600 mt-1">
                          {getLeadCompany(lead)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Saved on {formatLeadDate(lead.createdAt)}
                      </p>
                      <LeadTextToggle text={getLeadDescription(lead)} />
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto lg:min-w-[140px] lg:mr-4">
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={() => handleAnalyzeLead(lead)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-1 px-3 rounded-lg transition-colors text-xs"
                      >
                        Analyze This Lead
                      </button>
                      {(lead.sourceUrl || lead.url) && (
                        <a
                          href={lead.sourceUrl || lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseDown={(event) => event.stopPropagation()}
                          className="border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold py-1 px-3 rounded-lg transition-colors text-center text-xs"
                        >
                          Open Source
                        </a>
                      )}
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={() => handleDeleteLead(lead)}
                        disabled={deletingLeadId === lead.id}
                        className="border border-red-300 text-red-700 hover:bg-red-50 font-semibold py-1 px-3 rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingLeadId === lead.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {leadToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleCancelDeleteLead}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-lead-title"
          >
            <h2
              id="delete-lead-title"
              className="text-xl font-semibold text-gray-900"
            >
              Delete this job lead?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              This will permanently remove it from your saved leads.
            </p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                {getLeadTitle(leadToDelete)}
              </p>
              {getLeadCompany(leadToDelete) && (
                <p className="text-sm font-medium text-indigo-600 mt-1">
                  {getLeadCompany(leadToDelete)}
                </p>
              )}
            </div>
            {deleteError && (
              <p className="text-sm text-red-600 mt-3">{deleteError}</p>
            )}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDeleteLead}
                disabled={Boolean(deletingLeadId)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLead}
                disabled={Boolean(deletingLeadId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingLeadId ? "Deleting..." : "Delete lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIDashboard;
