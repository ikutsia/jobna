# Debug Guide: Why Feeds Return 0 Jobs

## Step 1: Check Netlify Function Logs

1. Go to **Netlify Dashboard** → Your Site → **Functions**
2. Click on **`sync-job-feeds`**
3. Click **"View logs"** or check **Recent invocations**
4. Look for these messages:

### What to Look For:

**✅ Good signs:**

- `🔍 Fetching ReliefWeb from: ...`
- `📦 ReliefWeb response status: 200`
- `📦 ReliefWeb items count: X`
- `✅ ReliefWeb: Fetched X jobs`

**❌ Error signs:**

- `❌ ReliefWeb fetch error: ...`
- `❌ ReliefWeb error details: ...`
- Timeout errors
- Network errors
- 404/403 status codes

## Step 2: Test Feeds Directly

Try accessing these URLs in your browser to see if they work:

### ReliefWeb API (Should work):

```
https://api.reliefweb.int/v1/jobs?appname=jobna&limit=5
```

### RSS Feeds (May have issues):

```
https://www.unjobnet.org/feed
https://www.impactpool.org/feed
https://www.idealist.org/en/jobs.rss
https://www.eurobrussels.com/rss/all_jobs.xml
```

## Step 3: Common Issues

### Issue 1: CORS/Network Blocking

- Some feeds block requests from serverless functions
- Solution: May need to use a proxy or different approach

### Issue 2: RSS Feed Format Changed

- RSS feeds may have changed structure
- Solution: Update parsing logic

### Issue 3: Rate Limiting

- Some APIs limit requests
- Solution: Add delays between requests

### Issue 4: Feed URLs Changed

- Feed URLs may have moved
- Solution: Verify URLs are still valid

## Step 4: Quick Test Script

You can test the ReliefWeb API directly by visiting:

```
https://your-site.netlify.app/.netlify/functions/sync-job-feeds
```

This should show JSON response with error details if any.
