// Clerk-integrated API layer for WebAuthn authentication

import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

export interface RegistrationChallenge {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout: number;
  attestation: string;
  authenticatorSelection: {
    authenticatorAttachment: string;
    userVerification: string;
    requireResidentKey: boolean;
  };
}

export interface AuthenticationChallenge {
  challenge: string;
  rpId: string;
  allowCredentials: Array<{
    type: string;
    id: string;
    transports?: string[];
  }>;
  userVerification: string;
  timeout: number;
}

export interface RegistrationRequest {
  userId: string;
  userName: string;
  email: string;
}

export interface AuthenticationRequest {
  userId: string;
}

export interface RegistrationResponse {
  challenge: RegistrationChallenge;
  sessionId: string;
}

export interface AuthenticationResponse {
  challenge: AuthenticationChallenge;
  sessionId: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

// Generate a mock challenge for development
const generateMockChallenge = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Store WebAuthn credentials in Supabase
const storeCredential = async (credentialData: any, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credentialData.id,
        public_key: credentialData.response.attestationObject,
        sign_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing credential:', error);
      throw new Error('Failed to store credential');
    }
  } catch (error) {
    console.error('Error storing credential in Supabase:', error);
    throw error;
  }
};

// Get stored credentials from Supabase
const getStoredCredentials = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error retrieving credentials:', error);
      throw new Error('Failed to retrieve credentials');
    }

    return data || [];
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    throw error;
  }
};

// Update sign count in Supabase
const updateSignCount = async (credentialId: string, newSignCount: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('webauthn_credentials')
      .update({
        sign_count: newSignCount,
        updated_at: new Date().toISOString()
      })
      .eq('credential_id', credentialId);

    if (error) {
      console.error('Error updating sign count:', error);
      throw new Error('Failed to update sign count');
    }
  } catch (error) {
    console.error('Error updating sign count in Supabase:', error);
    throw error;
  }
};

// Get registration challenge from server
export async function getClerkRegistrationChallenge(
  request: RegistrationRequest
): Promise<RegistrationResponse> {
  try {
    // In production, this would call your backend API
    // For now, we'll generate a challenge locally
    const challenge = generateMockChallenge();
    
    return {
      challenge: {
        challenge: challenge,
        rp: {
          name: 'Smart Home',
          id: window.location.hostname,
        },
        user: {
          id: request.userId,
          name: request.email,
          displayName: request.userName,
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7,
          },
        ],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
      },
      sessionId: 'session_' + Date.now(),
    };
  } catch (error) {
    console.error('Error getting registration challenge:', error);
    throw new Error('Failed to get registration challenge');
  }
}

// Verify registration with server
export async function verifyClerkRegistration(
  request: {
    sessionId: string;
    credentialData: any;
    userId: string;
  }
): Promise<AuthResponse> {
  try {
    // In production, this would verify the attestation with your backend
    // For now, we'll store the credential in Supabase
    await storeCredential(request.credentialData, request.userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying registration:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration verification failed' 
    };
  }
}

// Get authentication challenge from server
export async function getClerkAuthenticationChallenge(
  request: AuthenticationRequest
): Promise<AuthenticationResponse> {
  try {
    // Get stored credentials for the user
    const credentials = await getStoredCredentials(request.userId);
    
    if (credentials.length === 0) {
      throw new Error('No credentials found for user');
    }
    
    const credential = credentials[0];
    const challenge = generateMockChallenge();
    
    return {
      challenge: {
        challenge: challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            type: 'public-key',
            id: credential.credential_id,
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
      sessionId: 'session_' + Date.now(),
    };
  } catch (error) {
    console.error('Error getting authentication challenge:', error);
    throw new Error('Failed to get authentication challenge');
  }
}

// Verify authentication with server
export async function verifyClerkAuthentication(
  request: {
    sessionId: string;
    credentialData: any;
    userId: string;
  }
): Promise<AuthResponse> {
  try {
    // In production, this would verify the assertion with your backend
    // For now, we'll just update the sign count
    await updateSignCount(request.credentialData.id, 1);
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication verification failed' 
    };
  }
}

// Check if user has WebAuthn credentials
export async function hasClerkCredentials(userId: string): Promise<boolean> {
  try {
    const credentials = await getStoredCredentials(userId);
    return credentials.length > 0;
  } catch (error) {
    console.error('Error checking credentials:', error);
    return false;
  }
}

// Get user's WebAuthn credentials
export async function getClerkUserCredentials(userId: string): Promise<any[]> {
  try {
    return await getStoredCredentials(userId);
  } catch (error) {
    console.error('Error getting user credentials:', error);
    return [];
  }
}

// Delete a WebAuthn credential
export async function deleteClerkCredential(credentialId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('credential_id', credentialId);

    if (error) {
      console.error('Error deleting credential:', error);
      throw new Error('Failed to delete credential');
    }
  } catch (error) {
    console.error('Error deleting credential from Supabase:', error);
    throw error;
  }
}

// Hook to use Clerk auth with WebAuthn
export function useClerkWebAuthn() {
  const { getToken } = useAuth();
  
  const getAuthToken = async () => {
    try {
      return await getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };
  
  return { getAuthToken };
} 