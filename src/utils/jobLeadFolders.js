export const JOB_LEAD_FOLDERS = [
  { id: "job-leads", label: "Job leads" },
  { id: "applied", label: "Applied" },
  { id: "post-comm", label: "Post Comm" },
  { id: "not-a-match", label: "Not a match" },
  { id: "next-stage", label: "Next stage" },
];

export const DEFAULT_JOB_LEAD_FOLDER = "job-leads";

export const getLeadFolder = (lead) => {
  const folder = lead?.folder;
  if (JOB_LEAD_FOLDERS.some((item) => item.id === folder)) {
    return folder;
  }
  return DEFAULT_JOB_LEAD_FOLDER;
};

export const countLeadsInFolder = (leads, folderId) =>
  (leads || []).filter((lead) => getLeadFolder(lead) === folderId).length;

export const getNextFolderId = (folderId) => {
  const index = JOB_LEAD_FOLDERS.findIndex((folder) => folder.id === folderId);
  if (index === -1 || index >= JOB_LEAD_FOLDERS.length - 1) {
    return null;
  }
  return JOB_LEAD_FOLDERS[index + 1].id;
};
