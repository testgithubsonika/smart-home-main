import { supabase } from '@/lib/supabase';

// Supabase auth sync with Clerk user
export const syncAuth = async (clerkUserId?: string) => {
  try {
    // For now, we'll use Supabase anonymous auth for development
    // In production, you would sync Clerk user with Supabase auth
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting Supabase session:', error);
    } else {
      console.log('Supabase session retrieved');
    }
  } catch (error) {
    console.error('Error syncing auth:', error);
  }
};

// Listen for auth state changes
export const setupAuthListener = (callback: (user: { id: string; email?: string } | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase auth state changed:', event, session?.user?.id);
    callback(session?.user || null);
  });
};

// Get current Supabase user
export const getCurrentSupabaseUser = () => {
  return supabase.auth.getUser();
};

// Sign out from Supabase
export const signOutSupabase = async () => {
  try {
    await supabase.auth.signOut();
    console.log('Signed out from Supabase');
  } catch (error) {
    console.error('Error signing out from Supabase:', error);
  }
}; 