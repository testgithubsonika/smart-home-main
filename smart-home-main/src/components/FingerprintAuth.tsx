import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Fingerprint, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  isWebAuthnSupported,
  isBiometricAvailable,
  createRegistrationOptions,
  createAuthenticationOptions,
  registerCredential,
  authenticateCredential,
  extractCredentialData,
} from '@/utils/webauthn';

import {
  getRegistrationChallenge,
  verifyRegistration,
  getAuthenticationChallenge,
  verifyAuthentication,
  hasCredentials,
  RegistrationRequest,
  AuthenticationRequest,
} from '@/api/auth';

interface FingerprintAuthProps {
  mode: 'register' | 'authenticate';
  userId?: string;
  userName?: string;
  userEmail?: string;
  onSuccess: (user: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface AuthState {
  isSupported: boolean;
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  step: 'checking' | 'ready' | 'processing' | 'success' | 'error';
}

export const FingerprintAuth: React.FC<FingerprintAuthProps> = ({
  mode,
  userId,
  userName,
  userEmail,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [state, setState] = useState<AuthState>({
    isSupported: false,
    isAvailable: false,
    isLoading: true,
    error: null,
    step: 'checking',
  });

  // Check WebAuthn support and biometric availability
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = isWebAuthnSupported();
        const available = supported ? await isBiometricAvailable() : false;

        setState(prev => ({
          ...prev,
          isSupported: supported,
          isAvailable: available,
          isLoading: false,
          step: available ? 'ready' : 'error',
          error: !supported 
            ? 'WebAuthn is not supported in this browser'
            : !available 
            ? 'Biometric authentication is not available on this device'
            : null,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          step: 'error',
          error: 'Failed to check biometric availability',
        }));
      }
    };

    checkSupport();
  }, []);

  // Handle registration process
  const handleRegister = useCallback(async () => {
    if (!userId || !userName || !userEmail) {
      setState(prev => ({
        ...prev,
        error: 'Missing user information for registration',
        step: 'error',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, step: 'processing', error: null }));

    try {
      // Step 1: Get registration challenge from server
      const registrationRequest: RegistrationRequest = {
        userId,
        userName,
        email: userEmail,
      };

      const challengeResponse = await getRegistrationChallenge(registrationRequest);
      
      // Step 2: Create registration options
      const options = createRegistrationOptions(
        challengeResponse.challenge.challenge,
        challengeResponse.challenge.user.id,
        challengeResponse.challenge.user.name,
        challengeResponse.challenge.rp.name,
        challengeResponse.challenge.rp.id
      );

      // Step 3: Register credential with browser
      const credential = await registerCredential(options);

      // Step 4: Extract credential data
      const credentialData = extractCredentialData(credential);

      // Step 5: Verify with server
      const verificationResult = await verifyRegistration({
        sessionId: challengeResponse.sessionId,
        credentialData,
      });

      if (verificationResult.success) {
        setState(prev => ({ ...prev, step: 'success', isLoading: false }));
        toast.success('Fingerprint registration successful!');
        onSuccess(verificationResult.user);
      } else {
        throw new Error(verificationResult.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        step: 'error',
        isLoading: false,
      }));
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [userId, userName, userEmail, onSuccess, onError]);

  // Handle authentication process
  const handleAuthenticate = useCallback(async () => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        error: 'Missing user ID for authentication',
        step: 'error',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, step: 'processing', error: null }));

    try {
      // Step 1: Check if user has credentials
      const hasUserCredentials = await hasCredentials(userId);
      if (!hasUserCredentials) {
        throw new Error('No biometric credentials found for this user');
      }

      // Step 2: Get authentication challenge from server
      const authRequest: AuthenticationRequest = { userId };
      const challengeResponse = await getAuthenticationChallenge(authRequest);

      // Step 3: Create authentication options
      const options = createAuthenticationOptions(
        challengeResponse.challenge.challenge,
        challengeResponse.challenge.allowCredentials[0].id,
        challengeResponse.challenge.rpId
      );

      // Step 4: Authenticate with browser
      const assertion = await authenticateCredential(options);

      // Step 5: Extract assertion data
      const assertionData = extractCredentialData(assertion);

      // Step 6: Verify with server
      const verificationResult = await verifyAuthentication({
        sessionId: challengeResponse.sessionId,
        credentialData: assertionData,
      });

      if (verificationResult.success) {
        setState(prev => ({ ...prev, step: 'success', isLoading: false }));
        toast.success('Authentication successful!');
        onSuccess(verificationResult.user);
      } else {
        throw new Error(verificationResult.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        step: 'error',
        isLoading: false,
      }));
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [userId, onSuccess, onError]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setState(prev => ({ ...prev, step: 'ready', error: null }));
  }, []);

  // Render loading state
  if (state.isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {state.step === 'checking' ? 'Checking biometric support...' : 'Processing...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (state.step === 'error') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {mode === 'register' ? 'Registration Failed' : 'Authentication Failed'}
          </CardTitle>
          <CardDescription>
            {state.error}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {state.error}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="ghost">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render success state
  if (state.step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold">
            {mode === 'register' ? 'Registration Successful!' : 'Authentication Successful!'}
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            {mode === 'register' 
              ? 'Your fingerprint has been registered successfully.'
              : 'You have been authenticated successfully.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render ready state
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          {mode === 'register' ? 'Register Fingerprint' : 'Authenticate with Fingerprint'}
        </CardTitle>
        <CardDescription>
          {mode === 'register' 
            ? 'Set up fingerprint authentication for your account'
            : 'Use your fingerprint to sign in'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Your biometric data is stored securely on your device
          </span>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={mode === 'register' ? handleRegister : handleAuthenticate}
            className="w-full"
            size="lg"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            {mode === 'register' ? 'Register Fingerprint' : 'Authenticate'}
          </Button>
          
          {onCancel && (
            <Button onClick={onCancel} variant="ghost" className="w-full">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 