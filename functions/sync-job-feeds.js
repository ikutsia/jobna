const Parser = require("rss-parser");
const axios = require("axios");
const admin = require("firebase-admin");

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

const FALLBACK_ADZUNA_COUNTRY =
  (process.env.ADZUNA_COUNTRY &&
    ADZUNA_SUPPORTED_COUNTRIES.includes(
      process.env.ADZUNA_COUNTRY.toLowerCase()
    ) &&
    process.env.ADZUNA_COUNTRY.toLowerCase()) ||
  "us";

const ENV_ADZUNA_COUNTRY_LIST = process.env.ADZUNA_COUNTRY_LIST
  ? process.env.ADZUNA_COUNTRY_LIST.split(",")
      .map((c) => c.trim().toLowerCase())
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
  : [FALLBACK_ADZUNA_COUNTRY];

function parseAdzunaCountriesFromEvent(event) {
  const requested = [];

  if (event && event.httpMethod && event.body) {
    try {
      const body = JSON.parse(event.body);
      const value = body?.adzunaCountries;
      if (value) {
        if (Array.isArray(value)) {
          requested.push(
            ...value.map((item) =>
              typeof item === "string" ? item.trim() : ""
            )
          );
        } else if (typeof value === "string") {
          requested.push(
            ...value.split(",").map((item) => item.trim())
          );
        }
      }
    } catch (error) {
      console.error("Unable to parse Adzuna countries from body:", error);
    }
  }

  const qsValue = event?.queryStringParameters?.adzunaCountries;
  if (qsValue) {
    requested.push(...qsValue.split(",").map((item) => item.trim()));
  }

  return requested.filter(Boolean);
}

function normalizeAdzunaCountries(requested) {
  if (!requested || requested.length === 0) {
    return [FALLBACK_ADZUNA_COUNTRY];
  }

  const lower = requested.map((entry) => entry.toLowerCase());

  if (lower.includes("all")) {
    return DEFAULT_ADZUNA_COUNTRY_LIST;
  }

  const filtered = lower.filter((slug) =>
    ADZUNA_SUPPORTED_COUNTRIES.includes(slug)
  );

  return filtered.length > 0 ? Array.from(new Set(filtered)) : [FALLBACK_ADZUNA_COUNTRY];
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // For Netlify, parse service account key from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized with service account");
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Fallback: initialize with project ID only (read-only operations)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log("✅ Firebase Admin initialized with project ID");
    } else {
      // Last resort: try default credentials (may not work in Netlify)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log("✅ Firebase Admin initialized with default credentials");
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
    // Don't throw - allow function to continue but operations will fail
  }
}

// Initialize Firestore (will be undefined if admin not initialized)
let db;
try {
  db = admin.firestore();
} catch (error) {
  console.error("❌ Firestore initialization error:", error);
  db = null;
}

const parser = new Parser();

const reliefwebAppName = process.env.RELIEFWEB_APPNAME || "jobna";

// Feed sources configuration
const FEED_SOURCES = {
  reliefweb: {
    type: "json",
    url: `https://api.reliefweb.int/v1/jobs?appname=${encodeURIComponent(
      reliefwebAppName
    )}&limit=100`,
    enabled: true,
    maxJobs: 100, // Limit per sync
  },
  adzuna: {
    type: "json",
    enabled: true,
    maxJobs: 50,
    country: process.env.ADZUNA_COUNTRY || "us",
  },
  remoteok: {
    type: "rss",
    url: "https://remoteok.com/remote-jobs.rss",
    enabled: false,
    maxJobs: 50,
  },
  unjobs: {
    type: "rss",
    url: "https://unjobs.org/skills/rss",
    enabled: false,
    maxJobs: 50,
  },
};

// Global job limit - only keep most recent N jobs in database
const MAX_JOBS_IN_DB = 2000; // Keep last 2000 jobs

/**
 * Generate a unique ID for a job based on source and sourceId
 */
