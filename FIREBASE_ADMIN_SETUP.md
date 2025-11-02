# Firebase Admin SDK Setup Guide

## Step-by-Step Instructions

### Option 1: Service Account Key (Recommended for Production)

1. **Go to Firebase Console**:

   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Generate Service Account Key**:

   - Click the gear icon (⚙️) → Project Settings
   - Go to "Service Accounts" tab
   - Click "Generate New Private Key"
   - A JSON file will download (keep this secure!)

3. **Add to Netlify Environment Variables**:
   - Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
   - Click "Add variable"
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Copy the ENTIRE contents of the downloaded JSON file
     - It should look like: `{"type":"service_account","project_id":"...","private_key_id":"...",...}`
     - Paste the entire JSON object as the value
   - Click "Save"

### Option 2: Project ID Only (Simpler, but may have limitations)

1. **Get Your Project ID**:

   - In Firebase Console → Project Settings → General
   - Copy your "Project ID"

2. **Add to Netlify**:
   - Netlify Dashboard → Environment Variables
   - **Key**: `FIREBASE_PROJECT_ID`
   - **Value**: Your project ID (e.g., `my-project-12345`)
   - Click "Save"

## Verify Setup

After adding environment variables:

1. Go to Netlify → Deploys
2. Trigger a new deploy (or wait for next commit)
3. Check function logs for: `✅ Firebase Admin initialized with service account` or similar

## Firestore Security Rules

Update your Firestore rules to allow public reads:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read jobs (public listings)
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if false;  // Only server-side functions can write
    }

    // Keep your existing rules for other collections...
  }
}
```

## Test Locally (Optional)

If you want to test before deploying:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Set environment variables locally in `.env` file:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```
3. Run: `netlify dev`
4. Test functions at `http://localhost:8888/.netlify/functions/sync-job-feeds`
