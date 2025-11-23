const fetch = require("node-fetch");

// TIMEOUT
const API_TIMEOUT = 8000;

// ReliefWeb app name
const reliefwebAppName = process.env.RELIEFWEB_APPNAME || "jobna";

/* ---------------------- Timeout Wrapper ---------------------- */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

/* ---------------------- Mapping Helper ----------------------- */
function generateJobId(source, sourceId) {
  const clean = String(sourceId).replace(/[^a-zA-Z0-9_]/g, "_");
  return `${source}_${clean}`;
}

function mapReliefWebItem(item) {
  const f = item.fields || {};
  const loc =
    (f.country?.map((c) => c.name).filter(Boolean) || []).join(", ") ||
    f.location?.[0]?.name ||
    "Location not specified";

  return {
    id: generateJobId("reliefweb", item.id),
    title: f.title || "No title",
    organization: f.source?.[0]?.name || "Unknown",
    location: loc,
    link: f.url || "",
    description: f.summary || "",
    datePosted: f.date?.created || new Date().toISOString(),
    dateAdded: new Date().toISOString(),
    source: "reliefweb",
    sourceId: String(item.id),
    tags: f.theme?.map((t) => t.name) || [],
    salary: "",
  };
}

/* =========================================================
   🔥 MAIN HANDLER
========================================================= */
exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const searchTerm = (params.search || params.q || "").trim();
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.max(1, Math.min(parseInt(params.limit) || 30, 100));

    const url = "https://api.reliefweb.int/v1/jobs";

    /* ------------------------- Request Body ------------------------- */
    const payload = {
      appname: reliefwebAppName,
      limit,
      offset: (page - 1) * limit,
      sort: ["date.created:desc"],
      // Minimal fields for fast response
      fields: {
        include: [
          "title",
          "source",
          "country",
          "url",
          "date",
          "theme",
          "summary",
          "location",
        ],
      },
    };

    /* Optional query: If ReliefWeb rejects search, we still load jobs */
    if (searchTerm) {
      payload.query = {
        // ReliefWeb supports simple text query
        value: searchTerm,
      };
    }

    /* ---------------------- LOG EXACT REQUEST ---------------------- */
    console.log("➡️ ReliefWeb REQUEST:", JSON.stringify(payload, null, 2));

    /* ---------------------- MAKE REQUEST ---------------------------- */
    const reliefResponse = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      API_TIMEOUT
    );

    console.log("📩 ReliefWeb RESPONSE STATUS:", reliefResponse.status);

    if (!reliefResponse.ok) {
      let errorText = "";
      try {
        errorText = await reliefResponse.text();
        console.error("❌ RW error body:", errorText);
      } catch (_) {}

      throw new Error(
        `ReliefWeb HTTP ${reliefResponse.status}: ${errorText.slice(0, 500)}`
      );
    }

    /* ---------------------- PROCESS DATA ---------------------------- */
    const data = await reliefResponse.json();
    const items = data.data || [];

    console.log(`📦 ReliefWeb returned ${items.length} items`);

    let jobs = items.map(mapReliefWebItem);

    // Local filtering fallback
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term)
      );
    }

    jobs.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));

    console.log(`✅ Returning ${jobs.length} jobs`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        jobs,
        pagination: {
          page,
          limit,
          total: jobs.length,
          returned: jobs.length,
          hasMore: items.length === limit,
        },
        source: "reliefweb",
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Handler error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
