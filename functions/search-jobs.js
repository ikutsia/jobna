const axios = require("axios");

const ADZUNA_SUPPORTED_COUNTRIES = [
  "au",
  "at",
  "be",
  "br",
  "ca",
  "fr",
  "de",
  "in",
  "it",
  "mx",
  "nl",
  "nz",
  "pl",
  "sg",
  "za",
  "es",
  "ch",
  "ae",
  "gb",
  "us",
];

const reliefwebAppName = process.env.RELIEFWEB_APPNAME || "jobna";

const ENV_ADZUNA_COUNTRY_LIST = process.env.ADZUNA_COUNTRY_LIST
  ? process.env.ADZUNA_COUNTRY_LIST.split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  : null;

const DEFAULT_ADZUNA_COUNTRY_LIST = ENV_ADZUNA_COUNTRY_LIST
  ? Array.from(
      new Set(
        ENV_ADZUNA_COUNTRY_LIST.filter((slug) =>
          ADZUNA_SUPPORTED_COUNTRIES.includes(slug)
        )
      )
    )
  : ADZUNA_SUPPORTED_COUNTRIES;

const FALLBACK_ADZUNA_COUNTRY =
  (process.env.ADZUNA_COUNTRY &&
    ADZUNA_SUPPORTED_COUNTRIES.includes(
      process.env.ADZUNA_COUNTRY.toLowerCase()
    ) &&
    process.env.ADZUNA_COUNTRY.toLowerCase()) ||
  "us";

function generateJobId(source, sourceId) {
  const cleanId = String(sourceId).replace(/[^a-zA-Z0-9_]/g, "_");
  return `${source}_${cleanId}`;
}

function normalizeAdzunaCountries(requested) {
  if (!requested || requested.length === 0) {
    return [FALLBACK_ADZUNA_COUNTRY];
  }

  const entries = requested
    .map((entry) => entry.toLowerCase())
    .filter(Boolean);

  if (entries.includes("all")) {
    return DEFAULT_ADZUNA_COUNTRY_LIST;
  }

  const filtered = entries.filter((slug) =>
    ADZUNA_SUPPORTED_COUNTRIES.includes(slug)
  );

  return filtered.length > 0 ? Array.from(new Set(filtered)) : [FALLBACK_ADZUNA_COUNTRY];
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
    organization:
      fields.source?.[0]?.name ||
      fields.source?.name ||
      "Unknown",
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
  const url = `https://api.reliefweb.int/v1/jobs?appname=${encodeURIComponent(
    reliefwebAppName
  )}`;

  const body = {
    limit: safeLimit,
    preset: "list",
    sort: [
      {
        field: "date.created",
        direction: "desc",
      },
    ],
  };

  if (searchTerm) {
    body.query = {
      value: searchTerm,
    };
  }

  const response = await axios.post(url, body);
  const entries = response.data?.data || [];
  return entries.map(mapReliefWebItem);
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
  const jobs = [];
  const errors = {};

  for (const country of countries) {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;

    try {
      const params = {
        app_id: appId,
        app_key: appKey,
        results_per_page: safeLimit,
      };

      if (searchTerm) {
        params.what = searchTerm;
      }

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent": "Jobna/1.0",
          Accept: "application/json",
        },
        params,
      });

      const results = response.data?.results || [];
      results.forEach((item) => {
        const jobId = item.id || item.adref || item.created || item.redirect_url;
        if (!jobId || !item.redirect_url || !item.title) {
          return;
        }
        jobs.push(mapAdzunaItem(item, country));
      });
    } catch (error) {
      console.error(`❌ Adzuna fetch error for ${country}:`, error.message);
      if (error.response) {
        errors[country] = `${error.response.status}`;
      } else {
        errors[country] = error.message;
      }
    }
  }

  return { jobs, errors };
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const searchTerm = (params.search || "").trim();
    const source = (params.source || "all").toLowerCase();
    const locationParam = (params.location || "all").toLowerCase();
    const limit = Math.max(1, Math.min(parseInt(params.limit, 10) || 50, 100));

    const includeReliefWeb = source === "all" || source === "reliefweb";
    const includeAdzuna = source === "all" || source === "adzuna";

    const requestedCountries =
      locationParam === "all" ? ["all"] : [locationParam];
    const normalizedCountries = normalizeAdzunaCountries(requestedCountries);

    const jobs = [];
    const bySource = {};
    const errors = {};

    if (includeReliefWeb) {
      try {
        const reliefwebJobs = await fetchReliefWeb(searchTerm, limit);
        jobs.push(...reliefwebJobs);
        bySource.reliefweb = reliefwebJobs.length;
      } catch (error) {
        console.error("ReliefWeb search error:", error.message);
        bySource.reliefweb = 0;
        errors.reliefweb = error.message;
      }
    }

    let adzunaCountriesUsed = [];

    if (includeAdzuna) {
      try {
        adzunaCountriesUsed = normalizedCountries;
        const { jobs: adzunaJobs, errors: adzunaErrors } = await fetchAdzuna(
          searchTerm,
          normalizedCountries,
          limit
        );
        jobs.push(...adzunaJobs);
        bySource.adzuna = adzunaJobs.length;
        if (Object.keys(adzunaErrors).length > 0) {
          errors.adzuna = Object.entries(adzunaErrors)
            .map(([country, message]) => `${country}: ${message}`)
            .join("; ");
        }
      } catch (error) {
        console.error("Adzuna search error:", error.message);
        bySource.adzuna = 0;
        errors.adzuna = error.message;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        total: jobs.length,
        jobs,
        bySource,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        adzunaCountriesUsed,
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