function generateJobId(source, sourceId) {
  const cleanId = String(sourceId).replace(/[^a-zA-Z0-9_]/g, "_");
  return `${source}_${cleanId}`;
}

/**
 * Normalize ReliefWeb JSON data to common format
 */
async function fetchReliefWebJobs() {
  try {
    console.log(`🔍 Fetching ReliefWeb from: ${FEED_SOURCES.reliefweb.url}`);
    const response = await axios.get(FEED_SOURCES.reliefweb.url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Jobna/1.0",
      },
    });

    console.log(`📦 ReliefWeb response status: ${response.status}`);
    console.log(
      `📦 ReliefWeb response data keys:`,
      Object.keys(response.data || {})
    );

    const jobs = [];

    if (response.data && response.data.data) {
      console.log(`📦 ReliefWeb items count: ${response.data.data.length}`);

      // Debug: log first item structure
      if (response.data.data.length > 0) {
        console.log(`📦 Sample item keys:`, Object.keys(response.data.data[0]));
        console.log(
          `📦 Sample item.fields keys:`,
          Object.keys(response.data.data[0].fields || {})
        );
        console.log(
          `📦 Sample item fields.url:`,
          response.data.data[0].fields?.url
        );
        console.log(
          `📦 Sample item fields.url_alias:`,
          response.data.data[0].fields?.url_alias
        );
        console.log(
          `📦 Sample item fields.title:`,
          response.data.data[0].fields?.title
        );
      }

      response.data.data.forEach((item) => {
        // ReliefWeb API structure: item.fields contains the actual data
        const fields = item.fields || {};

        // Build job URL - ReliefWeb uses specific URL pattern
        const jobId = item.id;
        const jobUrl =
          fields.url ||
          fields.url_alias ||
          `https://reliefweb.int/job/${jobId}`;

        const job = {
          id: generateJobId("reliefweb", jobId),
          title: fields.title || "No title",
          organization:
            fields.source?.[0]?.name ||
            fields.source?.name ||
            fields.source?.shortname ||
            "Unknown",
          location:
            fields.country?.map((c) => c.name || c).join(", ") ||
            fields.location?.[0]?.name ||
            fields.city?.[0] ||
            "Location not specified",
          link: jobUrl,
          description:
            fields.body || fields.description || fields.how_to_apply || "",
          datePosted:
            fields.date?.created ||
            fields.closing_date ||
            new Date().toISOString(),
          dateAdded: new Date().toISOString(),
          source: "reliefweb",
          sourceId: jobId.toString(),
          tags:
            fields.theme?.map((t) => t.name || t).filter(Boolean) ||
            fields.career_categories?.map((c) => c.name || c).filter(Boolean) ||
            [],
          salary: fields.salary || "",
        };

        // Relaxed validation - only require title
        if (job.title && job.title !== "No title") {
          jobs.push(job);
        } else {
          console.log(`⚠️ Skipping job with no title:`, jobId);
        }
      });
    } else {
      console.log(`⚠️ ReliefWeb: No data.data in response`);
      console.log(
        `📦 Response structure:`,
        JSON.stringify(response.data).substring(0, 500)
      );
    }

    // Limit jobs per source
    const maxJobs = FEED_SOURCES.reliefweb.maxJobs || 100;
    const limitedJobs = jobs.slice(0, maxJobs);

    console.log(
      `✅ ReliefWeb: Fetched ${jobs.length} jobs, returning ${limitedJobs.length} (limited)`
    );
    return limitedJobs;
  } catch (error) {
    console.error("❌ ReliefWeb fetch error:", error.message);
    console.error(
      "❌ ReliefWeb error details:",
      error.response?.status,
      error.response?.data
    );
    throw error; // Re-throw to be caught by handler
  }
}

/**
 * Normalize RSS feed data to common format
 */
