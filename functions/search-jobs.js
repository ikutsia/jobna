const fetch = require("node-fetch");

// TIMEOUTS
const API_TIMEOUT = 8000;

// LIMIT Adzuna calls (429 happens above 2–3 req/sec)
const MAX_ADZUNA_COUNTRIES = 2;

// Valid Adzuna markets
const ADZUNA_COUNTRIES = ["gb", "de", "us", "ca", "au"];

const reliefwebAppName = process.env.RELIEFWEB_APPNAME || "jobna";

// ---- Timeout Wrapper ----
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

// ---- Retry Wrapper (for 429 throttling) ----
async function fetchWithRetry(url, retries = 2) {
  try {
    const res = await withTimeout(fetch(url), API_TIMEOUT);
    if (res.status === 429 && retries > 0) {
      await new Promise((r) => setTimeout(r, 300)); // wait 0.3s
      return fetchWithRetry(url, retries - 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    throw err;
  }
}

function generateJobId(source, sourceId) {
  const cleanId = String(sourceId).replace(/[^a-zA-Z0-9_]/g, "_");
  return `${source}_${cleanId}`;
}

function mapReliefWebItem(item) {
  const fields = item.fields || {};
  const location =
    (fields.country?.map((c) => c.name).filter(Boolean) || []).join(", ") ||
    fields.location?.[0]?.name ||
    fields.city?.[0] ||
    "Location not specified";

  return {
    id: generateJobId("reliefweb", item.id),
    title: fields.title || "No title",
    organization: fields.source?.[0]?.name || fields.source?.name || "Unknown",
    location,
    link: fields.url || fields.url_alias || "",
    description: fields.summary || fields.body || "",
    datePosted:
      fields.date?.created || fields.date?.posted || new Date().toISOString(),
    dateAdded: new Date().toISOString(),
    source: "reliefweb",
    sourceId: String(item.id),
    tags: fields.theme?.map((t) => t.name).filter(Boolean) || [],
    salary: "",
  };
}

function mapAdzunaItem(item, country) {
  const organization =
    item.company?.display_name || item.category?.label || "Unknown";
  const location = item.location?.display_name || "Location not specified";

  const tags = [];
  if (item.category?.label) {
    tags.push(item.category.label);
  }
  if (Array.isArray(item.tags)) {
    item.tags.forEach((tag) => {
      const trimmed = typeof tag === "string" ? tag.trim() : "";
      if (trimmed && !tags.includes(trimmed)) {
        tags.push(trimmed);
      }
    });
  }
  if (!tags.includes(country.toUpperCase())) {
    tags.push(country.toUpperCase());
  }

  const salary =
    item.salary_min && item.salary_max
      ? `${item.salary_min} - ${item.salary_max}`
      : item.salary_min
      ? `${item.salary_min}`
      : item.salary_max
      ? `${item.salary_max}`
      : "";

  const jobId = item.id || item.adref || item.created || item.redirect_url;

  return {
    id: generateJobId("adzuna", `${country}_${jobId}`),
    title: item.title || "No title",
    organization,
    location,
    link: item.redirect_url || "",
    description: item.description || "",
    datePosted: item.created || new Date().toISOString(),
    dateAdded: new Date().toISOString(),
    source: "adzuna",
    sourceId: `${country}_${jobId}`,
    tags,
    salary,
    countrySlug: country,
  };
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};

    // Support both 'q' and 'search' parameters (frontend uses 'search')
    const searchTerm = (params.search || params.q || "").trim();
    const source = (params.source || "all").toLowerCase();
    const locationParam = (params.location || "").trim();
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(params.limit, 10) || 50, 100));

    const includeReliefWeb = source === "all" || source === "reliefweb";
    const includeAdzuna = source === "all" || source === "adzuna";

    // Determine Adzuna countries to use
    let adzunaCountries = [];
    if (includeAdzuna) {
      if (locationParam && locationParam !== "all") {
        const requestedCountry = locationParam.toLowerCase();
        if (ADZUNA_COUNTRIES.includes(requestedCountry)) {
          adzunaCountries = [requestedCountry];
        } else {
          adzunaCountries = ADZUNA_COUNTRIES.slice(0, MAX_ADZUNA_COUNTRIES);
        }
      } else {
        adzunaCountries = ADZUNA_COUNTRIES.slice(0, MAX_ADZUNA_COUNTRIES);
      }
    }

    const jobs = [];
    const bySource = {};
    const errors = {};

    // --------------------------------------------
    // ReliefWeb Fetch (corrected query format)
    // --------------------------------------------
    const reliefWebFetch = async () => {
      if (!includeReliefWeb) return [];

      try {
        const url = "https://api.reliefweb.int/v1/jobs";

        const body = {
          appname: reliefwebAppName,
          query: searchTerm
            ? {
                value: searchTerm,
                fields: ["title"],
              }
            : undefined,
          limit: limit,
          offset: (page - 1) * limit,
          sort: [
            {
              field: "date.created",
              direction: "desc",
            },
          ],
        };

        // Remove query if no search term
        if (!body.query) {
          delete body.query;
        }

        const response = await withTimeout(
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
          API_TIMEOUT
        );

        if (!response.ok) {
          throw new Error(`ReliefWeb API error: ${response.status}`);
        }

        const data = await response.json();
        return (data?.data || []).map(mapReliefWebItem);
      } catch (err) {
        console.error("❌ ReliefWeb fetch error:", err.message);
        errors.reliefweb = err.message;
        return [];
      }
    };

    // --------------------------------------------
    // Adzuna Fetch (limited + throttling-safe)
    // --------------------------------------------
    const adzunaFetches = adzunaCountries.map(async (country) => {
      try {
        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        if (!appId || !appKey) {
          throw new Error("Adzuna credentials not configured");
        }

        const search = encodeURIComponent(searchTerm);
        const place = encodeURIComponent(
          locationParam && locationParam !== "all" ? locationParam : ""
        );

        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=${limit}&what=${search}&where=${place}`;

        const json = await fetchWithRetry(url);

        const results = json.results || [];
        return results
          .filter((item) => {
            const jobId =
              item.id || item.adref || item.created || item.redirect_url;
            return jobId && item.redirect_url && item.title;
          })
          .map((item) => mapAdzunaItem(item, country));
      } catch (err) {
        console.error(`❌ Adzuna fetch error for ${country}:`, err.message);
        errors[`adzuna_${country}`] = err.message;
        return [];
      }
    });

    // --------------------------------------------
    // Run all in parallel
    // --------------------------------------------
    const fetchPromises = [];
    if (includeReliefWeb) {
      fetchPromises.push(reliefWebFetch());
    }
    if (includeAdzuna && adzunaFetches.length > 0) {
      fetchPromises.push(...adzunaFetches);
    }

    const results = await Promise.allSettled(fetchPromises);

    // Process results
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const resultJobs = result.value;
        if (Array.isArray(resultJobs) && resultJobs.length > 0) {
          jobs.push(...resultJobs);

          // Count by source
          const sourceCounts = {};
          resultJobs.forEach((job) => {
            sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
          });

          Object.keys(sourceCounts).forEach((src) => {
            bySource[src] = (bySource[src] || 0) + sourceCounts[src];
          });
        }
      }
    });

    // Sort by date (newest first)
    jobs.sort((a, b) => {
      const dateA = new Date(a.datePosted || a.dateAdded || 0).getTime();
      const dateB = new Date(b.datePosted || b.dateAdded || 0).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedJobs = jobs.slice(offset, offset + limit);

    // Format errors for response
    const formattedErrors = Object.keys(errors).length > 0 ? errors : undefined;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        total: jobs.length,
        jobs: paginatedJobs,
        bySource,
        errors: formattedErrors,
        adzunaCountriesUsed: adzunaCountries,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (err) {
    console.error("❌ search-jobs error:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
