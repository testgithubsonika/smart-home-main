import { auth } from '@/lib/firebase';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { useUser } from '@clerk/clerk-react';

/**
 * Custom hook to sync Clerk authentication with Firebase Auth
 * This allows Firestore security rules to work with Clerk user IDs
 */
export const useClerkFirebaseAuth = () => {
  const { user, isLoaded } = useUser();

  const syncWithFirebase = async () => {
    if (!user || !isLoaded) {
      // Sign out of Firebase if no Clerk user
      try {
        await firebaseSignOut(auth);
        console.log('Signed out of Firebase Auth');
      } catch (error) {
        console.error('Error signing out of Firebase:', error);
      }
      return;
    }

    try {
      // Get a custom token from your backend that includes Clerk user ID
      const customToken = await getCustomToken(user.id);
      
      // Sign in to Firebase with the custom token
      await signInWithCustomToken(auth, customToken);
      console.log('Synced Clerk user with Firebase Auth');
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      console.log('Signed out of Firebase Auth');
    } catch (error) {
      console.error('Error signing out of Firebase:', error);
    }
  };

  return {
    syncWithFirebase,
    signOut,
    isSynced: auth.currentUser !== null,
    clerkUserId: user?.id
  };
};

/**
 * Get a custom Firebase token from your backend
 * This should call your backend API that creates a custom token with Clerk user ID
 */
const getCustomToken = async (clerkUserId: string): Promise<string> => {
  // For development, we'll create a simple token
  // In production, this should call your backend API
  
  if (import.meta.env.DEV) {
    // Development fallback - create a simple token
    // In production, replace this with a call to your backend
    return createDevToken(clerkUserId);
  }

  // Production: Call your backend API
  const response = await fetch('/api/auth/firebase-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clerkUserId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Firebase token');
  }

  const { token } = await response.json();
  return token;
};

/**
 * Create a development token for testing
 * This is a simplified version - in production, use proper Firebase Admin SDK
 */
const createDevToken = (clerkUserId: string): string => {
  // This is a mock implementation for development
  // In production, your backend should use Firebase Admin SDK to create proper tokens
  
  const mockToken = {
    uid: clerkUserId,
    clerk_user_id: clerkUserId,
    email: 'dev@example.com',
    email_verified: true,
    auth_time: Math.floor(Date.now() / 1000),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  // For development, we'll use a simple approach
  // In production, this should be a proper JWT token signed by Firebase Admin SDK
  return btoa(JSON.stringify(mockToken));
};

/**
 * Initialize Firebase Auth sync when the app starts
 */
export const initializeFirebaseAuthSync = () => {
  // Listen for Clerk auth state changes
  const { user, isLoaded } = useUser();

  if (isLoaded && user) {
    // Sync with Firebase when Clerk user is loaded
    const syncWithFirebase = async () => {
      try {
        const customToken = await getCustomToken(user.id);
        await signInWithCustomToken(auth, customToken);
        console.log('Firebase Auth synced with Clerk user:', user.id);
      } catch (error) {
        console.error('Failed to sync Firebase Auth:', error);
      }
    };

    syncWithFirebase();
  }
};

/**
 * Development-only function to manually sync Firebase Auth
 * This can be called from the browser console for testing
 */
export const devSyncFirebaseAuth = async (clerkUserId: string) => {
  if (!import.meta.env.DEV) {
    console.warn('This function is only available in development mode');
    return;
  }

  try {
    const customToken = await getCustomToken(clerkUserId);
    await signInWithCustomToken(auth, customToken);
    console.log('Manually synced Firebase Auth with Clerk user:', clerkUserId);
  } catch (error) {
    console.error('Failed to manually sync Firebase Auth:', error);
  }
}; 