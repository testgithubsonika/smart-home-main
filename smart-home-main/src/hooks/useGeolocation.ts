import { useState, useEffect, useCallback } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationState {
  position: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: GeolocationOptions = {
  enableHighAccuracy: false, // Coarse location is enough for verification
  timeout: 10000,
  maximumAge: 300000, // 5 minutes
};

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    isLoading: false,
    error: null,
    permission: 'unknown',
  });

  const mergedOptions = { ...defaultOptions, ...options };

  // Check if geolocation is supported
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Get current permission status
  const getPermissionStatus = useCallback(async (): Promise<GeolocationState['permission']> => {
    if (!isSupported) return 'denied';

    try {
      // Check if we can get permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return permission.state as GeolocationState['permission'];
      }
      
      // Fallback: try to get current position to check permission
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve('denied');
            } else {
              resolve('prompt');
            }
          },
          { timeout: 1000 }
        );
      });
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      return 'unknown';
    }
  }, [isSupported]);

  // Request current position
  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported in this browser' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          },
          (error) => {
            let errorMessage = 'Failed to get location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your device settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = `Location error: ${error.message}`;
            }
            
            reject(new Error(errorMessage));
          },
          mergedOptions
        );
      });

      setState(prev => ({
        ...prev,
        position,
        isLoading: false,
        permission: 'granted',
      }));

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown location error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return null;
    }
  }, [isSupported, mergedOptions]);

  // Watch position (for continuous updates)
  const watchPosition = useCallback((callback: (position: GeolocationPosition) => void) => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported in this browser' }));
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const position = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };

        setState(prev => ({
          ...prev,
          position,
          permission: 'granted',
        }));

        callback(position);
      },
      (error) => {
        let errorMessage = 'Failed to watch location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
      },
      mergedOptions
    );

    return watchId;
  }, [isSupported, mergedOptions]);

  // Clear position watching
  const clearWatch = useCallback((watchId: number) => {
    if (isSupported) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, [isSupported]);

  // Request permission explicitly
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported in this browser' }));
      return false;
    }

    try {
      const position = await getCurrentPosition();
      return position !== null;
    } catch (error) {
      return false;
    }
  }, [isSupported, getCurrentPosition]);

  // Initialize permission status on mount
  useEffect(() => {
    const initPermission = async () => {
      const permission = await getPermissionStatus();
      setState(prev => ({ ...prev, permission }));
    };

    initPermission();
  }, [getPermissionStatus]);

  // Listen for permission changes
  useEffect(() => {
    if (!isSupported || !('permissions' in navigator)) return;

    const permission = navigator.permissions.query({ name: 'geolocation' as PermissionName });
    
    permission.then((result) => {
      const handleChange = () => {
        setState(prev => ({ ...prev, permission: result.state as GeolocationState['permission'] }));
      };

      result.addEventListener('change', handleChange);
      
      return () => {
        result.removeEventListener('change', handleChange);
      };
    });
  }, [isSupported]);

  return {
    // State
    position: state.position,
    isLoading: state.isLoading,
    error: state.error,
    permission: state.permission,
    isSupported,
    
    // Actions
    getCurrentPosition,
    watchPosition,
    clearWatch,
    requestPermission,
    getPermissionStatus,
  };
}; 