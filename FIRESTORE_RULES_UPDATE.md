# Firestore Security Rules Update

## Quick Update Needed

Go to Firebase Console → Firestore Database → Rules tab, and make sure you have this rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public reads for job listings
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if false;  // Only server-side functions can write
    }

    // Keep your existing rules for other collections (users, jobApplications, etc.)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /jobApplications/{applicationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Add other existing rules here...
  }
}
```

**Important**: Click "Publish" after updating!
