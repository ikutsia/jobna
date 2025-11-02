# Testing Guide: Job Feed Aggregator

## Step-by-Step Testing Process

### Step 1: Verify Deployment ✅

- Your site should be live at: `https://your-site.netlify.app`
- Check that the homepage loads correctly

### Step 2: Navigate to Job Feed Page

1. Visit: `https://your-site.netlify.app/job-feed`
2. You should see:
   - "Job Feed Aggregator" title
   - "Browse Jobs" button
   - Filter options (Source, Search, Sort By, Order)
   - "Sync Jobs" button

### Step 3: Test Syncing Jobs (First Time)

1. Click the **"🔄 Sync Jobs"** button
2. Wait 10-30 seconds (fetching from 5 sources takes time)
3. Check what happens:
   - ✅ Success: Jobs appear in the list below
   - ❌ Error: Check browser console (F12) and Netlify function logs

### Step 4: Verify Jobs Appear

After syncing, you should see:

- Job cards with:
  - Job title
  - Organization name
  - Location
  - Date posted
  - Source badge (reliefweb, unjobs, etc.)
  - "View Original" button
  - "Analyze Match" button

### Step 5: Test Filters

1. **Source Filter**:
   - Change dropdown to "ReliefWeb"
   - Jobs should filter to only ReliefWeb jobs
2. **Search**:
   - Type a keyword (e.g., "manager")
   - Jobs should filter in real-time (with 500ms delay)
3. **Sort**:
   - Change "Sort By" to "Organization"
   - Change "Order" to "Asc"
   - Jobs should reorder

### Step 6: Test CV Analysis Integration

1. Make sure you have a CV uploaded (from `/upload-cv`)
2. Click "Analyze Match" on any job
3. You should be redirected to `/analyze-now` with the job description pre-loaded
4. Click "Start Analysis" to see match score

### Step 7: Check Netlify Function Logs

1. Go to Netlify Dashboard → Functions
2. Check `sync-job-feeds` function logs for:

   - ✅ "ReliefWeb: Fetched X jobs"
   - ✅ "UN Jobs: Fetched X jobs"
   - ✅ "Stored: X new, Y updated"
   - ❌ Any Firebase errors

3. Check `get-jobs` function logs when loading the page

## Expected Results

### ✅ Success Indicators:

- Jobs load when clicking "Sync Jobs"
- Multiple sources show different job counts
- Filters work correctly
- No console errors
- Functions show success in logs

### ❌ Common Issues:

**No jobs appear:**

- Check Firestore rules (must allow public reads)
- Check Netlify function logs for errors
- Verify Firebase Admin SDK is initialized in logs

**"Firestore not initialized" error:**

- Check environment variable `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- Verify JSON format is correct (entire JSON, not escaped)

**Jobs from only some sources:**

- Some RSS feeds may be temporarily unavailable
- Check function logs to see which sources failed
- ReliefWeb (JSON API) should always work if API is accessible

**Slow loading:**

- First sync can take 20-30 seconds (fetching from 5 sources)
- Subsequent loads from Firestore should be fast (< 1 second)

## Troubleshooting Commands

Test functions directly:

1. `https://your-site.netlify.app/.netlify/functions/sync-job-feeds`
2. `https://your-site.netlify.app/.netlify/functions/get-jobs?limit=5`

These should return JSON responses.
