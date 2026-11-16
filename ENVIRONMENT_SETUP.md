# 🔐 Environment Variables Setup for Firebase & OpenAI

## 📋 What This Does

This setup moves your Firebase credentials and OpenAI API key from the code to environment variables, making your app more secure and following best practices.

## 🚀 Setup Instructions

### 1. **Create .env File**

In your project root (`jobna/` directory), create a new file named `.env` (exactly this name, no extension).

### 2. **Add Firebase Credentials**

Copy this content into your `.env` file:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=jobna_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=jobna-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=jobna-project
REACT_APP_FIREBASE_STORAGE_BUCKET=jobna-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=jobna_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=jobna_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=jobna_measurement_id

# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=jobna_openai_api_key
```

### 3. **Important Notes**

- **File name must be exactly `.env`** (not `.env.txt` or anything else)
- **Must be in the project root** (same level as `package.json`)
- **Restart your development server** after creating the file
- **Never commit this file** to version control (it's already in `.gitignore`)

### 4. **OpenAI API Setup**

- **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys) and create a new API key
- **Free Tier**: OpenAI offers $5 free credit per month
- **Cost Management**: The app is configured to stay within free tier limits (50 API calls/month)
- **Rate Limiting**: Built-in usage tracking prevents exceeding monthly limits

### 5. **Verify Setup**

After creating the `.env` file and restarting your server, your Firebase and OpenAI should work exactly the same, but now your credentials are secure!

## 🔒 Security Benefits

- ✅ Credentials are not visible in your code
- ✅ Credentials are not committed to Git
- ✅ Different environments can use different credentials
- ✅ Follows security best practices

## 🚨 Troubleshooting

If Firebase stops working after this change:

1. **Check file name** - must be exactly `.env`
2. **Check file location** - must be in project root
3. **Restart development server** - `npm start`
4. **Check browser console** for any error messages

If OpenAI API stops working:

1. **Check API key** - verify it's correct and active
2. **Check credit balance** - ensure you have available credit
3. **Check usage limits** - verify you haven't exceeded monthly limits
4. **Check browser console** for specific error messages

## 📱 Production Deployment

For production (Netlify, Vercel, etc.), you'll need to add these same environment variables in your hosting platform's settings.
