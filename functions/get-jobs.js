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
    const limit = parseInt(params.get("limit") || "50");
    const source = params.get("source"); // Filter by source
    const search = params.get("search"); // Search in title/description
    const categories = params.get("categories"); // Comma-separated categories
    const sortBy = params.get("sortBy") || "datePosted"; // Sort field
    const sortOrder = params.get("sortOrder") || "desc"; // asc or desc

    let query = db.collection("jobs").limit(limit);

    // Apply source filter
    if (source && source !== "all") {
      query = query.where("source", "==", source);
    }

    // Get jobs
    const snapshot = await query.get();
    let jobs = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
      });
    });

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

    // Sort jobs
    jobs.sort((a, b) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

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
