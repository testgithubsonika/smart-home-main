import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Fingerprint, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Trash2,
  Settings,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/clerk-react';

import { ClerkFingerprintAuth } from '@/components/ClerkFingerprintAuth';
import { hasClerkCredentials, deleteClerkCredential, getClerkUserCredentials } from '@/api/clerk-webauthn';

interface SecuritySettingsState {
  hasBiometric: boolean;
  isLoading: boolean;
  showFingerprintModal: boolean;
  modalMode: 'register' | 'authenticate';
  credentials: any[];
}

export const SecuritySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<SecuritySettingsState>({
    hasBiometric: false,
    isLoading: true,
    showFingerprintModal: false,
    modalMode: 'register',
    credentials: [],
  });

  // Check biometric status on component mount
  useEffect(() => {
    const checkBiometricStatus = async () => {
      if (!user) return;
      
      try {
        const hasCreds = await hasClerkCredentials(user.id);
        const creds = await getClerkUserCredentials(user.id);
        
        setState(prev => ({
          ...prev,
          hasBiometric: hasCreds,
          credentials: creds,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error checking biometric status:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (isLoaded && user) {
      checkBiometricStatus();
    }
  }, [user, isLoaded]);

  // Handle fingerprint registration
  const handleRegisterFingerprint = () => {
    setState(prev => ({
      ...prev,
      showFingerprintModal: true,
      modalMode: 'register',
    }));
  };

  // Handle fingerprint authentication
  const handleAuthenticateFingerprint = () => {
    setState(prev => ({
      ...prev,
      showFingerprintModal: true,
      modalMode: 'authenticate',
    }));
  };

  // Handle fingerprint success
  const handleFingerprintSuccess = () => {
    setState(prev => ({
      ...prev,
      showFingerprintModal: false,
      hasBiometric: true,
    }));
    
    // Refresh credentials list
    if (user) {
      getClerkUserCredentials(user.id).then(creds => {
        setState(prev => ({ ...prev, credentials: creds }));
      });
    }
  };

  // Handle fingerprint error
  const handleFingerprintError = (error: string) => {
    setState(prev => ({
      ...prev,
      showFingerprintModal: false,
    }));
    toast.error(error);
  };

  // Handle fingerprint cancel
  const handleFingerprintCancel = () => {
    setState(prev => ({
      ...prev,
      showFingerprintModal: false,
    }));
  };

  // Handle delete credential
  const handleDeleteCredential = async (credentialId: string) => {
    try {
      await deleteClerkCredential(credentialId);
      
      // Refresh the list
      if (user) {
        const creds = await getClerkUserCredentials(user.id);
        const hasCreds = creds.length > 0;
        
        setState(prev => ({
          ...prev,
          credentials: creds,
          hasBiometric: hasCreds,
        }));
      }
      
      toast.success('Fingerprint credential removed successfully');
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast.error('Failed to remove fingerprint credential');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading security settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.showFingerprintModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleFingerprintCancel}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
          
          <ClerkFingerprintAuth
            mode={state.modalMode}
            onSuccess={handleFingerprintSuccess}
            onError={handleFingerprintError}
            onCancel={handleFingerprintCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Security Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account security and authentication methods
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Biometric Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Fingerprint Authentication
              </CardTitle>
              <CardDescription>
                Use your fingerprint for quick and secure access to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="biometric-toggle" className="text-base font-medium">
                    Enable Fingerprint Login
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {state.hasBiometric 
                      ? 'Fingerprint authentication is enabled'
                      : 'Set up fingerprint authentication for faster login'
                    }
                  </p>
                </div>
                <Switch
                  id="biometric-toggle"
                  checked={state.hasBiometric}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleRegisterFingerprint();
                    } else {
                      // This would typically show a confirmation dialog
                      toast.info('Use the remove button below to disable fingerprint authentication');
                    }
                  }}
                />
              </div>

              {state.hasBiometric ? (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fingerprint authentication is active. You can use your fingerprint to sign in.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={handleAuthenticateFingerprint}
                      variant="outline"
                      className="w-full"
                    >
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Test Fingerprint Authentication
                    </Button>
                  </div>

                  {/* Registered Credentials */}
                  {state.credentials.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Registered Devices</h4>
                      {state.credentials.map((cred, index) => (
                        <div
                          key={cred.id || index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Fingerprint className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              Device {index + 1} - {new Date(cred.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            onClick={() => handleDeleteCredential(cred.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fingerprint authentication is not set up. Enable it for faster and more secure login.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={handleRegisterFingerprint}
                    className="w-full"
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Set Up Fingerprint Authentication
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Information
              </CardTitle>
              <CardDescription>
                Learn about the security measures protecting your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">How Fingerprint Authentication Works</h4>
                    <p className="text-sm text-muted-foreground">
                      Your fingerprint data is stored securely on your device using WebAuthn standards. 
                      It's never sent to our servers and can't be accessed by anyone else.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Security Benefits</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                      <li>• Faster login experience</li>
                      <li>• Protection against password theft</li>
                      <li>• Works even if you forget your password</li>
                      <li>• Industry-standard WebAuthn security</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Important Notes</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                      <li>• Only works on devices with fingerprint sensors</li>
                      <li>• You can still use your password as a backup</li>
                      <li>• Remove fingerprint access if you lose your device</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 