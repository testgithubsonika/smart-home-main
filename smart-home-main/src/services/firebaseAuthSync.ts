import { auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

// Sync Firebase auth with Clerk user
export const syncAuth = async (clerkUserId?: string) => {
  try {
    // If we have a Clerk user, we can create a custom token
    // For now, we'll use anonymous auth for development
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('Signed in to Firebase anonymously');
    }
  } catch (error) {
    console.error('Error signing in to Firebase:', error);
  }
};

// Listen for auth state changes
export const setupAuthListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    console.log('Firebase auth state changed:', user?.uid);
    callback(user);
  });
};

// Get current Firebase user
export const getCurrentFirebaseUser = () => {
  return auth.currentUser;
};

// Sign out from Firebase
export const signOutFirebase = async () => {
  try {
    await auth.signOut();
    console.log('Signed out from Firebase');
  } catch (error) {
    console.error('Error signing out from Firebase:', error);
  }
}; 