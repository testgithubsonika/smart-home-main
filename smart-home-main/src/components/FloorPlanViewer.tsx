import * as THREE from 'three';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Camera, 
  Mic, 
  Eye, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
// Firebase imports removed - using Supabase service instead
import { supabase } from '@/lib/supabase';

interface FloorPlanViewerProps {
  floorPlanUrl?: string;
  householdId?: string;
  userId?: string;
  onFloorPlanUpdate?: (url: string) => void;
  editable?: boolean;
}

interface FloorPlanData {
  id: string;
  householdId: string;
  userId: string;
  name: string;
  fileUrl: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FloorPlanViewer = ({ 
  floorPlanUrl, 
  householdId, 
  userId, 
  onFloorPlanUpdate,
  editable = true 
}: FloorPlanViewerProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFloorPlan, setCurrentFloorPlan] = useState<FloorPlanData | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isCapturing, setIsCapturing] = useState(false);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Check camera and microphone permissions
  const checkPermissions = async () => {
    try {
      // Check camera permission
      if ('permissions' in navigator) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(cameraPermission.state as 'granted' | 'denied' | 'prompt');
        
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(micPermission.state as 'granted' | 'denied' | 'prompt');
      }
    } catch (error) {
      console.warn('Permission API not supported, will request on use');
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      toast.success('Camera permission granted');
    } catch (error) {
      setCameraPermission('denied');
      toast.error('Camera permission denied');
    }
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      toast.success('Microphone permission granted');
    } catch (error) {
      setMicrophonePermission('denied');
      toast.error('Microphone permission denied');
    }
  };

  // Load floor plan from database
  const loadFloorPlanFromDatabase = useCallback(async () => {
    if (!householdId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('household_id', householdId)
        .single();
      
      if (error) {
        throw error;
      }

      if (data) {
        const floorPlanData: FloorPlanData = {
          id: data.id,
          householdId: data.household_id,
          userId: data.user_id,
          name: data.name,
          fileUrl: data.file_url,
          thumbnailUrl: data.thumbnail_url,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setCurrentFloorPlan(floorPlanData);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
      setError('Failed to load floor plan from database');
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  // Save floor plan to database
  const saveFloorPlanToDatabase = async (fileUrl: string, name: string) => {
    if (!householdId || !userId) {
      throw new Error('Missing householdId or userId');
    }

    const floorPlanData = {
      household_id: householdId,
      user_id: userId,
      name,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('floor_plans')
      .upsert(floorPlanData, { onConflict: 'household_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      const savedData: FloorPlanData = {
        id: data.id,
        householdId: data.household_id,
        userId: data.user_id,
        name: data.name,
        fileUrl: data.file_url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
      setCurrentFloorPlan(savedData);
      onFloorPlanUpdate?.(fileUrl);
    }
  };

  // Upload file to Supabase Storage
  const uploadFileToStorage = async (file: File): Promise<string> => {
    const filePath = `floorplans/${householdId || 'default'}/${file.name}`;
    const { data, error } = await supabase.storage
      .from('floorplans')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('floorplans')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      // Upload to Supabase Storage
      const fileUrl = await uploadFileToStorage(file);
      
      // Save to database
      await saveFloorPlanToDatabase(fileUrl, file.name);
      
      toast.success('Floor plan uploaded successfully');
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      setError('Failed to upload floor plan');
      toast.error('Failed to upload floor plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Capture floor plan using camera
  const handleCameraCapture = async () => {
    if (cameraPermission === 'denied') {
      toast.error('Camera permission is required');
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        } 
      });

      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;

      // Capture frame
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      // Stop stream
      stream.getTracks().forEach(track => track.stop());

      // Create file from blob
      const file = new File([blob], `floorplan-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload file
      const fileUrl = await uploadFileToStorage(file);
      await saveFloorPlanToDatabase(fileUrl, file.name);

      toast.success('Floor plan captured successfully');
    } catch (error) {
      console.error('Error capturing floor plan:', error);
      setError('Failed to capture floor plan');
      toast.error('Failed to capture floor plan');
    } finally {
      setIsCapturing(false);
    }
  };

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return;

    const newScene = new THREE.Scene();
    const newCamera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    
    newRenderer.setSize(400, 300);
    newRenderer.setClearColor(0xf0f0f0);
    mountRef.current.appendChild(newRenderer.domElement);

    newCamera.position.z = 5;

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    return { scene: newScene, camera: newCamera, renderer: newRenderer };
  }, []);

  // Load 3D model
  const loadModel = useCallback(async (url: string) => {
    if (!scene || !camera || !renderer) return;

    try {
      setError(null);
      
      // Clear existing objects
      while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
      }

      const loader = new THREE.ObjectLoader();
      
      loader.load(
        url,
        (object) => {
          scene.add(object);
          renderer.render(scene, camera);
        },
        undefined,
        (error) => {
          console.error('Error loading floor plan:', error);
          setError('Failed to load 3D floor plan. Please check the file format.');
          
          // Create a simple placeholder geometry
          const geometry = new THREE.BoxGeometry(2, 1, 2);
          const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
          const cube = new THREE.Mesh(geometry, material);
          scene.add(cube);
          renderer.render(scene, camera);
        }
      );
    } catch (error) {
      console.error('Error in loadModel:', error);
      setError('Failed to load floor plan model');
    }
  }, []); // Remove scene, camera, renderer dependencies to prevent circular updates

  // Camera controls
  const rotateCamera = useCallback((direction: 'left' | 'right') => {
    if (!camera || !scene || !renderer) return;
    
    const angle = direction === 'left' ? 0.1 : -0.1;
    camera.position.x = camera.position.x * Math.cos(angle) - camera.position.z * Math.sin(angle);
    camera.position.z = camera.position.x * Math.sin(angle) + camera.position.z * Math.cos(angle);
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }, [camera, scene, renderer]);

  const zoomCamera = useCallback((direction: 'in' | 'out') => {
    if (!camera || !scene || !renderer) return;
    
    const factor = direction === 'in' ? 0.9 : 1.1;
    camera.position.multiplyScalar(factor);
    renderer.render(scene, camera);
  }, [camera, scene, renderer]);

  // Initialize scene and load floor plan
  useEffect(() => {
    const { scene: newScene, camera: newCamera, renderer: newRenderer } = initializeScene() || {};
    
    if (newScene && newCamera && newRenderer) {
      const url = currentFloorPlan?.fileUrl || floorPlanUrl;
      
      // Only try to load if we have a valid URL
      if (url && url.trim() !== '') {
        // Use the new scene objects directly instead of the state variables
        const loadModelWithScene = async (url: string) => {
          try {
            setError(null);
            
            // Clear existing objects
            while(newScene.children.length > 0) { 
              newScene.remove(newScene.children[0]); 
            }

            const loader = new THREE.ObjectLoader();
            
            loader.load(
              url,
              (object) => {
                newScene.add(object);
                newRenderer.render(newScene, newCamera);
              },
              undefined,
              (error) => {
                console.error('Error loading floor plan:', error);
                setError('Failed to load 3D floor plan. Please check the file format.');
                
                // Create a simple placeholder geometry
                const geometry = new THREE.BoxGeometry(2, 1, 2);
                const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
                const cube = new THREE.Mesh(geometry, material);
                newScene.add(cube);
                newRenderer.render(newScene, newCamera);
              }
            );
          } catch (error) {
            console.error('Error in loadModel:', error);
            setError('Failed to load floor plan model');
          }
        };
        
        loadModelWithScene(url);
      } else {
        // Show placeholder when no floor plan is available
        const geometry = new THREE.BoxGeometry(2, 1, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        newScene.add(cube);
        newRenderer.render(newScene, newCamera);
      }
    }

    return () => {
      if (newRenderer) {
        newRenderer.dispose();
        if (mountRef.current && newRenderer.domElement) {
          mountRef.current.removeChild(newRenderer.domElement);
        }
      }
    };
  }, [initializeScene, currentFloorPlan, floorPlanUrl]); // Remove loadModel from dependencies

  // Load floor plan from database on mount
  useEffect(() => {
    if (householdId) {
      loadFloorPlanFromDatabase();
    }
  }, [loadFloorPlanFromDatabase]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Floor Plan Viewer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex gap-2 text-sm">
          <div className={`flex items-center gap-1 ${cameraPermission === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
            <Camera className="h-4 w-4" />
            Camera: {cameraPermission}
          </div>
          <div className={`flex items-center gap-1 ${microphonePermission === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
            <Mic className="h-4 w-4" />
            Microphone: {microphonePermission}
          </div>
        </div>

        {/* Permission Request Buttons */}
        {(cameraPermission === 'denied' || microphonePermission === 'denied') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Camera and microphone permissions are required for floor plan capture.
              <div className="flex gap-2 mt-2">
                {cameraPermission === 'denied' && (
                  <Button size="sm" onClick={requestCameraPermission}>
                    Grant Camera Access
                  </Button>
                )}
                {microphonePermission === 'denied' && (
                  <Button size="sm" onClick={requestMicrophonePermission}>
                    Grant Microphone Access
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Controls */}
        {editable && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Floor Plan
            </Button>
            <Button
              variant="outline"
              onClick={handleCameraCapture}
              disabled={isLoading || isCapturing || cameraPermission === 'denied'}
            >
              {isCapturing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {isCapturing ? 'Capturing...' : 'Capture with Camera'}
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.gltf,.glb,.obj,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Floor Plan Message */}
        {!currentFloorPlan && !floorPlanUrl && !error && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              No floor plan available. Upload a floor plan file or capture one using your camera to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading floor plan...</span>
          </div>
        )}

        {/* 3D Viewer */}
        <div className="relative">
          <div ref={mountRef} className="w-full h-64 bg-muted rounded-lg overflow-hidden" />
          
          {/* Camera Controls */}
          {scene && camera && renderer && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => rotateCamera('left')}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => rotateCamera('right')}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => zoomCamera('in')}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => zoomCamera('out')}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Floor Plan Info */}
        {currentFloorPlan && (
          <div className="text-sm text-muted-foreground">
            <p><strong>Name:</strong> {currentFloorPlan.name}</p>
            <p><strong>Uploaded:</strong> {currentFloorPlan.createdAt.toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {currentFloorPlan.updatedAt.toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FloorPlanViewer;
