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

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  console.log("🚀 GET-JOBS FUNCTION CALLED");

  // Handle CORS
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
    if (!db) {
      throw new Error(
        "Firestore not initialized. Check Firebase Admin configuration."
      );
    }

    // Parse query parameters
    const params = new URLSearchParams(event.queryStringParameters || {});
    const limit = parseInt(params.get("limit") || "100");
    const source = params.get("source"); // Filter by source
    const search = params.get("search"); // Search in title/description
    const categories = params.get("categories"); // Comma-separated categories
    const sortBy = params.get("sortBy") || "datePosted"; // Sort field
    const sortOrder = params.get("sortOrder") || "desc"; // asc or desc

    console.log(
      `🔍 Query params: limit=${limit}, source=${source}, search=${search}`
    );

    let query = db.collection("jobs");

    // Apply source filter first
    if (source && source !== "all") {
      query = query.where("source", "==", source);
      console.log(`🔍 Filtering by source: ${source}`);
    }

    // Don't use orderBy if we have a source filter (needs composite index)
    // Just get jobs and sort in memory instead
    let snapshot;
    try {
      // Apply limit
      query = query.limit(limit);

      // Only try orderBy if no source filter (to avoid index requirement)
      if (!source || source === "all") {
        try {
          query = query.orderBy("datePosted", "desc");
          console.log("✅ Using orderBy datePosted");
        } catch (error) {
          console.log("⚠️ Could not orderBy:", error.message);
          console.log("⚠️ Getting jobs without orderBy, will sort in memory");
        }
      } else {
        console.log(
          "⚠️ Skipping orderBy (has source filter, will sort in memory)"
        );
      }

      snapshot = await query.get();
      console.log(`📦 Firestore returned ${snapshot.size} documents`);
    } catch (error) {
      console.error("❌ Query error:", error.message);
      // Fallback: try without orderBy
      query = db.collection("jobs").limit(limit);
      if (source && source !== "all") {
        query = query.where("source", "==", source);
      }
      snapshot = await query.get();
      console.log(`📦 Fallback query returned ${snapshot.size} documents`);
    }
    let jobs = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
      });
    });

    console.log(
      `📦 Retrieved ${jobs.length} jobs from Firestore (before filtering)`
    );

    // If no jobs but we have a limit, check if collection has any jobs at all
    if (jobs.length === 0 && limit > 0) {
      const testSnapshot = await db.collection("jobs").limit(1).get();
      console.log(
        `📦 Total jobs in collection: ${
          testSnapshot.size > 0 ? "Has jobs" : "Empty"
        }`
      );
    }

    // Apply search filter (client-side since Firestore text search is limited)
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter((job) => {
        const titleMatch = job.title?.toLowerCase().includes(searchLower);
        const descMatch = job.description?.toLowerCase().includes(searchLower);
        const orgMatch = job.organization?.toLowerCase().includes(searchLower);
        const locationMatch = job.location?.toLowerCase().includes(searchLower);
        const tagsMatch = job.tags?.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );
        return (
          titleMatch || descMatch || orgMatch || locationMatch || tagsMatch
        );
      });
    }

    // Apply category filter (filter by tags)
    if (categories) {
      const categoryList = categories
        .split(",")
        .map((c) => c.trim().toLowerCase());
      jobs = jobs.filter((job) => {
        if (!job.tags || job.tags.length === 0) return false;
        return job.tags.some((tag) =>
          categoryList.some((cat) => tag.toLowerCase().includes(cat))
        );
      });
    }

    // Sort jobs in memory (since Firestore ordering may not work)
    jobs.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date strings
      if (sortBy.includes("date")) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle string values
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === "string") {
        bValue = bValue.toLowerCase();
      }

      if (!aValue) aValue = "";
      if (!bValue) bValue = "";

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    console.log(`✅ Returning ${jobs.length} jobs after filtering and sorting`);

    // Get total count (for pagination info)
    const totalSnapshot = await db.collection("jobs").get();
    const totalCount = totalSnapshot.size;

    const response = {
      success: true,
      jobs: jobs,
      total: totalCount,
      returned: jobs.length,
      filters: {
        source: source || "all",
        search: search || "",
        categories: categories || "",
        sortBy: sortBy,
        sortOrder: sortOrder,
      },
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
    console.error("❌ Get jobs error:", error);
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
