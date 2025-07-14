// File: src/hooks/useFaceMatcher.ts

import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { testModelsAccessibility } from "@/utils/testModels";

interface FaceMatcherResult {
  descriptor: Float32Array | null;
  error?: string;
}

export const useFaceMatcher = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelError(null);
        setLoadingProgress(0);
        
        const MODEL_URL = "/models/face-api.js-models-master";
        console.log("Loading face-api.js models from:", MODEL_URL);

        // Test model accessibility first
        const accessibilityTest = await testModelsAccessibility();
        if (!accessibilityTest.success) {
          throw new Error(`Models not accessible: ${accessibilityTest.errors.join(", ")}`);
        }

        // Load models with progress tracking
        setLoadingProgress(25);
        console.log("Loading SSD MobileNet v1...");
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        console.log("SSD MobileNet v1 loaded successfully");

        setLoadingProgress(50);
        console.log("Loading Face Landmark 68 Net...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("Face Landmark 68 Net loaded successfully");

        setLoadingProgress(75);
        console.log("Loading Face Recognition Net...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Face Recognition Net loaded successfully");

        setLoadingProgress(100);
        setModelsLoaded(true);
        console.log("All face-api.js models loaded successfully");
      } catch (error) {
        console.error("Model loading failed:", error);
        setModelError(error instanceof Error ? error.message : "Unknown error");
        setModelsLoaded(false);
        
        // Provide helpful error message
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (errorMessage.includes("404") || errorMessage.includes("not accessible")) {
          setModelError("Face recognition models not found. Please ensure models are available in the public/models directory.");
        } else if (errorMessage.includes("network")) {
          setModelError("Network error loading models. Please check your internet connection.");
        } else {
          setModelError(`Failed to load face recognition models: ${errorMessage}`);
        }
      }
    };

    loadModels();
  }, []);

  // Extract face descriptor (128-D vector) from image or video frame
  const extractFaceDescriptor = async (
    input: HTMLImageElement | HTMLVideoElement
  ): Promise<FaceMatcherResult> => {
    if (!modelsLoaded) {
      return {
        descriptor: null,
        error: "Models not loaded. Please wait for models to load or check for errors."
      };
    }

    try {
      // Detect faces in the input
      const detections = await faceapi
        .detectAllFaces(input)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        return {
          descriptor: null,
          error: "No faces detected in the image/video frame."
        };
      }

      // Return the descriptor of the first detected face
      const descriptor = detections[0].descriptor;
      return { descriptor };
    } catch (error) {
      console.error("Error extracting face descriptor:", error);
      return {
        descriptor: null,
        error: error instanceof Error ? error.message : "Failed to extract face descriptor"
      };
    }
  };

  // Compare two face descriptors
  const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
    try {
      return faceapi.euclideanDistance(descriptor1, descriptor2);
    } catch (error) {
      console.error("Error comparing faces:", error);
      return Infinity; // Return maximum distance on error
    }
  };

  // Check if two faces match (distance below threshold)
  const areFacesMatching = (
    descriptor1: Float32Array, 
    descriptor2: Float32Array, 
    threshold: number = 0.6
  ): boolean => {
    const distance = compareFaces(descriptor1, descriptor2);
    return distance < threshold;
  };

  // Get model loading status
  const getModelStatus = () => {
    if (modelError) {
      return {
        status: "error" as const,
        message: modelError,
        progress: loadingProgress
      };
    }
    
    if (modelsLoaded) {
      return {
        status: "loaded" as const,
        message: "Models loaded successfully",
        progress: 100
      };
    }
    
    return {
      status: "loading" as const,
      message: "Loading face recognition models...",
      progress: loadingProgress
    };
  };

  // Retry loading models
  const retryLoadingModels = () => {
    setModelsLoaded(false);
    setModelError(null);
    setLoadingProgress(0);
    
    // Trigger reload by updating dependency
    const MODEL_URL = "/models/face-api.js-models-master";
    console.log("Retrying model loading from:", MODEL_URL);
    
    // Force re-run of useEffect
    setModelsLoaded(false);
  };

  return {
    modelsLoaded,
    modelError,
    loadingProgress,
    extractFaceDescriptor,
    compareFaces,
    areFacesMatching,
    getModelStatus,
    retryLoadingModels
  };
};
