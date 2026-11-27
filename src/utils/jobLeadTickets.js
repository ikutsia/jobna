export const parseLeadTicketNumber = (value) => {
  if (value == null || value === "") return null;
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
};

export const getLeadTicketLabel = (lead) => {
  const ticketNumber = parseLeadTicketNumber(lead?.ticketNumber);
  return ticketNumber
    ? `JOB-${String(ticketNumber).padStart(3, "0")}`
    : null;
};
