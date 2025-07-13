import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

export interface MapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  className?: string;
  height?: string;
  showAccuracy?: boolean;
}

export const Map: React.FC<MapProps> = ({
  latitude,
  longitude,
  accuracy,
  className = '',
  height = '300px',
  showAccuracy = true,
}) => {
  const googleMapsUrl = `https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA-EjmMCNwhpNi1SJE8e12ZXC2NZRssgzA'}&center=${latitude},${longitude}&zoom=15&maptype=roadmap`;

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Google Maps Embed */}
          <iframe
            src={googleMapsUrl}
            width="100%"
            height={height}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
          />
          
          {/* Location Info Overlay */}
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-medium">Your Location</div>
                <div className="text-muted-foreground">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
                {showAccuracy && accuracy && (
                  <div className="text-xs text-muted-foreground">
                    Accuracy: ±{Math.round(accuracy)}m
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Fallback map component for when Google Maps is not available
export const SimpleMap: React.FC<MapProps> = ({
  latitude,
  longitude,
  accuracy,
  className = '',
  height = '300px',
  showAccuracy = true,
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Navigation className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Location Detected</h3>
              <p className="text-sm text-muted-foreground">
                Latitude: {latitude.toFixed(6)}
              </p>
              <p className="text-sm text-muted-foreground">
                Longitude: {longitude.toFixed(6)}
              </p>
              {showAccuracy && accuracy && (
                <p className="text-sm text-muted-foreground">
                  Accuracy: ±{Math.round(accuracy)} meters
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View on Google Maps →
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 