async function fetchRSSJobs(sourceName, feedUrl) {
  try {
    console.log(`🔍 Fetching ${sourceName} RSS from: ${feedUrl}`);

    const response = await axios.get(feedUrl, {
      timeout: 15000,
      headers: {
        "User-Agent": "Jobna/1.0",
        Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
      },
      maxContentLength: 10 * 1024 * 1024, // 10 MB max
    });

    console.log(`📦 ${sourceName} response status: ${response.status}`);

    if (!response.data) {
      console.log(`⚠️ ${sourceName}: Response had no body`);
      return [];
    }

    const feed = await parser.parseString(response.data);

    console.log(
      `📦 ${sourceName} feed title: ${feed.title || "(no title)"}`
    );
    console.log(
      `📦 ${sourceName} feed items count: ${feed.items?.length || 0}`
    );

    const jobs = [];

    if (feed.items && feed.items.length > 0) {
      feed.items.forEach((item, index) => {
        const textSources = [item.contentSnippet, item.content, item.summary]
          .filter(Boolean)
          .map((text) => text.replace(/\s+/g, " "));

        // Extract location from available text
        let location = "Location not specified";
        for (const text of textSources) {
          const locationMatch = text.match(
            /(duty station|duty location|location)[:\-]?\s*([^<,\n]+)/i
          );
          if (locationMatch) {
            location = locationMatch[2].trim();
            break;
          }
        }

        // Extract organization from available text
        let organization = item.creator || item.author || "Unknown";
        for (const text of textSources) {
          const orgMatch = text.match(
            /(organization|agency|employer)[:\-]?\s*([^<,\n]+)/i
          );
          if (orgMatch) {
            organization = orgMatch[2].trim();
            break;
          }
        }

        let rawTitle = item.title || "No title";
        let cleanedTitle = rawTitle;

        let tags = Array.isArray(item.categories)
          ? item.categories.map((tag) => tag.trim()).filter(Boolean)
          : [];

        if (sourceName === "unjobs") {
          if (rawTitle.includes(":")) {
            const [possibleOrg, ...rest] = rawTitle.split(":");
            const remainder = rest.join(":").trim();
            if (possibleOrg && (!organization || organization === "Unknown")) {
              organization = possibleOrg.trim();
            }
            if (remainder) {
              cleanedTitle = remainder;
            }
          }

          if (cleanedTitle.includes(",")) {
            const parts = cleanedTitle.split(",");
            const possibleLocation = parts[parts.length - 1].trim();
            if (
              possibleLocation &&
              possibleLocation.length <= 80 &&
              location === "Location not specified"
            ) {
              location = possibleLocation;
              cleanedTitle =
                parts.slice(0, -1).join(",").trim() || cleanedTitle;
            }
          }

          if (location === "Location not specified") {
            const dutyMatch = textSources
              .join(" ")
              .match(/duty station[:\-]?\s*([^<,\n]+)/i);
            if (dutyMatch) {
              location = dutyMatch[1].trim();
            }
          }

          if (Array.isArray(item.categories) && item.categories.length > 0) {
            if (!organization || organization === "Unknown") {
              organization = item.categories[0].trim();
            }
            if (location === "Location not specified") {
              const lastCategory =
                item.categories[item.categories.length - 1].trim();
              if (lastCategory) {
                location = lastCategory;
              }
            }
          }
        }

        if (sourceName === "remoteok") {
          if (rawTitle.includes(":")) {
            const [possibleOrg, ...rest] = rawTitle.split(":");
            if (possibleOrg) {
              organization = possibleOrg.trim();
            }
            const remainder = rest.join(":").trim();
            if (remainder) {
              cleanedTitle = remainder;
            }
          }

          if (Array.isArray(item.tags) && item.tags.length > 0) {
            item.tags.forEach((tag) => {
              const trimmed = typeof tag === "string" ? tag.trim() : "";
              if (trimmed && !tags.includes(trimmed)) {
                tags.push(trimmed);
              }
            });
          }

          if (!location || location === "Location not specified") {
            location = "Remote";
          }
        }

        const job = {
          id: generateJobId(sourceName, item.guid || item.link || index),
          title: cleanedTitle || rawTitle || "No title",
          organization: organization || "Unknown",
          location: location || "Location not specified",
          link: item.link || (typeof item.guid === "string" ? item.guid : ""),
          description:
            item.contentSnippet || item.content || item.summary || "",
          datePosted: item.pubDate || item.isoDate || new Date().toISOString(),
          dateAdded: new Date().toISOString(),
          source: sourceName,
          sourceId: item.guid || item.link || index.toString(),
          tags,
          salary: "",
        };

        if (job.title && job.title !== "No title" && job.link) {
          jobs.push(job);
        } else {
          console.log(
            `⚠️ Skipping ${sourceName} job due to missing title or link`,
            {
              title: job.title,
              link: job.link,
            }
          );
        }
      });
    } else {
      console.log(`⚠️ ${sourceName}: No items in feed`);
    }

    const maxJobs = FEED_SOURCES[sourceName]?.maxJobs || 50;
    const limitedJobs = jobs.slice(0, maxJobs);

    console.log(
      `✅ ${sourceName}: Fetched ${jobs.length} jobs, returning ${limitedJobs.length} (limited)`
    );
    return limitedJobs;
  } catch (error) {
    console.error(`❌ ${sourceName} fetch error:`, error.message);
    if (error.response) {
      console.error(
        `❌ ${sourceName} response error:`,
        error.response.status,
        error.response.data?.slice?.(0, 200) || error.response.data
      );
    }
    console.error(`❌ ${sourceName} error details:`, error.stack);
    throw error; // Re-throw to be caught by handler
  }
}

