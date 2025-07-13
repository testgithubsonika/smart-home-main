export interface PermissionState {
  camera: 'granted' | 'denied' | 'prompt';
  microphone: 'granted' | 'denied' | 'prompt';
}

export interface PermissionRequest {
  camera?: boolean;
  microphone?: boolean;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private permissionState: PermissionState = {
    camera: 'prompt',
    microphone: 'prompt',
  };

  private listeners: Set<(state: PermissionState) => void> = new Set();

  private constructor() {
    this.initializePermissions();
  }

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  private async initializePermissions(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

        this.permissionState.camera = cameraPermission.state as 'granted' | 'denied' | 'prompt';
        this.permissionState.microphone = micPermission.state as 'granted' | 'denied' | 'prompt';

        // Listen for permission changes
        cameraPermission.addEventListener('change', () => {
          this.permissionState.camera = cameraPermission.state as 'granted' | 'denied' | 'prompt';
          this.notifyListeners();
        });

        micPermission.addEventListener('change', () => {
          this.permissionState.microphone = micPermission.state as 'granted' | 'denied' | 'prompt';
          this.notifyListeners();
        });

        this.notifyListeners();
      } catch (error) {
        console.warn('Permission API not supported:', error);
      }
    }
  }

  public getPermissionState(): PermissionState {
    return { ...this.permissionState };
  }

  public async requestPermissions(permissions: PermissionRequest): Promise<PermissionState> {
    const constraints: MediaStreamConstraints = {};

    if (permissions.camera) {
      constraints.video = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };
    }

    if (permissions.microphone) {
      constraints.audio = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update permission states
      if (permissions.camera) {
        this.permissionState.camera = 'granted';
      }
      if (permissions.microphone) {
        this.permissionState.microphone = 'granted';
      }

      // Stop the stream immediately since we only needed it for permission
      stream.getTracks().forEach(track => track.stop());

      this.notifyListeners();
      return this.getPermissionState();
    } catch (error) {
      console.error('Permission request failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          // User denied permission
          if (permissions.camera) {
            this.permissionState.camera = 'denied';
          }
          if (permissions.microphone) {
            this.permissionState.microphone = 'denied';
          }
        } else if (error.name === 'NotFoundError') {
          // Device not found
          throw new Error('Camera or microphone not found. Please check your device connections.');
        } else if (error.name === 'NotReadableError') {
          // Device is busy
          throw new Error('Camera or microphone is currently in use by another application.');
        } else if (error.name === 'OverconstrainedError') {
          // Constraints not satisfied
          throw new Error('Camera or microphone does not meet the required specifications.');
        } else if (error.name === 'TypeError') {
          // Invalid constraints
          throw new Error('Invalid camera or microphone configuration.');
        } else if (error.name === 'AbortError') {
          // Request aborted
          throw new Error('Permission request was aborted.');
        } else if (error.name === 'SecurityError') {
          // Security error (e.g., not HTTPS)
          throw new Error('Camera and microphone access requires a secure connection (HTTPS).');
        }
      }
      
      throw new Error('Failed to access camera or microphone. Please check your browser settings.');
    }
  }

  public async requestCameraPermission(): Promise<boolean> {
    try {
      await this.requestPermissions({ camera: true });
      return this.permissionState.camera === 'granted';
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return false;
    }
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      await this.requestPermissions({ microphone: true });
      return this.permissionState.microphone === 'granted';
    } catch (error) {
      console.error('Microphone permission request failed:', error);
      return false;
    }
  }

  public async requestBothPermissions(): Promise<boolean> {
    try {
      await this.requestPermissions({ camera: true, microphone: true });
      return this.permissionState.camera === 'granted' && this.permissionState.microphone === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  public hasCameraPermission(): boolean {
    return this.permissionState.camera === 'granted';
  }

  public hasMicrophonePermission(): boolean {
    return this.permissionState.microphone === 'granted';
  }

  public hasBothPermissions(): boolean {
    return this.hasCameraPermission() && this.hasMicrophonePermission();
  }

  public addListener(callback: (state: PermissionState) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const state = this.getPermissionState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in permission listener:', error);
      }
    });
  }

  public getPermissionInstructions(): string[] {
    const instructions: string[] = [];

    if (this.permissionState.camera === 'denied') {
      instructions.push(
        'Camera access is required for floor plan capture.',
        'To enable camera access:',
        '1. Click the camera icon in your browser\'s address bar',
        '2. Select "Allow" for camera access',
        '3. Refresh the page'
      );
    }

    if (this.permissionState.microphone === 'denied') {
      instructions.push(
        'Microphone access is required for ambient noise measurement.',
        'To enable microphone access:',
        '1. Click the microphone icon in your browser\'s address bar',
        '2. Select "Allow" for microphone access',
        '3. Refresh the page'
      );
    }

    return instructions;
  }

  public async checkDeviceSupport(): Promise<{
    camera: boolean;
    microphone: boolean;
    permissions: boolean;
  }> {
    const support = {
      camera: false,
      microphone: false,
      permissions: false,
    };

    // Check if getUserMedia is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      support.permissions = true;
    }

    // Check if permissions API is supported
    if ('permissions' in navigator) {
      support.permissions = true;
    }

    // Check device support by trying to enumerate devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');

      support.camera = hasCamera;
      support.microphone = hasMicrophone;
    } catch (error) {
      console.warn('Could not enumerate devices:', error);
    }

    return support;
  }
}

// Export singleton instance
export const permissionManager = PermissionManager.getInstance();

// Convenience functions
export const requestCameraPermission = () => permissionManager.requestCameraPermission();
export const requestMicrophonePermission = () => permissionManager.requestMicrophonePermission();
export const requestBothPermissions = () => permissionManager.requestBothPermissions();
export const getPermissionState = () => permissionManager.getPermissionState();
export const hasCameraPermission = () => permissionManager.hasCameraPermission();
export const hasMicrophonePermission = () => permissionManager.hasMicrophonePermission();
export const hasBothPermissions = () => permissionManager.hasBothPermissions(); 