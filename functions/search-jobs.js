const fetch = require("node-fetch");

// TIMEOUT for external APIs (in ms)
const API_TIMEOUT = 8000; // 8 seconds per API

// Limit countries to prevent 20+ parallel Adzuna calls
const MAX_COUNTRIES = 5;

// Adzuna supported locations (subset of all supported countries)
const ADZUNA_COUNTRIES = ["gb", "us", "ca", "de", "au", "nl", "fr", "in", "sg"];

const reliefwebAppName = process.env.RELIEFWEB_APPNAME || "jobna";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
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
    datePosted: fields.date?.created || new Date().toISOString(),
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

  const location =
    item.location?.display_name ||
    (Array.isArray(item.location?.area)
      ? item.location.area.join(", ")
      : "Location not specified");

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

async function fetchReliefWeb(searchTerm, limit) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const url = "https://api.reliefweb.int/v1/jobs";

  const body = {
    appname: reliefwebAppName,
    query: searchTerm
      ? [
          {
            field: "title",
            value: searchTerm,
            operator: "contains",
          },
        ]
      : undefined,
    limit: safeLimit,
    sort: [
      {
        field: "date.created",
        direction: "desc",
      },
    ],
  };

  // Remove undefined query if no search term
  if (!body.query) {
    delete body.query;
  }

  try {
    const response = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Jobna/1.0",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }),
      API_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`ReliefWeb API error: ${response.status}`);
    }

    const data = await response.json();
    const entries = data?.data || [];
    return entries.map(mapReliefWebItem);
  } catch (error) {
    console.error("❌ ReliefWeb fetch error:", error.message);
    throw error;
  }
}

async function fetchAdzuna(searchTerm, countries, limit) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "Adzuna credentials not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY."
    );
  }

  const safeLimit = Math.max(1, Math.min(limit, 50));

  // Limit countries to prevent timeout
  const countriesToUse = countries.slice(0, MAX_COUNTRIES);

  const errors = {};

  // Create parallel fetch promises for each country
  const adzunaFetches = countriesToUse.map((country) => {
    const encodedQuery = encodeURIComponent(searchTerm || "");
    const encodedLocation = encodeURIComponent(""); // Location filtering can be added later if needed

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=${safeLimit}&what=${encodedQuery}&where=${encodedLocation}`;

    return withTimeout(
      fetch(url, {
        headers: {
          "User-Agent": "Jobna/1.0",
          Accept: "application/json",
        },
      }),
      API_TIMEOUT
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Adzuna API error for ${country}: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        const results = json.results || [];
        return results
          .filter((item) => {
            const jobId =
              item.id || item.adref || item.created || item.redirect_url;
            return jobId && item.redirect_url && item.title;
          })
          .map((item) => mapAdzunaItem(item, country));
      })
      .catch((error) => {
        console.error(`❌ Adzuna fetch error for ${country}:`, error.message);
        errors[country] = error.message;
        return []; // Return empty array for failed countries
      });
  });

  // Wait for all country fetches to complete (parallel)
  const results = await Promise.all(adzunaFetches);

  // Flatten all results into a single array
  const jobs = results.flat();

  return { jobs, errors };
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const searchTerm = (params.search || params.q || "").trim();
    const source = (params.source || "all").toLowerCase();
    const locationParam = (params.location || "all").toLowerCase();
    const limit = Math.max(1, Math.min(parseInt(params.limit, 10) || 50, 100));
    const page = Math.max(1, parseInt(params.page, 10) || 1);

    const includeReliefWeb = source === "all" || source === "reliefweb";
    const includeAdzuna = source === "all" || source === "adzuna";

    // Determine countries to use for Adzuna
    let adzunaCountries = [];
    if (includeAdzuna) {
      if (locationParam === "all") {
        // Use default subset of countries (limited to MAX_COUNTRIES)
        adzunaCountries = ADZUNA_COUNTRIES.slice(0, MAX_COUNTRIES);
      } else {
        // Use specific country if it's in our supported list
        const requestedCountry = locationParam.toLowerCase();
        if (ADZUNA_COUNTRIES.includes(requestedCountry)) {
          adzunaCountries = [requestedCountry];
        } else {
          // Fallback to first supported country
          adzunaCountries = [ADZUNA_COUNTRIES[0]];
        }
      }
    }

    const jobs = [];
    const bySource = {};
    const errors = {};

    // Prepare parallel fetch promises
    const fetchPromises = [];

    if (includeReliefWeb) {
      fetchPromises.push(
        fetchReliefWeb(searchTerm, limit)
          .then((reliefwebJobs) => {
            jobs.push(...reliefwebJobs);
            bySource.reliefweb = reliefwebJobs.length;
          })
          .catch((error) => {
            console.error("ReliefWeb search error:", error.message);
            bySource.reliefweb = 0;
            errors.reliefweb = error.message;
          })
      );
    }

    if (includeAdzuna && adzunaCountries.length > 0) {
      fetchPromises.push(
        fetchAdzuna(searchTerm, adzunaCountries, limit)
          .then(({ jobs: adzunaJobs, errors: adzunaErrors }) => {
            jobs.push(...adzunaJobs);
            bySource.adzuna = adzunaJobs.length;
            if (Object.keys(adzunaErrors).length > 0) {
              errors.adzuna = Object.entries(adzunaErrors)
                .map(([country, message]) => `${country}: ${message}`)
                .join("; ");
            }
          })
          .catch((error) => {
            console.error("Adzuna search error:", error.message);
            bySource.adzuna = 0;
            errors.adzuna = error.message;
          })
      );
    }

    // Execute all fetches in parallel
    await Promise.allSettled(fetchPromises);

    // Sort jobs by date (newest first)
    jobs.sort((a, b) => {
      const dateA = new Date(a.datePosted || a.dateAdded || 0);
      const dateB = new Date(b.datePosted || b.dateAdded || 0);
      return dateB - dateA;
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedJobs = jobs.slice(offset, offset + limit);

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
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        adzunaCountriesUsed: adzunaCountries,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ search-jobs error:", error);
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