async function fetchAdzunaJobs(countries) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "Adzuna credentials not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in environment variables."
    );
  }

  const slugs = countries && countries.length > 0 ? countries : [FALLBACK_ADZUNA_COUNTRY];
  const resultsPerCountry = FEED_SOURCES.adzuna?.maxJobs || 50;

  const jobs = [];
  const errors = {};

  for (const country of slugs) {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;
    try {
      console.log(
        `🔍 Fetching Adzuna from: ${url} (results_per_page=${resultsPerCountry})`
      );

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent": "Jobna/1.0",
          Accept: "application/json",
        },
        params: {
          app_id: appId,
          app_key: appKey,
          results_per_page: resultsPerCountry,
        },
      });

      const results = response.data?.results || [];
      console.log(`📦 Adzuna (${country}) results count: ${results.length}`);

      results.forEach((item) => {
        const jobId = item.id || item.adref || item.created || item.redirect_url;
        if (!jobId || !item.redirect_url || !item.title) {
          return;
        }

        const uniqueId = `${country}_${jobId}`;

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
            if (tag && !tags.includes(tag)) {
              tags.push(tag);
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

        jobs.push({
          id: generateJobId("adzuna", uniqueId),
          title: item.title,
          organization,
          location,
          link: item.redirect_url,
          description: item.description || "",
          datePosted: item.created || new Date().toISOString(),
          dateAdded: new Date().toISOString(),
          source: "adzuna",
          sourceId: uniqueId,
          tags,
          salary,
          countrySlug: country,
        });
      });
    } catch (error) {
      console.error(`❌ Adzuna fetch error for ${country}:`, error.message);
      if (error.response) {
        console.error(
          `❌ Adzuna error details (${country}):`,
          error.response.status,
          error.response.data
        );
        errors[country] = `${error.response.status}`;
      } else {
        errors[country] = error.message;
      }
    }
  }

  return { jobs, errors };
}

/**
 * Clean up old jobs - keep only most recent N jobs
 */
async function cleanupOldJobs() {
  try {
    const jobsRef = db.collection("jobs");
    const snapshot = await jobsRef
      .orderBy("dateAdded", "desc")
      .offset(MAX_JOBS_IN_DB)
      .get();

    if (snapshot.empty) {
      console.log("✅ No old jobs to clean up");
      return 0;
    }

    const batch = db.batch();
    let deleted = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleted++;
    });

    await batch.commit();
    console.log(`✅ Cleaned up ${deleted} old jobs`);
    return deleted;
  } catch (error) {
    console.error("Cleanup error:", error.message);
    return 0;
  }
}

