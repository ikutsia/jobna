# Job Feed Aggregator Setup Guide

This guide explains how to set up the RSS feed aggregator functionality that currently fetches jobs from ReliefWeb and DevJobsIndo (other sources can be re-enabled once stable feeds are available; UN Jobs and Remote OK remain disabled because of access blocks). DevJobsIndo currently exposes its feed over HTTP only—HTTPS requests fail because the SSL certificate is misconfigured.

## 🏗️ Architecture

- **Netlify Functions**: Serverless functions for fetching and serving jobs
- **Firebase Firestore**: Database to store normalized job data
- **React Component**: Frontend UI to browse and filter jobs

## 📋 Setup Steps

### 1. Install Dependencies

The required dependencies have already been added to `functions/package.json`:

- `rss-parser`: Parse RSS/XML feeds
- `axios`: Fetch JSON APIs
- `firebase-admin`: Server-side Firestore access

Install them:

```bash
cd functions
npm install
cd ..
```

### 2. Configure Firebase Admin SDK

For Netlify Functions to write to Firestore, you need Firebase Admin SDK credentials.

#### Option A: Service Account Key (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. In Netlify Dashboard:
   - Go to Site Settings → Environment Variables
   - Add: `FIREBASE_SERVICE_ACCOUNT_KEY` = (paste the entire JSON content)

#### Option B: Project ID Only (Simpler, but less secure)

If you only need basic functionality, you can set:

- `FIREBASE_PROJECT_ID` = your Firebase project ID

**Note**: Option A is more secure and recommended for production.

### 3. Netlify Environment Variables

Add these to Netlify Dashboard → Site Settings → Environment Variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Full JSON
```

### 4. Firestore Security Rules

Update your Firestore security rules to allow reads for authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads for anyone (public job listings)
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if false;  // Only server-side functions can write
    }

    // Your existing rules for other collections...
  }
}
```

### 5. Scheduled Sync (Optional)

To automatically sync jobs every 6 hours:

1. Go to Netlify Dashboard → Functions
2. Click on `sync-job-feeds`
3. Configure a background function trigger:
   - Schedule: `0 */6 * * *` (every 6 hours)
   - Or use Netlify's Scheduled Functions feature

Alternatively, users can manually trigger sync via the "Sync Jobs" button in the UI.

### 6. Test the Setup

1. **Manual Sync Test**:

   ```bash
   # Test locally with Netlify Dev
   netlify dev

   # Then visit or call:
   POST http://localhost:8888/.netlify/functions/sync-job-feeds
   ```

2. **Get Jobs Test**:

   ```bash
   GET http://localhost:8888/.netlify/functions/get-jobs
   ```

3. **Frontend Test**:
   - Deploy to Netlify
   - Visit `/job-feed` page
   - Click "Sync Jobs" button
   - Verify jobs appear

## 🔧 Function Endpoints

### `/.netlify/functions/sync-job-feeds`

Fetches jobs from all sources and stores them in Firestore.

**Method**: `POST` or `GET`

**Response**:

```json
{
  "success": true,
  "totalFetched": 140,
  "bySource": {
    "reliefweb": 90,
    "devjobsindo": 50
  },
  "storage": {
    "stored": 110,
    "updated": 30,
    "skipped": 0
  }
}
```

### `/.netlify/functions/get-jobs`

Retrieves jobs from Firestore with filtering.

**Method**: `GET`

**Query Parameters**:

- `limit`: Number of jobs to return (default: 50)
- `source`: Filter by source (`reliefweb`, `devjobsindo`)
- `search`: Search in title/description/organization/location
- `sortBy`: Sort field (datePosted, dateAdded, title, organization)
- `sortOrder`: asc or desc (default: desc)

**Example**:

```
/.netlify/functions/get-jobs?source=reliefweb&limit=20&sortBy=datePosted&sortOrder=desc
```

## 📊 Data Structure

Jobs are stored in Firestore with this structure:

```javascript
{
  id: "reliefweb_12345",           // Unique ID
  title: "Program Manager",        // Job title
  organization: "UNICEF",          // Organization name
  location: "New York, USA",       // Job location
  link: "https://...",             // Original job URL
  description: "...",              // Full job description
  datePosted: "2024-01-15T10:00:00Z",  // When job was posted
  dateAdded: "2024-01-15T10:00:00Z",  // When added to our DB
  source: "reliefweb",             // Source identifier
  sourceId: "12345",               // Original ID from source
  tags: ["development", "health"], // Categories/tags
  salary: ""                       // Salary info (if available)
}
```

## 🎨 Features

- **Multi-source aggregation**: Fetches from ReliefWeb and DevJobsIndo (other feeds such as UN Jobs and Remote OK are currently disabled)
- **Unified format**: All jobs normalized to same structure
- **Search & filter**: Filter by source, search text, sort options
- **CV Analysis integration**: Click "Analyze Match" to analyze job with your CV
- **Auto-sync**: Scheduled function keeps jobs fresh
- **Responsive UI**: Works on mobile and desktop

## 🐛 Troubleshooting

### Jobs not appearing?

1. Check if `sync-job-feeds` function ran successfully
2. Verify Firebase Admin SDK is configured correctly
3. Check Firestore security rules allow reads
4. Check browser console for errors

### Firebase Admin errors?

1. Verify `FIREBASE_PROJECT_ID` is set correctly
2. If using service account, ensure JSON is properly formatted
3. Check Netlify function logs for detailed errors

### Feed fetching fails?

1. Some RSS feeds may be rate-limited
2. Check if feed URLs are still valid
3. Some sources may have changed their API/feed structure

## 🚀 Next Steps

- Add more job sources
- Implement pagination for large job lists
- Add email alerts for new matching jobs
- Enhance search with full-text indexing
- Add job bookmarking feature
