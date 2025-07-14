import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { useDepthCamera } from "./hooks/useDepthCamera"; // Assuming this path is correct
import { matchBiometricHash } from "./utils/matchBiometricHash"; // Assuming this path is correct
import { generateBiometricHash } from "./utils/generateBiometricHash"; // Assuming this path is correct

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

// Custom Modal Component
const CustomAlertModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <p className="text-lg font-semibold mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export const FaceCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null); // Ref to store FaceMesh instance
  const cameraRef = useRef<Camera | null>(null); // Ref to store Camera instance

  const [faceData, setFaceData] = useState<FaceLandmark[] | null>(null);
  const { depthMap, grayscaleMap, pseudoDepthMap, timestamp: depthTimestamp, connectDepthCamera, isConnected, error } = useDepthCamera();
  const [synchronizedData, setSynchronizedData] = useState<{
    faceLandmarks: FaceLandmark[] | null;
    depthData: Uint16Array | number[] | null;
    isSynchronized: boolean;
  }>({
    faceLandmarks: null,
    depthData: null,
    isSynchronized: false,
  });

  const [storedHash, setStoredHash] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Function to show custom alert modal
  const showAlert = (message: string) => {
    setModalMessage(message);
  };

  // Function to close custom alert modal
  const closeAlert = () => {
    setModalMessage(null);
  };

  // Load stored hash from localStorage or API
  useEffect(() => {
    const hash = localStorage.getItem('userBiometricHash');
    if (hash) {
      setStoredHash(hash);
    }
  }, []);

  // Synchronization logic
  const checkSynchronization = useCallback(() => {
    if (!faceData || !depthTimestamp) return;

    // Use a more stable timestamp for RGB if possible, or approximate
    // For now, using Date.now() for RGB stream approximation
    const rgbTimestamp = Date.now();
    const delta = Math.abs(rgbTimestamp - depthTimestamp);

    if (delta < 50) {
      // Use synchronized data
      const depthData = depthMap || pseudoDepthMap;
      setSynchronizedData({
        faceLandmarks: faceData,
        depthData: depthData,
        isSynchronized: true,
      });
      console.log(`Data synchronized! Delta: ${delta}ms`);
    } else {
      // Data not synchronized
      setSynchronizedData(prev => ({
        ...prev,
        isSynchronized: false,
      }));
      console.log(`Data not synchronized. Delta: ${delta}ms`);
    }
  }, [faceData, depthTimestamp, depthMap, pseudoDepthMap]);

  // Check synchronization when data changes
  useEffect(() => {
    checkSynchronization();
  }, [checkSynchronization]);

  const onVerify = async () => {
    if (!synchronizedData.isSynchronized) {
      showAlert("Please wait for RGB and depth data to synchronize before verification.");
      return;
    }

    if (!storedHash) {
      showAlert("No stored biometric hash found. Please register your face first.");
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const verificationTimeout = 10000; // 10 seconds

    // Set a timeout for the verification process
    timeoutId = setTimeout(() => {
      showAlert("Face capture timed out! Please try again.");
      // Stop the face capture process if it's running
      if (faceMeshRef.current) {
        faceMeshRef.current.reset(); // Reset FaceMesh state
      }
      if (cameraRef.current) {
        cameraRef.current.stop(); // Stop the camera stream
      }
      // Re-initialize camera after stopping if needed, or prompt user to restart
      // For simplicity, we just stop here. User might need to refresh or click connect again.
    }, verificationTimeout);

    try {
      // Generate current biometric hash using synchronized data
      const currentHash = await generateBiometricHash(synchronizedData.faceLandmarks, synchronizedData.depthData);
      // Match the generated hash with the stored hash
      const isValid = matchBiometricHash(currentHash, storedHash);
      showAlert(isValid ? "✅ Identity verified!" : "❌ Mismatch!");
    } catch (error) {
      console.error("Error during verification:", error);
      showAlert("An error occurred during verification. Please try again.");
    } finally {
      // Clear the timeout regardless of success or failure
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    // Initialize FaceMesh
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      drawMesh(results);
      setFaceData(results.multiFaceLandmarks?.[0] || null);
    });

    faceMeshRef.current = faceMesh; // Store FaceMesh instance in ref

    // Initialize Camera
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) { // Ensure videoRef.current is not null before sending
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera; // Store Camera instance in ref
    }

    // Cleanup function
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.reset(); // Reset FaceMesh instance
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  const drawMesh = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Ensure canvas is available

    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Ensure context is available

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fillStyle = "#00FF00";
          ctx.fill();
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-50 font-inter">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Biometric Face Verification</h1>

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 mb-6">
        <video ref={videoRef} className="hidden" playsInline /> {/* Hidden video feed */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-auto rounded-lg border-2 border-gray-300 shadow-md"
        />
        <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Webcam Feed
        </div>
      </div>

      {/* Synchronization Status */}
      <div className="w-full max-w-2xl mt-4 p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-medium text-gray-700">Data Synchronization:</span>
          <span className={`text-base font-semibold ${synchronizedData.isSynchronized ? 'text-green-600' : 'text-yellow-600'}`}>
            {synchronizedData.isSynchronized ? '✅ Synchronized' : '⏳ Waiting...'}
          </span>
        </div>
        {synchronizedData.isSynchronized && (
          <p className="text-sm text-green-700">
            RGB and depth data are synchronized and ready for verification.
          </p>
        )}
        {!synchronizedData.isSynchronized && (
          <p className="text-sm text-yellow-700">
            Waiting for RGB and depth data to synchronize (within 50ms tolerance).
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-2xl mt-6 space-y-4 flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
        <button
          onClick={connectDepthCamera}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
        >
          Connect Depth Camera
        </button>

        <button
          onClick={onVerify}
          disabled={!synchronizedData.isSynchronized}
          className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
        >
          Verify Identity
        </button>
      </div>

      {/* Depth Camera Status */}
      <div className="w-full max-w-2xl mt-6 p-4 bg-white rounded-lg shadow-md">
        {isConnected ? (
          <p className="text-green-600 font-medium">✅ Depth camera connected.</p>
        ) : error ? (
          <p className="text-red-600 font-medium">❌ Error: {error}</p>
        ) : (
          <p className="text-blue-600 font-medium">🔄 Connecting to depth camera...</p>
        )}
      </div>

      {/* Custom Alert Modal */}
      {modalMessage && <CustomAlertModal message={modalMessage} onClose={closeAlert} />}
    </div>
  );
};

// Placeholder for useDepthCamera hook (replace with your actual implementation)
// This is a mock to make the code runnable for demonstration
const useDepthCamera = () => {
  const [depthMap, setDepthMap] = useState<Uint16Array | null>(null);
  const [grayscaleMap, setGrayscaleMap] = useState<Uint8Array | null>(null);
  const [pseudoDepthMap, setPseudoDepthMap] = useState<number[] | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectDepthCamera = useCallback(() => {
    // Simulate connecting to a depth camera
    setIsConnected(true);
    setError(null);
    console.log("Simulating depth camera connection...");
    // Simulate receiving depth data
    const mockDepthData = Array.from({ length: 640 * 480 }, () => Math.floor(Math.random() * 1000));
    setDepthMap(new Uint16Array(mockDepthData));
    setPseudoDepthMap(mockDepthData);
    setTimestamp(Date.now());

    // Periodically update depth data to simulate stream
    const interval = setInterval(() => {
      const newMockDepthData = Array.from({ length: 640 * 480 }, () => Math.floor(Math.random() * 1000));
      setDepthMap(new Uint16Array(newMockDepthData));
      setPseudoDepthMap(newMockDepthData);
      setTimestamp(Date.now());
    }, 100); // Update every 100ms
    return () => clearInterval(interval);
  }, []);

  return { depthMap, grayscaleMap, pseudoDepthMap, timestamp, connectDepthCamera, isConnected, error };
};

// Placeholder for generateBiometricHash (replace with your actual implementation)
const generateBiometricHash = async (faceLandmarks: FaceLandmark[] | null, depthData: Uint16Array | number[] | null): Promise<string> => {
  if (!faceLandmarks || !depthData) {
    throw new Error("Missing face landmarks or depth data for hash generation.");
  }
  // Simulate hash generation
  const dataString = JSON.stringify({ faceLandmarks, depthData });
  const hash = btoa(dataString).substring(0, 32); // Simple base64 encoding for mock hash
  console.log("Generated mock hash:", hash);
  return hash;
};

// Placeholder for matchBiometricHash (replace with your actual implementation)
const matchBiometricHash = (currentHash: string, storedHash: string): boolean => {
  console.log("Matching hashes:", { currentHash, storedHash });
  // Simulate hash matching (e.g., direct comparison for mock)
  return currentHash === storedHash;
};
