# Clerk + Firebase Integration Guide

This guide explains how to properly integrate Clerk authentication with Firebase Firestore for the Smart Home Harmony system.

## Overview

The Smart Home Harmony system uses:
- **Clerk** for user authentication and management
- **Firebase Firestore** for database storage
- **Firebase Auth** (anonymous) for Firestore security rules

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Clerk     │    │  Firebase   │    │  Firestore  │
│             │    │    Auth     │    │             │
│ • User Auth │───▶│ • Anonymous │───▶│ • Security  │
│ • User Mgmt │    │ • Sync      │    │ • Rules     │
│ • Sessions  │    │ • Token     │    │ • Data      │
└─────────────┘    └─────────────┘    └─────────────┘
```

## How It Works

1. **User signs in with Clerk** - Clerk handles authentication
2. **Firebase Auth sync** - User is signed in to Firebase Auth anonymously
3. **Firestore access** - Security rules allow access based on Firebase Auth
4. **Data operations** - All Firestore operations work with proper permissions

## Current Implementation

### Firebase Auth Sync

The system uses anonymous Firebase Auth to enable Firestore security rules:

```typescript
// src/utils/firebaseAuthSync.ts
export const useFirebaseAuthSync = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncAuth = async () => {
      if (user) {
        // Sign in to Firebase anonymously when Clerk user is authenticated
        await signInAnonymously(auth);
      } else {
        // Sign out from Firebase when Clerk user is not authenticated
        await firebaseSignOut(auth);
      }
    };

    syncAuth();
  }, [user, isLoaded]);
};
```

### Firestore Security Rules

The security rules are based on Firebase Auth authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }

    // Households collection - members can read, admins can write
    match /households/{householdId} {
      allow read: if isHouseholdMember(householdId);
      allow create: if isAuthenticated();
      allow update, delete: if isHouseholdAdmin(householdId);
    }

    // Development mode - allow all authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## User ID Mapping

### Current Approach (Development)

In development mode, the system uses:
- **Clerk User ID**: `user_2abc123def456`
- **Firebase Auth UID**: Anonymous Firebase Auth UID
- **Database User ID**: Generated Firestore document ID

### Production Approach (Recommended)

For production, you should implement proper user ID mapping:

```typescript
// Backend API endpoint
POST /api/auth/firebase-token
{
  "clerkUserId": "user_2abc123def456"
}

// Response
{
  "token": "firebase_custom_token_with_clerk_user_id"
}
```

## Setup Instructions

### 1. Firebase Configuration

Ensure your Firebase project is properly configured:

```typescript
// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### 2. Clerk Configuration

Make sure Clerk is configured with your domain:

```typescript
// In your Clerk dashboard
Allowed Origins: http://localhost:3000, https://yourdomain.com
```

### 3. Firestore Rules Deployment

Deploy the updated security rules:

```bash
firebase deploy --only firestore:rules
```

### 4. App Integration

The integration is already set up in the main App component:

```typescript
// src/App.tsx
const App = () => {
  // Sync Firebase Auth with Clerk
  useFirebaseAuthSync();
  
  // ... rest of the app
};
```

## Development vs Production

### Development Mode

- **Firebase Auth**: Anonymous authentication
- **Security Rules**: Permissive for development
- **User Mapping**: Simple approach
- **Auto-setup**: Enabled for sample data

### Production Mode

- **Firebase Auth**: Custom tokens with Clerk user ID
- **Security Rules**: Strict permissions
- **User Mapping**: Proper Clerk → Firebase mapping
- **Auto-setup**: Disabled

## Production Implementation

For production, you'll need a backend service that:

1. **Receives Clerk user ID** from your frontend
2. **Creates Firebase custom token** with Clerk user ID
3. **Returns token** to frontend
4. **Frontend signs in** to Firebase with custom token

### Backend Example (Node.js)

```javascript
const admin = require('firebase-admin');
const { clerkClient } = require('@clerk/clerk-sdk-node');

app.post('/api/auth/firebase-token', async (req, res) => {
  const { clerkUserId } = req.body;
  
  try {
    // Verify Clerk user exists
    const user = await clerkClient.users.getUser(clerkUserId);
    
    // Create Firebase custom token
    const customToken = await admin.auth().createCustomToken(clerkUserId, {
      clerk_user_id: clerkUserId,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName} ${user.lastName}`
    });
    
    res.json({ token: customToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create token' });
  }
});
```

### Updated Frontend

```typescript
// src/utils/firebaseAuthSync.ts (Production)
const getCustomToken = async (clerkUserId: string): Promise<string> => {
  const response = await fetch('/api/auth/firebase-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkUserId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Firebase token');
  }

  const { token } = await response.json();
  return token;
};
```

## Security Considerations

### Development

- Anonymous Firebase Auth is sufficient for development
- Security rules are permissive but still require authentication
- Sample data is created for testing

### Production

- Use custom tokens with proper Clerk user ID mapping
- Implement strict security rules
- Remove development fallbacks
- Add proper error handling and logging

## Troubleshooting

### Permission Errors

If you see "Missing or insufficient permissions":

1. **Check Firebase Auth state**:
   ```javascript
   console.log('Firebase Auth user:', auth.currentUser);
   ```

2. **Verify Clerk authentication**:
   ```javascript
   console.log('Clerk user:', user);
   ```

3. **Check security rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Authentication Sync Issues

If Firebase Auth isn't syncing with Clerk:

1. **Check the sync hook**:
   ```javascript
   const { isSynced, clerkUserId } = useFirebaseAuthSync();
   console.log('Sync status:', { isSynced, clerkUserId });
   ```

2. **Manual sync for testing**:
   ```javascript
   // In browser console
   import { devSyncFirebaseAuth } from '@/utils/firebaseAuthSync';
   await devSyncFirebaseAuth();
   ```

### Database Setup Issues

If sample data isn't loading:

1. **Check database status**:
   ```javascript
   import { checkDatabaseEmpty } from '@/utils/setupDatabase';
   const isEmpty = await checkDatabaseEmpty();
   console.log('Database empty:', isEmpty);
   ```

2. **Manual setup**:
   ```javascript
   import { setupDatabase } from '@/utils/setupDatabase';
   await setupDatabase();
   ```

## Best Practices

1. **Always check authentication state** before Firestore operations
2. **Use proper error handling** for authentication failures
3. **Implement proper user ID mapping** in production
4. **Test security rules** thoroughly before deployment
5. **Monitor authentication logs** in production
6. **Keep development and production configurations separate**

## Next Steps

1. **Test the current implementation** in development
2. **Implement backend token service** for production
3. **Update security rules** for production use
4. **Add proper error handling** and user feedback
5. **Monitor and log** authentication events
6. **Implement proper user management** flows 