/**
 * Store jobs in Firestore (update if exists, create if not)
 */
async function storeJobs(jobs) {
  const batch = db.batch();
  const jobsRef = db.collection("jobs");
  let stored = 0;
  let updated = 0;
  let skipped = 0;

  for (const job of jobs) {
    try {
      const docRef = jobsRef.doc(job.id);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        // Update existing job (but keep original dateAdded)
        const existing = docSnap.data();
        batch.set(
          docRef,
          {
            ...job,
            dateAdded: existing.dateAdded || job.dateAdded,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
        updated++;
      } else {
        // Create new job
        batch.set(docRef, job);
        stored++;
      }
    } catch (error) {
      console.error(`Error storing job ${job.id}:`, error.message);
      skipped++;
    }
  }

  try {
    await batch.commit();
    console.log(
      `✅ Stored: ${stored} new, ${updated} updated, ${skipped} skipped`
    );

    // Clean up old jobs after storing
    await cleanupOldJobs();

    return { stored, updated, skipped };
  } catch (error) {
    console.error("Batch commit error:", error.message);
    return { stored: 0, updated: 0, skipped: jobs.length };
  }
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  console.log("🚀 SYNC-JOB-FEEDS FUNCTION CALLED");

  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const allJobs = [];
    const results = {};
    const errors = {};

    const requestedAdzunaCountries = parseAdzunaCountriesFromEvent(event);
    const selectedAdzunaCountries = normalizeAdzunaCountries(
      requestedAdzunaCountries
    );
    console.log(
      "Adzuna countries selected:",
      selectedAdzunaCountries.join(", ")
    );

    // Fetch from ReliefWeb (JSON API)
    if (FEED_SOURCES.reliefweb.enabled) {
      try {
        const reliefwebJobs = await fetchReliefWebJobs();
        allJobs.push(...reliefwebJobs);
        results.reliefweb = reliefwebJobs.length;
      } catch (error) {
        console.error("ReliefWeb error:", error.message);
        errors.reliefweb = error.message;
        results.reliefweb = 0;
      }
    }

    // Fetch from Adzuna (JSON API)
    if (FEED_SOURCES.adzuna?.enabled) {
      try {
        const { jobs: adzunaJobs, errors: adzunaErrors } =
          await fetchAdzunaJobs(selectedAdzunaCountries);
        allJobs.push(...adzunaJobs);
        results.adzuna = adzunaJobs.length;
        if (Object.keys(adzunaErrors).length > 0) {
          errors.adzuna = Object.entries(adzunaErrors)
            .map(([country, message]) => `${country}: ${message}`)
            .join("; ");
        }
      } catch (error) {
        console.error("Adzuna error:", error.message);
        errors.adzuna = error.message;
        results.adzuna = 0;
      }
    }

    // Fetch from RSS feeds
    for (const [sourceName, config] of Object.entries(FEED_SOURCES)) {
      if (sourceName === "reliefweb" || sourceName === "adzuna") continue;

      if (config.enabled && config.type === "rss") {
        try {
          const rssJobs = await fetchRSSJobs(sourceName, config.url);
          allJobs.push(...rssJobs);
          results[sourceName] = rssJobs.length;
        } catch (error) {
          console.error(`${sourceName} error:`, error.message);
          errors[sourceName] = error.message;
          results[sourceName] = 0;
        }
      }
    }

    // Store all jobs in Firestore
    if (!db) {
      throw new Error(
        "Firestore not initialized. Check Firebase Admin configuration."
      );
    }
    const storageResults = await storeJobs(allJobs);

    const response = {
      success: true,
      totalFetched: allJobs.length,
      bySource: results,
      storage: storageResults,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      adzunaCountriesUsed: selectedAdzunaCountries,
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("❌ Sync error:", error);
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