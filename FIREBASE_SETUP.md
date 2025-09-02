# 🔥 Firebase Setup Guide for Jobna AI

## 📋 Prerequisites

- Node.js and npm installed
- Firebase account (free tier is sufficient)

## 🚀 Step-by-Step Setup

### 1. **Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. **Project name**: `jobna-ai` (or your preferred name)
4. **Enable Google Analytics**: Optional but recommended
5. Click "Create project"

### 2. **Enable Authentication**

1. In your project dashboard, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

### 3. **Enable Firestore Database**

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to your users
5. Click "Enable"

### 4. **Get Your Firebase Config**

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "Jobna Web App")
6. **Copy the Firebase config object** - you'll need this next!

### 5. **Install Dependencies**

```bash
npm install firebase
```

### 6. **Update Configuration File**

1. Open `src/firebase/config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-actual-measurement-id", // Only if you enabled Analytics
};
```

## 🔒 Security Rules (Important!)

### Firestore Security Rules

Go to Firestore Database → Rules and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Job applications - users can only access their own
    match /jobApplications/{docId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Resume analyses - users can only access their own
    match /resumeAnalyses/{docId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🧪 Test Your Setup

### 1. **Check Console for Errors**

- Open browser console
- Look for Firebase initialization errors
- Ensure no "Firebase not initialized" errors

### 2. **Verify Authentication**

- Try to register a test user
- Check if user appears in Firebase Console → Authentication
- Check if profile appears in Firestore → users collection

## 📁 File Structure Created

```
src/
├── firebase/
│   ├── config.js      # Firebase configuration
│   ├── auth.js        # Authentication functions
│   └── firestore.js   # Database operations
```

## 🔧 Available Functions

### Authentication (`auth.js`)

- `registerUser(email, password, userData)` - User registration
- `loginUser(email, password)` - User login
- `logoutUser()` - User logout
- `resetPassword(email)` - Password reset
- `getCurrentUser()` - Get current user

### Database (`firestore.js`)

- `createUserProfile(uid, userData)` - Create user profile
- `getUserProfile(uid)` - Get user profile
- `updateUserProfile(uid, updates)` - Update user profile
- `saveJobApplication(uid, jobData)` - Save job application
- `getUserJobApplications(uid)` - Get user's job applications

## 🚨 Common Issues & Solutions

### 1. **"Firebase not initialized" Error**

- Check if config values are correct
- Ensure `firebase` package is installed
- Verify import statements

### 2. **"Permission denied" Error**

- Check Firestore security rules
- Ensure user is authenticated
- Verify user ID matches document owner

### 3. **"Network error"**

- Check internet connection
- Verify Firebase project is active
- Check if you're in the correct region

## 📱 Next Steps

After completing this setup:

1. ✅ **Update your SignUp component** to use Firebase
2. ✅ **Create Authentication Context** for state management
3. ✅ **Add protected routes** for authenticated users
4. ✅ **Update Login component** with Firebase
5. ✅ **Test the complete flow**

## 🆘 Need Help?

- **Firebase Documentation**: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
- **Stack Overflow**: Tag with `firebase` and `react`

---

**⚠️ Important**: Never commit your Firebase config with real API keys to public repositories. Use environment variables for production apps.
