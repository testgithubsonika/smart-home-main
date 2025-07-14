import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Mic, 
  Activity, 
  Thermometer, 
  Droplets, 
  Wifi, 
  Home, 
  Lightbulb,
  CheckCircle,
  X,
  AlertTriangle,
  Play,
  Square,
  Settings,
  Zap,
  Target,
  Clock,
  Eye,
  Ear,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';

import { useDepthCamera } from '@/hooks/useDepthCamera';
import { useFaceMatcher } from '@/hooks/useFaceMatcher';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
}

interface SensorData {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export const WebcamSensorTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  
  // Webcam states
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Microphone states
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Sensor states
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isSensorSimulationActive, setIsSensorSimulationActive] = useState(false);
  
  // Face recognition states
  const { modelsLoaded, extractFaceDescriptor } = useFaceMatcher();
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  
  // Depth camera states
  const { 
    depthMap, 
    grayscaleMap, 
    pseudoDepthMap, 
    isConnected, 
    error: depthError, 
    connectDepthCamera 
  } = useDepthCamera();

  // Test definitions
  const tests = [
    {
      id: 'webcam',
      name: 'Webcam Access',
      description: 'Test webcam connectivity and video stream',
      icon: Camera,
      category: 'camera'
    },
    {
      id: 'microphone',
      name: 'Microphone Access',
      description: 'Test microphone connectivity and audio levels',
      icon: Mic,
      category: 'audio'
    },
    {
      id: 'face-detection',
      name: 'Face Detection',
      description: 'Test face detection and recognition models',
      icon: Eye,
      category: 'ai'
    },
    {
      id: 'depth-camera',
      name: 'Depth Camera',
      description: 'Test depth camera and 3D sensing',
      icon: Target,
      category: 'sensors'
    },
    {
      id: 'motion-sensor',
      name: 'Motion Sensor',
      description: 'Simulate motion detection events',
      icon: Activity,
      category: 'sensors'
    },
    {
      id: 'temperature-sensor',
      name: 'Temperature Sensor',
      description: 'Simulate temperature readings',
      icon: Thermometer,
      category: 'sensors'
    },
    {
      id: 'humidity-sensor',
      name: 'Humidity Sensor',
      description: 'Simulate humidity readings',
      icon: Droplets,
      category: 'sensors'
    },
    {
      id: 'light-sensor',
      name: 'Light Sensor',
      description: 'Simulate ambient light detection',
      icon: Lightbulb,
      category: 'sensors'
    }
  ];

  // Initialize test results
  useEffect(() => {
    const initialResults = tests.map(test => ({
      name: test.name,
      status: 'pending' as const,
      message: 'Test not started'
    }));
    setTestResults(initialResults);
  }, []);

  // Webcam testing
  const testWebcam = useCallback(async () => {
    setCurrentTest('webcam');
    updateTestStatus('webcam', 'running', 'Testing webcam access...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      setWebcamStream(stream);
      setIsWebcamActive(true);
      setWebcamError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      updateTestStatus('webcam', 'passed', 'Webcam working correctly');
      toast.success('Webcam test passed!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setWebcamError(errorMessage);
      updateTestStatus('webcam', 'failed', `Webcam error: ${errorMessage}`);
      toast.error('Webcam test failed');
    }
  }, []);

  // Microphone testing
  const testMicrophone = useCallback(async () => {
    setCurrentTest('microphone');
    updateTestStatus('microphone', 'running', 'Testing microphone access...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      setAudioStream(stream);
      setIsAudioActive(true);
      setAudioError(null);
      
      // Create audio context for level monitoring
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      
      // Start audio level monitoring
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      const updateAudioLevel = () => {
        analyserNode.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        setAudioLevel(average);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
      
      updateTestStatus('microphone', 'passed', 'Microphone working correctly');
      toast.success('Microphone test passed!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAudioError(errorMessage);
      updateTestStatus('microphone', 'failed', `Microphone error: ${errorMessage}`);
      toast.error('Microphone test failed');
    }
  }, []);

  // Face detection testing
  const testFaceDetection = useCallback(async () => {
    setCurrentTest('face-detection');
    updateTestStatus('face-detection', 'running', 'Testing face detection...');
    
    if (!modelsLoaded) {
      updateTestStatus('face-detection', 'failed', 'Face detection models not loaded');
      toast.error('Face detection models not ready');
      return;
    }
    
    if (!videoRef.current || !isWebcamActive) {
      updateTestStatus('face-detection', 'failed', 'Webcam not active');
      toast.error('Please start webcam first');
      return;
    }
    
    try {
      setFaceDetectionActive(true);
      
      // Extract face descriptor from current video frame
      const result = await extractFaceDescriptor(videoRef.current);
      
      if (result.descriptor) {
        setFaceDescriptor(result.descriptor);
        updateTestStatus('face-detection', 'passed', 'Face detected and descriptor extracted');
        toast.success('Face detection test passed!');
      } else {
        updateTestStatus('face-detection', 'failed', 'No face detected in frame');
        toast.error('No face detected');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('face-detection', 'failed', `Face detection error: ${errorMessage}`);
      toast.error('Face detection test failed');
    } finally {
      setFaceDetectionActive(false);
    }
  }, [modelsLoaded, extractFaceDescriptor, isWebcamActive]);

  // Depth camera testing
  const testDepthCamera = useCallback(async () => {
    setCurrentTest('depth-camera');
    updateTestStatus('depth-camera', 'running', 'Testing depth camera...');
    
    try {
      await connectDepthCamera();
      
      if (isConnected) {
        updateTestStatus('depth-camera', 'passed', 'Depth camera connected successfully');
        toast.success('Depth camera test passed!');
      } else if (pseudoDepthMap) {
        updateTestStatus('depth-camera', 'passed', 'Using pseudo-depth simulation');
        toast.success('Depth camera simulation working');
      } else {
        updateTestStatus('depth-camera', 'failed', 'Depth camera not available');
        toast.error('Depth camera not available');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus('depth-camera', 'failed', `Depth camera error: ${errorMessage}`);
      toast.error('Depth camera test failed');
    }
  }, [connectDepthCamera, isConnected, pseudoDepthMap]);

  // Sensor simulation testing
  const testSensor = useCallback(async (sensorType: string) => {
    setCurrentTest(sensorType);
    updateTestStatus(sensorType, 'running', `Testing ${sensorType}...`);
    
    try {
      setIsSensorSimulationActive(true);
      
      // Simulate sensor readings
      const simulateSensorData = () => {
        const now = new Date();
        let value: number;
        let unit: string;
        
        switch (sensorType) {
          case 'motion-sensor':
            value = Math.random() > 0.5 ? 1 : 0;
            unit = 'detected';
            break;
          case 'temperature-sensor':
            value = 20 + Math.random() * 10; // 20-30°C
            unit = '°C';
            break;
          case 'humidity-sensor':
            value = 40 + Math.random() * 30; // 40-70%
            unit = '%';
            break;
          case 'light-sensor':
            value = Math.random() * 1000; // 0-1000 lux
            unit = 'lux';
            break;
          default:
            value = Math.random() * 100;
            unit = 'units';
        }
        
        const sensorData: SensorData = {
          type: sensorType,
          value: Math.round(value * 100) / 100,
          unit,
          timestamp: now
        };
        
        setSensorData(prev => [...prev, sensorData]);
        
        // Continue simulation for 5 seconds
        setTimeout(() => {
          setIsSensorSimulationActive(false);
          updateTestStatus(sensorType, 'passed', `${sensorType} simulation working`);
          toast.success(`${sensorType} test passed!`);
        }, 5000);
      };
      
      simulateSensorData();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestStatus(sensorType, 'failed', `${sensorType} error: ${errorMessage}`);
      toast.error(`${sensorType} test failed`);
      setIsSensorSimulationActive(false);
    }
  }, []);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    
    for (const test of tests) {
      setCurrentTest(test.id);
      
      switch (test.id) {
        case 'webcam':
          await testWebcam();
          break;
        case 'microphone':
          await testMicrophone();
          break;
        case 'face-detection':
          await testFaceDetection();
          break;
        case 'depth-camera':
          await testDepthCamera();
          break;
        case 'motion-sensor':
        case 'temperature-sensor':
        case 'humidity-sensor':
        case 'light-sensor':
          await testSensor(test.id);
          break;
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
    setCurrentTest('');
    toast.success('All tests completed!');
  }, [tests, testWebcam, testMicrophone, testFaceDetection, testDepthCamera, testSensor]);

  // Stop all streams
  const stopAllStreams = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsWebcamActive(false);
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setIsAudioActive(false);
    }
    
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setAnalyser(null);
    setAudioLevel(0);
    setIsSensorSimulationActive(false);
    setFaceDetectionActive(false);
    
    toast.info('All streams stopped');
  }, [webcamStream, audioStream, audioContext]);

  // Update test status
  const updateTestStatus = (testId: string, status: TestResult['status'], message?: string) => {
    setTestResults(prev => 
      prev.map(result => 
        result.name === tests.find(t => t.id === testId)?.name
          ? { ...result, status, message }
          : result
      )
    );
  };

  // Get test status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
    };
  }, [stopAllStreams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webcam & Sensor Tester</h2>
          <p className="text-muted-foreground">
            Test all camera, microphone, and sensor functionality
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button 
            variant="outline" 
            onClick={stopAllStreams}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop All
          </Button>
        </div>
      </div>

      {/* Test Results Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Status of all webcam and sensor tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testResults.map((result) => (
              <div key={result.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium text-sm">{result.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.message || 'Test not started'}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  result.status === 'passed' ? 'default' : 
                  result.status === 'failed' ? 'destructive' : 
                  result.status === 'running' ? 'secondary' : 'outline'
                }>
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Testing Interface */}
      <Tabs defaultValue="camera" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="ai">AI Models</TabsTrigger>
        </TabsList>

        {/* Camera Tab */}
        <TabsContent value="camera" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webcam Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Webcam Test
                </CardTitle>
                <CardDescription>
                  Test webcam connectivity and video stream
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {webcamError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{webcamError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {isWebcamActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={testWebcam}
                    disabled={isWebcamActive}
                    className="flex-1"
                  >
                    {isWebcamActive ? 'Webcam Active' : 'Test Webcam'}
                  </Button>
                  {isWebcamActive && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        webcamStream?.getTracks().forEach(track => track.stop());
                        setWebcamStream(null);
                        setIsWebcamActive(false);
                      }}
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Face Detection Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Face Detection
                </CardTitle>
                <CardDescription>
                  Test face detection and recognition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={modelsLoaded ? 'default' : 'secondary'}>
                    {modelsLoaded ? 'Models Loaded' : 'Loading Models...'}
                  </Badge>
                  {faceDescriptor && (
                    <Badge variant="outline">
                      Face Detected
                    </Badge>
                  )}
                </div>
                
                <Button 
                  onClick={testFaceDetection}
                  disabled={!modelsLoaded || !isWebcamActive || faceDetectionActive}
                  className="w-full"
                >
                  {faceDetectionActive ? 'Detecting...' : 'Test Face Detection'}
                </Button>
                
                {faceDescriptor && (
                  <div className="text-sm text-muted-foreground">
                    <p>Face descriptor extracted successfully</p>
                    <p>Vector length: {faceDescriptor.length}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audio Tab */}
        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Microphone Test
              </CardTitle>
              <CardDescription>
                Test microphone connectivity and audio levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{audioError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Audio Level</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(audioLevel)}/255
                  </span>
                </div>
                <Progress value={(audioLevel / 255) * 100} className="h-2" />
                <div className="flex items-center gap-2">
                  <Ear className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {audioLevel > 50 ? 'Audio detected' : 'No audio detected'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={testMicrophone}
                  disabled={isAudioActive}
                  className="flex-1"
                >
                  {isAudioActive ? 'Microphone Active' : 'Test Microphone'}
                </Button>
                {isAudioActive && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      audioStream?.getTracks().forEach(track => track.stop());
                      setAudioStream(null);
                      setIsAudioActive(false);
                      if (audioContext) {
                        audioContext.close();
                        setAudioContext(null);
                      }
                    }}
                  >
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensors Tab */}
        <TabsContent value="sensors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Depth Camera */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Depth Camera
                </CardTitle>
                <CardDescription>
                  Test depth camera and 3D sensing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                  {pseudoDepthMap && (
                    <Badge variant="outline">Simulation Mode</Badge>
                  )}
                </div>
                
                {depthError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{depthError}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={testDepthCamera}
                  className="w-full"
                >
                  Test Depth Camera
                </Button>
                
                {depthMap && (
                  <div className="text-sm text-muted-foreground">
                    <p>Depth map available</p>
                    <p>Size: {depthMap.length} points</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sensor Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sensor Simulation
                </CardTitle>
                <CardDescription>
                  Simulate various sensor readings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['motion-sensor', 'temperature-sensor', 'humidity-sensor', 'light-sensor'].map((sensorType) => (
                    <Button
                      key={sensorType}
                      variant="outline"
                      size="sm"
                      onClick={() => testSensor(sensorType)}
                      disabled={isSensorSimulationActive}
                      className="flex items-center gap-2"
                    >
                      {sensorType === 'motion-sensor' && <Activity className="h-4 w-4" />}
                      {sensorType === 'temperature-sensor' && <Thermometer className="h-4 w-4" />}
                      {sensorType === 'humidity-sensor' && <Droplets className="h-4 w-4" />}
                      {sensorType === 'light-sensor' && <Lightbulb className="h-4 w-4" />}
                      {sensorType.split('-')[0]}
                    </Button>
                  ))}
                </div>
                
                {sensorData.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recent Sensor Data</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {sensorData.slice(-5).map((data, index) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          {data.type}: {data.value} {data.unit} at {data.timestamp.toLocaleTimeString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Models Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Models Status
              </CardTitle>
              <CardDescription>
                Check AI model loading and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Face Detection Models</span>
                  <Badge variant={modelsLoaded ? 'default' : 'secondary'}>
                    {modelsLoaded ? 'Loaded' : 'Loading...'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Face Recognition Models</span>
                  <Badge variant={modelsLoaded ? 'default' : 'secondary'}>
                    {modelsLoaded ? 'Loaded' : 'Loading...'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Landmark Detection</span>
                  <Badge variant={modelsLoaded ? 'default' : 'secondary'}>
                    {modelsLoaded ? 'Loaded' : 'Loading...'}
                  </Badge>
                </div>
              </div>
              
              {!modelsLoaded && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    AI models are still loading. This may take a few moments on first load.
                  </AlertDescription>
                </Alert>
              )}
              
              {modelsLoaded && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All AI models loaded successfully and ready for testing.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Test Status */}
      {isRunning && currentTest && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="font-medium">Running Test: {currentTest}</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while the test completes...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 