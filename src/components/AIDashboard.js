import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  getUserJobLeads,
  updateUserJobLeadFolder,
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
        <div className="mb-6">
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
                    event.dataTransfer.setData("text/plain", lead.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingLeadId(lead.id);
                    setMoveError("");
                  }}
                  onDragEnd={() => {
                    setDraggingLeadId(null);
                    setDropFolderId(null);
                  }}
                  className={`relative bg-gray-50 border border-gray-200 rounded-lg p-4 pr-12 cursor-grab hover:shadow-md transition-shadow ${
                    draggingLeadId === lead.id ? "opacity-60" : ""
                  }`}
                >
                  {nextFolderId && (
                    <button
                      type="button"
                      title="Move to next stage"
                      aria-label="Move to next stage"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDropOnFolder(nextFolderId, lead.id);
                      }}
                      className="group absolute top-3 right-3 text-indigo-600 hover:text-indigo-800"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                        Move to next stage
                      </span>
                    </button>
                  )}
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
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIDashboard;
