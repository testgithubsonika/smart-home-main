// This file has been migrated to Supabase
// All functionality is now available in @/services/supabaseService

import { supabase } from "@/lib/supabase";

export const saveVerificationResult = async (userId: string, verified: boolean) => {
  const { error } = await supabase
    .from("identity_verifications")
    .upsert({
      user_id: userId,
      verified,
      verified_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving verification result:', error);
    throw error;
  }
};

export const checkVerificationStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("verified")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error('Error checking verification status:', error);
    return false;
  }

  return data?.verified === true;
};
