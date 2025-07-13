import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Navigation, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { useGeolocation, GeolocationPosition } from '@/hooks/useGeolocation';
import { Map, SimpleMap } from '@/components/Map';

export interface LocationVerificationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  method: 'browser-geolocation';
  verified: boolean;
}

export interface LocationVerifierProps {
  onVerificationComplete: (data: LocationVerificationData) => void;
  onCancel?: () => void;
  className?: string;
  showMap?: boolean;
  requiredAccuracy?: number; // Maximum accuracy in meters (e.g., 100 for 100m accuracy)
}

type VerificationStep = 'initial' | 'requesting' | 'confirming' | 'verified' | 'error';

export const LocationVerifier: React.FC<LocationVerifierProps> = ({
  onVerificationComplete,
  onCancel,
  className = '',
  showMap = true,
  requiredAccuracy = 100, // Default 100m accuracy requirement
}) => {
  const [step, setStep] = useState<VerificationStep>('initial');
  const [detectedPosition, setDetectedPosition] = useState<GeolocationPosition | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    position,
    isLoading,
    error,
    permission,
    isSupported,
    getCurrentPosition,
    requestPermission,
  } = useGeolocation();

  // Handle position updates
  useEffect(() => {
    if (position && step === 'requesting') {
      setDetectedPosition(position);
      setStep('confirming');
    }
  }, [position, step]);

  // Handle errors
  useEffect(() => {
    if (error && step === 'requesting') {
      setStep('error');
      toast.error(error);
    }
  }, [error, step]);

  // Check if accuracy meets requirements
  const isAccuracyAcceptable = (accuracy: number) => {
    return accuracy <= requiredAccuracy;
  };

  // Handle location request
  const handleRequestLocation = async () => {
    setStep('requesting');
    setIsRetrying(false);

    try {
      const success = await requestPermission();
      if (!success) {
        setStep('error');
      }
    } catch (error) {
      setStep('error');
      toast.error('Failed to request location permission');
    }
  };

  // Handle retry
  const handleRetry = async () => {
    setIsRetrying(true);
    setStep('requesting');
    
    try {
      const success = await requestPermission();
      if (!success) {
        setStep('error');
      }
    } catch (error) {
      setStep('error');
      toast.error('Failed to retry location detection');
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle location confirmation
  const handleConfirmLocation = () => {
    if (!detectedPosition) return;

    const verificationData: LocationVerificationData = {
      latitude: detectedPosition.latitude,
      longitude: detectedPosition.longitude,
      accuracy: detectedPosition.accuracy,
      timestamp: detectedPosition.timestamp,
      method: 'browser-geolocation',
      verified: true,
    };

    setStep('verified');
    onVerificationComplete(verificationData);
    toast.success('Location verified successfully!');
  };

  // Handle location rejection
  const handleRejectLocation = () => {
    setStep('initial');
    setDetectedPosition(null);
    toast.info('Location rejected. You can try again.');
  };

  // Render initial state
  if (step === 'initial') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Verification
          </CardTitle>
          <CardDescription>
            Verify that you are physically near the property you're listing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              We need to verify your location to ensure you're listing a property you have access to. 
              This helps maintain trust and safety in our community.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Privacy & Security</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Your location is only used for verification</li>
              <li>• We don't store your exact location</li>
              <li>• You can retry if the location is incorrect</li>
              <li>• Coarse location (±{requiredAccuracy}m) is sufficient</li>
            </ul>
          </div>

          {!isSupported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Geolocation is not supported in this browser. Please use a modern browser with location support.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleRequestLocation}
              disabled={!isSupported}
              className="flex-1"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Detect My Location
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render requesting state
  if (step === 'requesting') {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">
              {isRetrying ? 'Retrying Location Detection...' : 'Detecting Your Location...'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Please allow location access when prompted by your browser
            </p>
          </div>
          
          {permission === 'denied' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Location permission was denied. Please enable location access in your browser settings and try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render confirmation state
  if (step === 'confirming' && detectedPosition) {
    const accuracyAcceptable = isAccuracyAcceptable(detectedPosition.accuracy);
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Confirm Your Location
          </CardTitle>
          <CardDescription>
            We detected your approximate location. Please confirm this is where your property is located.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Detected Location</span>
            </div>
            <Badge variant={accuracyAcceptable ? "default" : "destructive"}>
              {accuracyAcceptable ? "Good Accuracy" : "Low Accuracy"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Latitude:</span>
              <div className="font-mono">{detectedPosition.latitude.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Longitude:</span>
              <div className="font-mono">{detectedPosition.longitude.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Accuracy:</span>
              <div className="font-mono">±{Math.round(detectedPosition.accuracy)}m</div>
            </div>
            <div>
              <span className="text-muted-foreground">Detected:</span>
              <div className="font-mono">
                {new Date(detectedPosition.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {!accuracyAcceptable && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Location accuracy is lower than recommended (±{requiredAccuracy}m). 
                You can retry for better accuracy or continue if this location is correct.
              </AlertDescription>
            </Alert>
          )}

          {/* Map Display */}
          {showMap && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Location on Map</h4>
                <Map
                  latitude={detectedPosition.latitude}
                  longitude={detectedPosition.longitude}
                  accuracy={detectedPosition.accuracy}
                  height="200px"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmLocation}
              className="flex-1"
              disabled={!accuracyAcceptable}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Yes, This is Correct
            </Button>
            <Button
              onClick={handleRejectLocation}
              variant="outline"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              No, Retry
            </Button>
          </div>

          {!accuracyAcceptable && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry for Better Accuracy
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render verified state
  if (step === 'verified') {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Location Verified!</h3>
            <p className="text-sm text-muted-foreground">
              Your location has been successfully verified. You can now continue with your listing.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (step === 'error') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Location Detection Failed
          </CardTitle>
          <CardDescription>
            We couldn't detect your location. Please try again or check your browser settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <h4 className="font-medium">Troubleshooting:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Check if location services are enabled on your device</li>
              <li>• Ensure your browser has permission to access location</li>
              <li>• Try refreshing the page and try again</li>
              <li>• Make sure you're using a supported browser</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRetry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}; 