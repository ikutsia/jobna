# 🔧 Gemini API Fix Guide

## Problem

Your app is producing 0 results because the Gemini API key is either:

- Missing from Netlify environment variables
- Invalid or expired
- Not properly configured

## Quick Fix Steps

### Step 1: Get a New Google Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (it will start with `AIza...`)

### Step 2: Add to Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to: **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Name: `GEMINI_API_KEY`
6. Value: (paste your new API key)
7. Click **Save**

### Step 3: Redeploy

1. Go to: **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### Step 4: Test

Open your browser console (F12) and test the API:

```javascript
// Test URL (replace with your actual Netlify URL)
fetch("https://your-site.netlify.app/.netlify/functions/test-gemini")
  .then((r) => r.json())
  .then(console.log);
```

You should see:

```json
{
  "success": true,
  "message": "Gemini API is working!"
}
```

## Verify the Fix

1. Upload a CV
2. Upload a job description
3. Click "Start Analysis"
4. You should now see real analysis results instead of 0s

## Common Issues

### Issue 1: "API key not found"

**Solution:** Make sure you added the environment variable in Netlify and redeployed

### Issue 2: "Invalid API key format"

**Solution:** Gemini API keys should start with `AIza`. If yours doesn't, get a new one.

### Issue 3: "API quota exceeded"

**Solution:**

- Check your Google Cloud Console usage
- Gemini has a free tier with generous limits
- If exceeded, wait for quota reset or upgrade

## Still Not Working?

1. Check Netlify function logs:

   - Netlify Dashboard → Your Site → Functions → View logs

2. Run the diagnostic:

   ```javascript
   fetch("https://your-site.netlify.app/.netlify/functions/diagnose-ats")
     .then((r) => r.json())
     .then(console.log);
   ```

3. Check for errors in the diagnostic output

## Environment Variable Setup

Make sure your Netlify environment variables include:

```
GEMINI_API_KEY=AIza...your_key_here
```

**Important:** Do NOT include quotes around the API key value.

## Cost Information

Gemini API has a generous free tier:

- 15 requests per minute
- 1,500 requests per day
- Free for most use cases

## Support

If issues persist, check:

1. Netlify function logs
2. Browser console errors
3. Google Cloud Console for API status
