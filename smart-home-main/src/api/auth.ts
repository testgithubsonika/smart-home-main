// API layer for WebAuthn authentication

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

// Get registration challenge from server
export async function getRegistrationChallenge(
  request: RegistrationRequest
): Promise<RegistrationResponse> {
  try {
    const response = await apiClient.post('/auth/webauthn/register/challenge', request);
    return response.data;
  } catch (error) {
    console.error('Error getting registration challenge:', error);
    throw new Error('Failed to get registration challenge');
  }
}

// Verify registration with server
export async function verifyRegistration(
  request: RegistrationVerificationRequest
): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/auth/webauthn/register/verify', request);
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying registration:', error);
    throw new Error('Failed to verify registration');
  }
}

// Get authentication challenge from server
export async function getAuthenticationChallenge(
  request: AuthenticationRequest
): Promise<AuthenticationResponse> {
  try {
    const response = await apiClient.post('/auth/webauthn/authenticate/challenge', request);
    return response.data;
  } catch (error) {
    console.error('Error getting authentication challenge:', error);
    throw new Error('Failed to get authentication challenge');
  }
}

// Verify authentication with server
export async function verifyAuthentication(
  request: AuthenticationVerificationRequest
): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/auth/webauthn/authenticate/verify', request);
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    throw new Error('Failed to verify authentication');
  }
}

// Check if user has registered credentials
export async function hasCredentials(userId: string): Promise<boolean> {
  try {
    const response = await apiClient.get(`/auth/webauthn/credentials/${userId}`);
    return response.data.hasCredentials;
  } catch (error) {
    console.error('Error checking credentials:', error);
    return false;
  }
}

// Get user credentials
export async function getUserCredentials(userId: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/auth/webauthn/credentials/${userId}`);
    return response.data.credentials;
  } catch (error) {
    console.error('Error getting user credentials:', error);
    throw new Error('Failed to get user credentials');
  }
}

// Delete a credential
export async function deleteCredential(credentialId: string): Promise<void> {
  try {
    await apiClient.delete(`/auth/webauthn/credentials/${credentialId}`);
  } catch (error) {
    console.error('Error deleting credential:', error);
    throw new Error('Failed to delete credential');
  }
}

// Logout user
export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Get current user from localStorage
export function getCurrentUser(): any {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
} 