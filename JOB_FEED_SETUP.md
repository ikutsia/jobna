# Job Feed Aggregator Setup Guide

This guide explains how to set up the feed aggregator functionality that fetches jobs from ReliefWeb and Adzuna. Other feeds (UN Jobs, Remote OK, etc.) remain disabled because of access limitations. The job feed UI now includes a Location dropdown for Adzuna so you can pull roles from a single country or from every supported market at once.

## 🏗️ Architecture

- **Netlify Functions**: Serverless functions for fetching and serving jobs
- **Firebase Firestore**: Database to store normalized job data
- **React Component**: Frontend UI to browse and filter jobs

## 📋 Setup Steps

### 1. Install Dependencies

The required dependencies have already been added to `functions/package.json`:

- `rss-parser`: Parse RSS/XML feeds (ReliefWeb legacy support)
- `axios`: Fetch JSON APIs (ReliefWeb & Adzuna)
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
RELIEFWEB_APPNAME=your-approved-appname   # optional but recommended
ADZUNA_APP_ID=xxxxxxxx
ADZUNA_APP_KEY=xxxxxxxx
ADZUNA_COUNTRY=us                 # default single-country fallback
ADZUNA_COUNTRY_LIST=us,gb,au,ca   # optional: countries fetched when "All" is selected
```

> If you don’t provide `RELIEFWEB_APPNAME`, the ReliefWeb API returns a `403` error. Register at [https://apidoc.reliefweb.int/parameters#appname](https://apidoc.reliefweb.int/parameters#appname) to get your own name. `ADZUNA_COUNTRY_LIST` lets you limit the countries queried when the UI location dropdown is set to “All”. If omitted, the function will pull from every Adzuna market.

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

Alternatively, users can manually trigger sync via the "Sync Jobs" button in the UI. When the location dropdown is set to a specific country, only that country’s Adzuna feed is refreshed; selecting “All” pulls from the configured list.

### 6. Test the Setup

1. **Manual Sync Test**:

   ```bash
   # Test locally with Netlify Dev
   netlify dev

   # Then visit or call:
   POST http://localhost:8888/.netlify/functions/sync-job-feeds
   ```

   To test a specific set of Adzuna countries, send JSON:

   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"adzunaCountries":"gb"}' \
     http://localhost:8888/.netlify/functions/sync-job-feeds
   ```

2. **Get Jobs Test**:

   ```bash
   GET http://localhost:8888/.netlify/functions/get-jobs?source=adzuna&location=gb
   ```

3. **Frontend Test**:
   - Deploy to Netlify
   - Visit `/job-feed`
   - Choose a location (e.g., "United States") and click "Sync Jobs"
   - Verify jobs appear and filters (source, location, search) work

## 🔧 Function Endpoints

### `/.netlify/functions/sync-job-feeds`

Fetches jobs from ReliefWeb and Adzuna, then stores them in Firestore.

**Method**: `POST` or `GET`

**Payload (optional)**:

```json
{
  "adzunaCountries": "gb"        // string or comma-separated list
}
```

Set `adzunaCountries` to `"all"` to pull from the configured list of markets.

**Response**:

```json
{
  "success": true,
  "totalFetched": 150,
  "bySource": {
    "reliefweb": 100,
    "adzuna": 50
  },
  "storage": {
    "stored": 110,
    "updated": 40,
    "skipped": 0
  },
  "adzunaCountriesUsed": ["us", "gb"],
  "timestamp": "2025-11-09T13:00:00.000Z"
}
```

### `/.netlify/functions/get-jobs`

Retrieves jobs from Firestore with filtering.

**Method**: `GET`

**Query Parameters**:

- `limit`: Number of jobs to return (default: 50)
- `source`: Filter by source (`reliefweb`, `adzuna`)
- `location`: Country slug (Adzuna only, e.g., `gb`, `us`)
- `search`: Search in title/description/organization/location
- `categories`: Comma-separated keywords (RSS feeds)
- `sortBy`: Sort field (datePosted, dateAdded, title, organization)
- `sortOrder`: asc or desc (default: desc)

**Example**:

```
/.netlify/functions/get-jobs?source=adzuna&location=gb&limit=20&sortBy=datePosted&sortOrder=desc
```

### `/.netlify/functions/search-jobs`

Performs a live search against ReliefWeb and Adzuna without touching Firestore. Use this when the user enters a keyword in the UI.

**Method**: `GET`

**Query Parameters**:

- `search`: Keyword or phrase to search for (optional, but recommended)
- `source`: `reliefweb`, `adzuna`, or `all` (default)
- `location`: Adzuna country slug (`us`, `gb`, etc.) or `all`
- `limit`: Max results per source (default: 50, max: 100 for ReliefWeb, 50 for Adzuna)

**Example**:

```
/.netlify/functions/search-jobs?search=program%20manager&source=all&location=gb
```

**Response**:

```json
{
  "success": true,
  "total": 40,
  "jobs": [
    {
      "id": "reliefweb_123456",
      "title": "Programme Manager",
      "organization": "UNICEF",
      "location": "London, United Kingdom",
      "link": "https://...",
      "source": "reliefweb"
    }
  ],
  "bySource": {
    "reliefweb": 25,
    "adzuna": 15
  },
  "adzunaCountriesUsed": ["gb"],
  "timestamp": "2025-11-09T13:10:00.000Z"
}
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
  source: "reliefweb" | "adzuna",   // Source identifier
  sourceId: "us_12345",            // Original ID (includes Adzuna country slug)
  tags: ["development", "health"], // Categories/tags
  countrySlug: "us",               // Adzuna country slug (if applicable)
  salary: ""                        // Salary info (if available)
}
```

## 🎨 Features

- **Multi-source aggregation**: Fetches from ReliefWeb and Adzuna
- **Location-aware sync**: Choose a country slug or "All" to control which Adzuna markets are refreshed
- **Unified format**: All jobs normalized to the same structure
- **Search & filter**: Filter by source, location, search text, categories, sort options
- **CV Analysis integration**: Click "Analyze Match" to analyze job with your CV
- **Auto-sync**: Scheduled function keeps jobs fresh
- **Responsive UI**: Works on mobile and desktop

## 🐛 Troubleshooting

### Jobs not appearing?

1. Check if `sync-job-feeds` function ran successfully
2. Verify Firebase Admin SDK is configured correctly
3. Check Firestore security rules allow reads
4. Check browser console for errors
5. Ensure `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and `RELIEFWEB_APPNAME` environment variables are set

### Adzuna returns errors?

- Verify the country slug is valid (see the list at the top of `sync-job-feeds.js`)
- Increase your results limit carefully—Adzuna expects `results_per_page` ≤ 50
- Make sure your account is active and not rate-limited

### ReliefWeb returning 403?

- Ensure `RELIEFWEB_APPNAME` matches the approved name you received from ReliefWeb

## 🚀 Next Steps

- Add additional job sources (if they expose a reliable RSS/API)
- Integrate a queue or caching layer for heavy feeds
- Extend analytics to track job sync counts per country

Happy job hunting! 🧭
