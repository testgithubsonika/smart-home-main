// File: src/hooks/useFaceMatcher.ts

import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { testModelsAccessibility } from "@/utils/testModels";

interface FaceMatcherResult {
  descriptor: Float32Array | null;
  error: string | null;
}

export const useFaceMatcher = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models/face-api.js-models-master"; // Fixed path to models
        console.log("Loading face-api.js models from:", MODEL_URL);

        // Test model accessibility first
        const accessibilityTest = await testModelsAccessibility();
        if (!accessibilityTest.success) {
          throw new Error(`Models not accessible: ${accessibilityTest.errors.join(", ")}`);
        }

        console.log("Loading SSD MobileNet v1...");
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        console.log("SSD MobileNet v1 loaded successfully");

        console.log("Loading Face Landmark 68 Net...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("Face Landmark 68 Net loaded successfully");

        console.log("Loading Face Recognition Net...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Face Recognition Net loaded successfully");

        setModelsLoaded(true);
        console.log("All face-api.js models loaded successfully");
      } catch (error) {
        console.error("Model loading failed:", error);
        console.error("Please check that the models are available at:", "/models/face-api.js-models-master");
      }
    };

    loadModels();
  }, []);

  // Extract face descriptor (128-D vector) from image or video frame
  const extractFaceDescriptor = async (
    input: HTMLImageElement | HTMLVideoElement
  ): Promise<FaceMatcherResult> => {
    try {
      const detection = await faceapi
        .detectSingleFace(input)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection || !detection.descriptor) {
        return { descriptor: null, error: "No face detected" };
      }

      return { descriptor: detection.descriptor, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { descriptor: null, error: errorMessage };
    }
  };

  return {
    modelsLoaded,
    extractFaceDescriptor,
  };
};
