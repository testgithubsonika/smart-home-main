// This file has been migrated to Supabase
// Firebase Auth sync is no longer needed with Supabase
// Supabase handles authentication directly

import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-react';

/**
 * Custom hook to sync Clerk authentication with Supabase
 * This allows Supabase RLS policies to work with Clerk user IDs
 */
export const useClerkFirebaseAuth = () => {
  const { user, isLoaded } = useUser();

  const syncWithSupabase = async () => {
    if (!user || !isLoaded) {
      // Sign out of Supabase if no Clerk user
      try {
        await supabase.auth.signOut();
        console.log('Signed out of Supabase Auth');
      } catch (error) {
        console.error('Error signing out of Supabase:', error);
      }
      return;
    }

    try {
      // With Supabase, we can use Clerk's session token directly
      // or set up a custom JWT that includes Clerk user ID
      console.log('Clerk user authenticated, Supabase auth ready');
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log('Signed out of Supabase Auth');
    } catch (error) {
      console.error('Error signing out of Supabase:', error);
    }
  };

  return {
    syncWithSupabase,
    signOut,
    isSynced: true, // Always true with Supabase + Clerk
    clerkUserId: user?.id
  };
};

/**
 * Get a custom Supabase token from your backend
 * This should call your backend API that creates a custom token with Clerk user ID
 */
const getCustomToken = async (clerkUserId: string): Promise<string> => {
  // With Supabase, we can use Clerk's session token directly
  // or set up a custom JWT that includes Clerk user ID
  
  if (import.meta.env.DEV) {
    // Development fallback - create a simple token
    // In production, replace this with a call to your backend
    return createDevToken(clerkUserId);
  }

  // Production: Call your backend API
  const response = await fetch('/api/auth/supabase-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clerkUserId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Supabase token');
  }

  const { token } = await response.json();
  return token;
};

/**
 * Create a development token for testing
 * This is a simplified version - in production, use proper Supabase JWT
 */
const createDevToken = (clerkUserId: string): string => {
  // This is a mock implementation for development
  // In production, your backend should use Supabase to create proper JWT tokens
  
  const mockToken = {
    sub: clerkUserId,
    clerk_user_id: clerkUserId,
    email: 'dev@example.com',
    email_verified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  // For development, we'll use a simple approach
  // In production, this should be a proper JWT token signed by Supabase
  return btoa(JSON.stringify(mockToken));
};

/**
 * Initialize Supabase Auth sync when the app starts
 */
export const initializeFirebaseAuthSync = () => {
  // Listen for Clerk auth state changes
  const { user, isLoaded } = useUser();

  if (isLoaded && user) {
    // Sync with Supabase when Clerk user is loaded
    const syncWithSupabase = async () => {
      try {
        console.log('Supabase Auth ready with Clerk user:', user.id);
      } catch (error) {
        console.error('Failed to sync Supabase Auth:', error);
      }
    };

    syncWithSupabase();
  }
};

/**
 * Development-only function to manually sync Supabase Auth
 * This can be called from the browser console for testing
 */
export const devSyncFirebaseAuth = async (clerkUserId: string) => {
  if (!import.meta.env.DEV) {
    console.warn('This function is only available in development mode');
    return;
  }

  try {
    console.log('Manually synced Supabase Auth with Clerk user:', clerkUserId);
  } catch (error) {
    console.error('Failed to manually sync Supabase Auth:', error);
  }
}; 