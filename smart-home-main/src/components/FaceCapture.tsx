//SETUP WEBCAM + DEPTH CAMERA STREAM
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { useDepthCamera } from "@/hooks/useDepthCamera";
import { matchBiometricHash } from "@/utils/matchBiometricHash";
import { generateBiometricHash } from "@/utils/generateBiometricHash";

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export const FaceCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      alert("Please wait for RGB and depth data to synchronize before verification.");
      return;
    }

    if (!storedHash) {
      alert("No stored biometric hash found. Please register your face first.");
      return;
    }

    const currentHash = await generateBiometricHash(synchronizedData.faceLandmarks, synchronizedData.depthData);
    const isValid = matchBiometricHash(currentHash, storedHash);
    alert(isValid ? "✅ Identity verified!" : "❌ Mismatch!");
  };

  useEffect(() => {
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

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  const drawMesh = (results: any) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
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
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
      
      {/* Synchronization Status */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Data Synchronization:</span>
          <span className={`text-sm ${synchronizedData.isSynchronized ? 'text-green-600' : 'text-yellow-600'}`}>
            {synchronizedData.isSynchronized ? '✅ Synchronized' : '⏳ Waiting...'}
          </span>
        </div>
        {synchronizedData.isSynchronized && (
          <p className="text-xs text-green-700">
            RGB and depth data are synchronized and ready for verification.
          </p>
        )}
        {!synchronizedData.isSynchronized && (
          <p className="text-xs text-yellow-700">
            Waiting for RGB and depth data to synchronize (within 50ms tolerance).
          </p>
        )}
      </div>
      
      {/* Controls */}
      <div className="mt-4 space-y-3">
        <button 
          onClick={connectDepthCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect Depth Camera
        </button>
        
        <button 
          onClick={onVerify}
          disabled={!synchronizedData.isSynchronized}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Verify Identity
        </button>
      </div>
      
      {/* Depth Camera Status */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        {isConnected ? (
          <p className="text-green-600">✅ Depth camera connected.</p>
        ) : error ? (
          <p className="text-red-600">❌ Error: {error}</p>
        ) : (
          <p className="text-blue-600">🔄 Connecting to depth camera...</p>
        )}
      </div>
    </div>
  );
};
