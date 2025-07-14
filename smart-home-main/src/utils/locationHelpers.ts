// This file has been migrated to Supabase
// All functionality is now available in @/services/supabaseService

import { supabase } from '@/lib/supabase';

export interface LocationVerificationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  method: 'browser-geolocation';
  verified: boolean;
}

export interface LocationVerificationMetadata {
  userId: string;
  listingId?: string;
  verificationData: LocationVerificationData;
  createdAt: Date;
  updatedAt: Date;
}

// Save location verification data to Supabase
export const saveLocationVerification = async (
  userId: string,
  verificationData: LocationVerificationData,
  listingId?: string
): Promise<void> => {
  try {
    const metadata = {
      user_id: userId,
      listing_id: listingId,
      verification_data: verificationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to user's verification document
    const { error } = await supabase
      .from('location_verifications')
      .upsert(metadata, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

    console.log('Location verification saved successfully');
  } catch (error) {
    console.error('Error saving location verification:', error);
    throw new Error('Failed to save location verification');
  }
};

// Get location verification data for a user
export const getLocationVerification = async (
  userId: string
): Promise<LocationVerificationMetadata | null> => {
  try {
    const { data, error } = await supabase
      .from('location_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting location verification:', error);
      return null;
    }

    if (data) {
      return {
        userId: data.user_id,
        listingId: data.listing_id,
        verificationData: data.verification_data,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as LocationVerificationMetadata;
    }

    return null;
  } catch (error) {
    console.error('Error getting location verification:', error);
    return null;
  }
};

// Check if location verification is recent (within 24 hours)
export const isLocationVerificationRecent = (
  verificationData: LocationVerificationData,
  maxAgeHours: number = 24
): boolean => {
  const now = Date.now();
  const verificationTime = verificationData.timestamp;
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

  return (now - verificationTime) < maxAgeMs;
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance * 1000; // Convert to meters
};

// Check if a location is within acceptable range of a reference point
export const isLocationWithinRange = (
  userLat: number,
  userLon: number,
  referenceLat: number,
  referenceLon: number,
  maxDistanceMeters: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, referenceLat, referenceLon);
  return distance <= maxDistanceMeters;
};

// Format location data for display
export const formatLocationData = (verificationData: LocationVerificationData): string => {
  const { latitude, longitude, accuracy } = verificationData;
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
};

// Get location accuracy level description
export const getAccuracyLevel = (accuracy: number): string => {
  if (accuracy <= 10) return 'Very High';
  if (accuracy <= 50) return 'High';
  if (accuracy <= 100) return 'Good';
  if (accuracy <= 500) return 'Fair';
  return 'Low';
};

// Validate location verification data
export const validateLocationVerification = (
  data: LocationVerificationData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (typeof data.latitude !== 'number' || isNaN(data.latitude)) {
    errors.push('Invalid latitude');
  }

  if (typeof data.longitude !== 'number' || isNaN(data.longitude)) {
    errors.push('Invalid longitude');
  }

  if (typeof data.accuracy !== 'number' || isNaN(data.accuracy) || data.accuracy < 0) {
    errors.push('Invalid accuracy value');
  }

  if (typeof data.timestamp !== 'number' || isNaN(data.timestamp)) {
    errors.push('Invalid timestamp');
  }

  if (data.method !== 'browser-geolocation') {
    errors.push('Invalid verification method');
  }

  if (typeof data.verified !== 'boolean') {
    errors.push('Invalid verification status');
  }

  // Check if coordinates are within valid ranges
  if (data.latitude < -90 || data.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude < -180 || data.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}; 