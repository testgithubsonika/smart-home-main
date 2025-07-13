import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { FingerprintAuth } from '@/components/FingerprintAuth';
import { isAuthenticated, getCurrentUser } from '@/api/auth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface BiometricLoginProps {
  onSuccess: (user: User) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  userId?: string;
}

export const BiometricLogin: React.FC<BiometricLoginProps> = ({
  onSuccess,
  onError,
  onCancel,
  userId,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleFingerprintSuccess = (user: User) => {
    onSuccess(user);
  };

  const handleFingerprintError = (error: string) => {
    onError?.(error);
  };

  if (!currentUser && !userId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground text-center">
            No user information available for biometric authentication
          </p>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <FingerprintAuth
      mode="authenticate"
      userId={userId || currentUser?.id}
      onSuccess={handleFingerprintSuccess}
      onError={handleFingerprintError}
      onCancel={onCancel}
    />
  );
};
