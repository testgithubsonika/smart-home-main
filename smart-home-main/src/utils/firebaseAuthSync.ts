import { auth } from '@/lib/firebase';
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';

/**
 * Custom hook to sync Clerk authentication with Firebase Auth
 * This allows Firestore security rules to work properly
 */
export const useFirebaseAuthSync = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncAuth = async () => {
      if (!isLoaded) return;

      if (user) {
        // User is signed in with Clerk, sign in to Firebase anonymously
        // This allows Firestore rules to work while keeping it simple
        try {
          await signInAnonymously(auth);
          console.log('Signed in to Firebase Auth for Firestore access');
        } catch (error) {
          console.error('Error signing in to Firebase:', error);
        }
      } else {
        // User is signed out from Clerk, sign out from Firebase
        try {
          await firebaseSignOut(auth);
          console.log('Signed out from Firebase Auth');
        } catch (error) {
          console.error('Error signing out from Firebase:', error);
        }
      }
    };

    syncAuth();
  }, [user, isLoaded]);

  return {
    isSynced: auth.currentUser !== null,
    clerkUserId: user?.id
  };
};

/**
 * Initialize Firebase Auth sync when the app starts
 * This should be called in your main App component
 */
export const initializeFirebaseAuthSync = () => {
  // This function can be called to manually initialize the sync
  // The useFirebaseAuthSync hook handles the actual syncing
  console.log('Firebase Auth sync initialized');
};

/**
 * Development utility to manually sync Firebase Auth
 * This can be called from the browser console for testing
 */
export const devSyncFirebaseAuth = async () => {
  if (!import.meta.env.DEV) {
    console.warn('This function is only available in development mode');
    return;
  }

  try {
    await signInAnonymously(auth);
    console.log('Manually signed in to Firebase Auth');
  } catch (error) {
    console.error('Failed to manually sign in to Firebase:', error);
  }
};

/**
 * Development utility to manually sign out from Firebase Auth
 */
export const devSignOutFirebase = async () => {
  if (!import.meta.env.DEV) {
    console.warn('This function is only available in development mode');
    return;
  }

  try {
    await firebaseSignOut(auth);
    console.log('Manually signed out from Firebase Auth');
  } catch (error) {
    console.error('Failed to manually sign out from Firebase:', error);
  }
}; 