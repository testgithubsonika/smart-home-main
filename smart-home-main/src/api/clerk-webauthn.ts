// Clerk-integrated API layer for WebAuthn authentication

import { useAuth } from '@clerk/clerk-react';

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

export interface RegistrationResponse {
  challenge: RegistrationChallenge;
  sessionId: string;
}

export interface RegistrationVerificationRequest {
  sessionId: string;
  credentialData: {
    id: string;
    type: string;
    rawId: string;
    response: {
      attestationObject: string;
      clientDataJSON: string;
    };
  };
}

export interface AuthenticationRequest {
  userId: string;
}

export interface AuthenticationResponse {
  challenge: AuthenticationChallenge;
  sessionId: string;
}

export interface AuthenticationVerificationRequest {
  sessionId: string;
  credentialData: {
    id: string;
    type: string;
    rawId: string;
    response: {
      authenticatorData: string;
      clientDataJSON: string;
      signature: string;
      userHandle?: string;
    };
  };
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

// Mock API functions for Clerk integration
// In a real implementation, these would call your backend API

// Get registration challenge from server
export async function getClerkRegistrationChallenge(
  request: RegistrationRequest
): Promise<RegistrationResponse> {
  try {
    // Mock implementation - in real app, this would call your backend
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
  request: RegistrationVerificationRequest
): Promise<AuthResponse> {
  try {
    // Mock implementation - in real app, this would call your backend
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // Store credential in localStorage for demo purposes
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '{}');
    credentials[request.credentialData.id] = {
      ...request.credentialData,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('webauthn_credentials', JSON.stringify(credentials));
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying registration:', error);
    throw new Error('Failed to verify registration');
  }
}

// Get authentication challenge from server
export async function getClerkAuthenticationChallenge(
  request: AuthenticationRequest
): Promise<AuthenticationResponse> {
  try {
    // Mock implementation - in real app, this would call your backend
    const challenge = generateMockChallenge();
    
    // Get stored credentials for the user
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '{}');
    const userCredentials = Object.values(credentials).filter((cred: any) => 
      cred.userId === request.userId
    );
    
    if (userCredentials.length === 0) {
      throw new Error('No credentials found for user');
    }
    
    const credential = userCredentials[0] as any;
    
    return {
      challenge: {
        challenge: challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            type: 'public-key',
            id: credential.id,
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
  request: AuthenticationVerificationRequest
): Promise<AuthResponse> {
  try {
    // Mock implementation - in real app, this would call your backend
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    throw new Error('Failed to verify authentication');
  }
}

// Check if user has registered credentials
export async function hasClerkCredentials(userId: string): Promise<boolean> {
  try {
    // Mock implementation - check localStorage for demo
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '{}');
    const userCredentials = Object.values(credentials).filter((cred: any) => 
      cred.userId === userId
    );
    return userCredentials.length > 0;
  } catch (error) {
    console.error('Error checking credentials:', error);
    return false;
  }
}

// Get user credentials
export async function getClerkUserCredentials(userId: string): Promise<any[]> {
  try {
    // Mock implementation - get from localStorage for demo
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '{}');
    return Object.values(credentials).filter((cred: any) => 
      cred.userId === userId
    );
  } catch (error) {
    console.error('Error getting user credentials:', error);
    throw new Error('Failed to get user credentials');
  }
}

// Delete a credential
export async function deleteClerkCredential(credentialId: string): Promise<void> {
  try {
    // Mock implementation - remove from localStorage for demo
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '{}');
    delete credentials[credentialId];
    localStorage.setItem('webauthn_credentials', JSON.stringify(credentials));
  } catch (error) {
    console.error('Error deleting credential:', error);
    throw new Error('Failed to delete credential');
  }
}

// Helper function to generate mock challenge
function generateMockChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
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