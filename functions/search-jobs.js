const fetch = require("node-fetch");

// TIMEOUTS
const API_TIMEOUT = 8000;

const reliefwebAppName = process.env.RELIEFWEB_APPNAME || "jobna";

// ---------------- Timeout wrapper ----------------
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

// ---------------- Mapping helpers ----------------
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

// =========================================================
// 🔥 MAIN HANDLER
// =========================================================
exports.handler = async (event) => {
  // Handle CORS preflight
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
    const limit = Math.max(1, Math.min(parseInt(params.limit) || 50, 100));

    // =========================================================
    // 🔵 ReliefWeb fetch
    // =========================================================
    const url = "https://api.reliefweb.int/v1/jobs";

    const body = {
      appname: reliefwebAppName,
      limit,
      offset: (page - 1) * limit,
      sort: ["date.created:desc"], // ReliefWeb expects array of strings in "field:order" format
    };

    // Build query for ReliefWeb API
    // TEMPORARY: Comment out query to test if basic request works first
    // If basic request works, we know query format is the issue
    // if (searchTerm) {
    //   body.query = {
    //     value: searchTerm,
    //   };
    // }

    // For now, fetch all jobs without search to test basic functionality
    // Search filtering can be done client-side until we fix the query format

    // -------- LOG EXACT REQUEST --------
    console.log("➡️ ReliefWeb REQUEST:", {
      url,
      method: "POST",
      body: JSON.stringify(body, null, 2),
    });

    const response = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      API_TIMEOUT
    );

    console.log("📩 ReliefWeb RESPONSE STATUS:", response.status);

    if (!response.ok) {
      // Get error details from response body BEFORE throwing
      let errorDetails = "";
      try {
        const errorText = await response.text();
        console.error("❌ ReliefWeb error response body:", errorText);
        errorDetails = errorText.substring(0, 500);
      } catch (e) {
        console.error("❌ Could not read error response:", e.message);
      }

      const errorMessage = errorDetails
        ? `ReliefWeb HTTP ${response.status}: ${errorDetails}`
        : `ReliefWeb HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const items = data.data || [];

    console.log(`📦 ReliefWeb returned ${items.length} items`);

    let jobs = items.map(mapReliefWebItem);

    // Client-side search filtering (temporary until we fix ReliefWeb query format)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      jobs = jobs.filter((job) => {
        const titleMatch = job.title?.toLowerCase().includes(searchLower);
        const descMatch = job.description?.toLowerCase().includes(searchLower);
        return titleMatch || descMatch;
      });
      console.log(
        `🔍 Filtered to ${jobs.length} jobs matching "${searchTerm}"`
      );
    }

    // Sort by datePosted (newest first) - already sorted by API, but ensure consistency
    jobs.sort((a, b) => {
      const dateA = new Date(a.datePosted || 0).getTime();
      const dateB = new Date(b.datePosted || 0).getTime();
      return dateB - dateA;
    });

    console.log(
      `✅ Returning ${jobs.length} jobs (page ${page}, limit: ${limit})`
    );

    const response_data = {
      success: true,
      jobs: jobs,
      pagination: {
        page,
        limit,
        total: jobs.length,
        returned: jobs.length,
        hasMore: items.length === limit, // If we got a full page, there might be more
      },
      source: "reliefweb",
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: JSON.stringify(response_data),
    };
  } catch (error) {
    console.error("❌ Search jobs error:", error);
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
