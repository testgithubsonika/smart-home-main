// WebAuthn utility functions integrated with Clerk authentication

import { useUser } from '@clerk/clerk-react';

export interface WebAuthnCredential {
  id: string;
  type: string;
  transports?: string[];
}

export interface RegistrationOptions {
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

export interface AuthenticationOptions {
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

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64url to base64
export function base64UrlToBase64(base64url: string): string {
  return base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');
}

// Convert base64 to base64url
export function base64ToBase64Url(base64: string): string {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate a random challenge
export function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array);
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return window.PublicKeyCredential !== undefined;
}

// Check if biometric authentication is available
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

// Create registration options for Clerk user
export function createClerkRegistrationOptions(
  challenge: string,
  clerkUser: any,
  rpName: string = 'Smart Home',
  rpId: string = window.location.hostname
): RegistrationOptions {
  return {
    challenge: base64ToArrayBuffer(challenge),
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: base64ToArrayBuffer(clerkUser.id),
      name: clerkUser.emailAddresses[0]?.emailAddress || clerkUser.id,
      displayName: clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || clerkUser.id,
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7, // ES256
      },
    ],
    timeout: 60000,
    attestation: 'direct',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: false,
    },
  };
}

// Create authentication options for Clerk user
export function createClerkAuthenticationOptions(
  challenge: string,
  credentialId: string,
  rpId: string = window.location.hostname
): AuthenticationOptions {
  return {
    challenge: base64ToArrayBuffer(challenge),
    rpId: rpId,
    allowCredentials: [
      {
        type: 'public-key',
        id: base64ToArrayBuffer(credentialId),
        transports: ['internal'],
      },
    ],
    userVerification: 'required',
    timeout: 60000,
  };
}

// Register a new credential
export async function registerCredential(
  options: RegistrationOptions
): Promise<PublicKeyCredential> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: options,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    return credential;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Authenticate with existing credential
export async function authenticateCredential(
  options: AuthenticationOptions
): Promise<PublicKeyCredential> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: options,
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Failed to get assertion');
    }

    return assertion;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Extract credential data for server verification
export function extractCredentialData(credential: PublicKeyCredential) {
  if (credential.type !== 'public-key') {
    throw new Error('Invalid credential type');
  }

  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  
  if ('attestationObject' in response) {
    // Registration response
    return {
      id: credential.id,
      type: credential.type,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        attestationObject: arrayBufferToBase64(response.attestationObject),
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
      },
    };
  } else {
    // Authentication response
    return {
      id: credential.id,
      type: credential.type,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        authenticatorData: arrayBufferToBase64(response.authenticatorData),
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        signature: arrayBufferToBase64(response.signature),
        userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : undefined,
      },
    };
  }
}

// Hook to get Clerk user data for WebAuthn
export function useClerkUserForWebAuthn() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
  };
} 