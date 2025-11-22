const fetch = require("node-fetch");

// TIMEOUTS
const API_TIMEOUT = 8000;

// LIMIT Adzuna markets to avoid rate limits
const MAX_ADZUNA_COUNTRIES = 2;

// Supported Adzuna markets
const ADZUNA_COUNTRIES = ["gb", "de", "us", "ca", "au"];

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

// ---------------- Retry wrapper (429 protection) ----------------
async function fetchWithRetry(url, retries = 2) {
  try {
    const res = await withTimeout(fetch(url), API_TIMEOUT);
    if (res.status === 429 && retries > 0) {
      console.log("⏳ Adzuna 429 — retrying...");
      await new Promise((r) => setTimeout(r, 300));
      return fetchWithRetry(url, retries - 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    throw err;
  }
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

function mapAdzunaItem(item, country) {
  const org = item.company?.display_name || "Unknown";
  const jobId = item.id || item.adref || item.redirect_url;

  return {
    id: generateJobId("adzuna", `${country}_${jobId}`),
    title: item.title || "No title",
    organization: org,
    location: item.location?.display_name || "",
    link: item.redirect_url || "",
    description: item.description || "",
    datePosted: item.created || new Date().toISOString(),
    dateAdded: new Date().toISOString(),
    source: "adzuna",
    sourceId: `${country}_${jobId}`,
    tags: item.tags || [],
    salary: "",
    countrySlug: country,
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
    const source = (params.source || "all").toLowerCase();
    const locationParam = (params.location || "").trim();
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.max(1, Math.min(parseInt(params.limit) || 50, 100));

    const includeRW = source === "all" || source === "reliefweb";
    const includeAdz = source === "all" || source === "adzuna";

    // Select Adzuna markets
    let adzunaCountries = [];
    if (includeAdz) {
      if (
        locationParam &&
        ADZUNA_COUNTRIES.includes(locationParam.toLowerCase())
      ) {
        adzunaCountries = [locationParam.toLowerCase()];
      } else {
        adzunaCountries = ADZUNA_COUNTRIES.slice(0, MAX_ADZUNA_COUNTRIES);
      }
    }

    const jobs = [];
    const errors = {};
    const bySource = {};

    // =========================================================
    // 🔵 ReliefWeb fetch
    // =========================================================
    async function reliefWebFetch() {
      if (!includeRW) return [];

      try {
        const url = "https://api.reliefweb.int/v1/jobs";

        const body = {
          appname: reliefwebAppName,
          limit,
          offset: (page - 1) * limit,
          sort: [{ field: "date.created", direction: "desc" }],
        };

        if (searchTerm) {
          body.query = { value: searchTerm, fields: ["title"] };
        }

        // -------- LOG EXACT REQUEST --------
        console.log("➡️ ReliefWeb REQUEST:", {
          url,
          method: "POST",
          body,
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
          throw new Error(`ReliefWeb HTTP ${response.status}`);
        }

        const data = await response.json();
        const items = data.data || [];

        console.log(`📦 ReliefWeb returned ${items.length} items`);

        return items.map(mapReliefWebItem);
      } catch (err) {
        console.error("❌ ReliefWeb error:", err.message);
        errors.reliefweb = err.message;
        return [];
      }
    }

    // =========================================================
    // 🟢 Adzuna fetch
    // =========================================================
    async function adzunaFetch(country) {
      if (!includeAdz) return [];

      try {
        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        if (!appId || !appKey) {
          throw new Error("Adzuna credentials not configured");
        }

        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;
        const params = new URLSearchParams({
          app_id: appId,
          app_key: appKey,
          results_per_page: limit,
          what: searchTerm || "jobs",
          sort_by: "date",
          content_type: "application/json",
        });

        const fullUrl = `${url}?${params.toString()}`;
        console.log(`➡️ Adzuna ${country} REQUEST:`, fullUrl);

        const data = await fetchWithRetry(fullUrl);

        const items = data.results || [];

        console.log(`📦 Adzuna ${country} returned ${items.length} items`);

        return items.map((item) => mapAdzunaItem(item, country));
      } catch (err) {
        console.error(`❌ Adzuna ${country} error:`, err.message);
        errors[`adzuna_${country}`] = err.message;
        return [];
      }
    }

    // =========================================================
    // 🚀 Execute fetches in parallel
    // =========================================================
    const fetchPromises = [];

    if (includeRW) {
      fetchPromises.push(reliefWebFetch());
    }

    if (includeAdz && adzunaCountries.length > 0) {
      for (const country of adzunaCountries) {
        fetchPromises.push(adzunaFetch(country));
      }
    }

    const results = await Promise.all(fetchPromises);

    // Flatten and combine results
    for (const result of results) {
      if (Array.isArray(result)) {
        jobs.push(...result);
      }
    }

    // Group by source for metadata
    for (const job of jobs) {
      if (!bySource[job.source]) {
        bySource[job.source] = [];
      }
      bySource[job.source].push(job);
    }

    // Sort by datePosted (newest first)
    jobs.sort((a, b) => {
      const dateA = new Date(a.datePosted || 0).getTime();
      const dateB = new Date(b.datePosted || 0).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    console.log(
      `✅ Returning ${paginatedJobs.length} jobs (page ${page}, total: ${jobs.length})`
    );

    const response = {
      success: true,
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        total: jobs.length,
        returned: paginatedJobs.length,
        hasMore: endIndex < jobs.length,
      },
      bySource: Object.keys(bySource).reduce((acc, source) => {
        acc[source] = bySource[source].length;
        return acc;
      }, {}),
      errors: Object.keys(errors).length > 0 ? errors : undefined,
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
      body: JSON.stringify(response),
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
