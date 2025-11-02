# Simple Setup Using Project ID Only

Since you already have your Firebase Project ID (`jobna-451c2`), you can use this simpler approach:

## Steps:

1. **Go to Netlify Dashboard**:

   - Navigate to your site settings
   - Go to: **Environment Variables**

2. **Add this variable**:

   - **Key**: `FIREBASE_PROJECT_ID`
   - **Value**: `jobna-451c2` (your project ID from the Firebase console)

3. **That's it!**

The functions will use this to connect to Firestore.

## Note:

- This method works for reading and may work for writing depending on your Firestore rules
- If you encounter write permission errors later, then you'll need the Service Account Key
- For now, this is enough to test the job feed functionality

## After Adding:

1. Redeploy your site (or wait for auto-deploy)
2. Visit `/job-feed` page
3. Click "Sync Jobs" button
4. Check Netlify function logs if there are any errors
