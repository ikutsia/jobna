# 🔐 Environment Variables Setup for Firebase

## 📋 What This Does

This setup moves your Firebase credentials from the code to environment variables, making your app more secure and following best practices.

## 🚀 Setup Instructions

### 1. **Create .env File**

In your project root (`jobna/` directory), create a new file named `.env` (exactly this name, no extension).

### 2. **Add Firebase Credentials**

Copy this content into your `.env` file:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCV-ndDepO-mxSDmKAJHggfUbphCkIFnpc
REACT_APP_FIREBASE_AUTH_DOMAIN=jobna-451c2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=jobna-451c2
REACT_APP_FIREBASE_STORAGE_BUCKET=jobna-451c2.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=106696338896
REACT_APP_FIREBASE_APP_ID=1:106696338896:web:2f1327e0a056a6c8271dd5
REACT_APP_FIREBASE_MEASUREMENT_ID=G-DEK5L2KVL2
```

### 3. **Important Notes**

- **File name must be exactly `.env`** (not `.env.txt` or anything else)
- **Must be in the project root** (same level as `package.json`)
- **Restart your development server** after creating the file
- **Never commit this file** to version control (it's already in `.gitignore`)

### 4. **Verify Setup**

After creating the `.env` file and restarting your server, your Firebase should work exactly the same, but now your credentials are secure!

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

## 📱 Production Deployment

For production (Netlify, Vercel, etc.), you'll need to add these same environment variables in your hosting platform's settings.
