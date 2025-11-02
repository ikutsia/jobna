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
    url: "https://api.reliefweb.int/v1/jobs?appname=jobna&limit=50",
    enabled: true,
  },
  unjobs: {
    type: "rss",
    url: "https://www.unjobnet.org/feed",
    enabled: true,
  },
  impactpool: {
    type: "rss",
    url: "https://www.impactpool.org/feed",
    enabled: true,
  },
  idealist: {
    type: "rss",
    url: "https://www.idealist.org/en/jobs.rss",
    enabled: true,
  },
  eurobrussels: {
    type: "rss",
    url: "https://www.eurobrussels.com/rss/all_jobs.xml",
    enabled: true,
  },
};

/**
 * Generate a unique ID for a job based on source and sourceId
 */
function generateJobId(source, sourceId) {
  return `${source}_${sourceId}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Normalize ReliefWeb JSON data to common format
 */
async function fetchReliefWebJobs() {
  try {
    const response = await axios.get(FEED_SOURCES.reliefweb.url, {
      timeout: 10000,
    });
    const jobs = [];

    if (response.data && response.data.data) {
      response.data.data.forEach((item) => {
        const job = {
          id: generateJobId("reliefweb", item.id),
          title: item.fields?.title || "No title",
          organization:
            item.fields?.source?.[0]?.name ||
            item.fields?.source?.name ||
            "Unknown",
          location:
            item.fields?.country?.map((c) => c.name).join(", ") ||
            item.fields?.location?.[0]?.name ||
            "Location not specified",
          link: item.fields?.url || item.fields?.url_alias || "",
          description: item.fields?.body || item.fields?.description || "",
          datePosted: item.fields?.date?.created || new Date().toISOString(),
          dateAdded: new Date().toISOString(),
          source: "reliefweb",
          sourceId: item.id.toString(),
          tags: item.fields?.theme?.map((t) => t.name) || [],
          salary: item.fields?.salary || "",
        };

        if (job.link && job.title) {
          jobs.push(job);
        }
      });
    }

    console.log(`✅ ReliefWeb: Fetched ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error("❌ ReliefWeb fetch error:", error.message);
    return [];
  }
}

/**
 * Normalize RSS feed data to common format
 */
async function fetchRSSJobs(sourceName, feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    const jobs = [];

    if (feed.items && feed.items.length > 0) {
      feed.items.forEach((item, index) => {
        // Extract location from description or content
        let location = "Location not specified";
        if (item.contentSnippet || item.content) {
          const content = item.contentSnippet || item.content;
          const locationMatch = content.match(/location:?\s*([^<,\n]+)/i);
          if (locationMatch) {
            location = locationMatch[1].trim();
          }
        }

        // Extract organization
        let organization = item.creator || item.author || "Unknown";
        if (item.contentSnippet || item.content) {
          const orgMatch = (item.contentSnippet || item.content).match(
            /organization:?\s*([^<,\n]+)/i
          );
          if (orgMatch) {
            organization = orgMatch[1].trim();
          }
        }

        const job = {
          id: generateJobId(sourceName, item.guid || item.link || index),
          title: item.title || "No title",
          organization: organization,
          location: location,
          link: item.link || "",
          description:
            item.contentSnippet || item.content || item.summary || "",
          datePosted: item.pubDate || item.isoDate || new Date().toISOString(),
          dateAdded: new Date().toISOString(),
          source: sourceName,
          sourceId: item.guid || item.link || index.toString(),
          tags: item.categories || [],
          salary: "",
        };

        if (job.link && job.title) {
          jobs.push(job);
        }
      });
    }

    console.log(`✅ ${sourceName}: Fetched ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error(`❌ ${sourceName} fetch error:`, error.message);
    return [];
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

    // Fetch from ReliefWeb (JSON API)
    if (FEED_SOURCES.reliefweb.enabled) {
      const reliefwebJobs = await fetchReliefWebJobs();
      allJobs.push(...reliefwebJobs);
      results.reliefweb = reliefwebJobs.length;
    }

    // Fetch from RSS feeds
    for (const [sourceName, config] of Object.entries(FEED_SOURCES)) {
      if (sourceName === "reliefweb") continue; // Already handled

      if (config.enabled && config.type === "rss") {
        const rssJobs = await fetchRSSJobs(sourceName, config.url);
        allJobs.push(...rssJobs);
        results[sourceName] = rssJobs.length;
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
