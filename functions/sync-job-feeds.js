const Parser = require("rss-parser");
const axios = require("axios");
const admin = require("firebase-admin");

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

// Feed sources configuration
const FEED_SOURCES = {
  reliefweb: {
    type: "json",
    url: "https://api.reliefweb.int/v1/jobs?appname=jobna&limit=100",
    enabled: true,
    maxJobs: 100, // Limit per sync
  },
  unjobs: {
    type: "rss",
    url: "https://unjobs.org/skills/rss",
    enabled: true,
    maxJobs: 50,
  },
  // Additional sources can be re-enabled once reliable feeds are confirmed
  impactpool: {
    type: "rss",
    url: "https://www.impactpool.org/feed",
    enabled: false, // Disabled - 404 error
    maxJobs: 50,
  },
  idealist: {
    type: "rss",
    url: "https://www.idealist.org/en/jobs.rss",
    enabled: false, // Disabled - 404 error
    maxJobs: 50,
  },
  eurobrussels: {
    type: "rss",
    url: "https://www.eurobrussels.com/rss/all_jobs.xml",
    enabled: false, // Disabled - 404 error
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

        const jobLink =
          item.link || (typeof item.guid === "string" ? item.guid : "");

        const job = {
          id: generateJobId(sourceName, item.guid || item.link || index),
          title: cleanedTitle || rawTitle || "No title",
          organization: organization || "Unknown",
          location: location || "Location not specified",
          link: jobLink,
          description:
            item.contentSnippet || item.content || item.summary || "",
          datePosted: item.pubDate || item.isoDate || new Date().toISOString(),
          dateAdded: new Date().toISOString(),
          source: sourceName,
          sourceId: item.guid || item.link || index.toString(),
          tags: Array.isArray(item.categories)
            ? item.categories.map((tag) => tag.trim()).filter(Boolean)
            : [],
          salary: "",
        };

        if (job.title && job.title !== "No title" && job.link) {
          jobs.push(job);
        } else {
          console.log(`⚠️ Skipping ${sourceName} job due to missing title or link`, {
            title: job.title,
            link: job.link,
          });
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

    // Fetch from RSS feeds
    for (const [sourceName, config] of Object.entries(FEED_SOURCES)) {
      if (sourceName === "reliefweb") continue; // Already handled

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
