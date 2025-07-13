import React, { useEffect, useRef, useState } from "react";
import { useFaceMatcher } from "@/hooks/useFaceMatcher";
import { cosineSimilarity } from "@/utils/compareEmbeddings";
import { saveVerificationResult } from "@/utils/firestoreHelpers";

interface FaceCompareProps {
  onVerificationComplete?: (verified: boolean) => void;
}

export const FaceCompare: React.FC<FaceCompareProps> = ({ onVerificationComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { modelsLoaded, extractFaceDescriptor } = useFaceMatcher();

  const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [currentUserId] = useState("user123"); // Replace with actual user ID from auth

  // Load video stream
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    });
  }, []);

  // Simulate loading a reference image descriptor (from ID card)
  useEffect(() => {
    const loadReference = async () => {
      const img = new Image();
      img.src = "/reference.jpg"; // Ensure this is in your public folder
      img.onload = async () => {
        const result = await extractFaceDescriptor(img);
        if (result.descriptor) setReferenceDescriptor(result.descriptor);
      };
    };
    if (modelsLoaded) loadReference();
  }, [modelsLoaded]);

  // Run real-time comparison every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!modelsLoaded || !videoRef.current || !referenceDescriptor) return;

      const result = await extractFaceDescriptor(videoRef.current);
      if (!result.descriptor) return;

      const score = cosineSimilarity(
        Array.from(result.descriptor),
        Array.from(referenceDescriptor)
      );

      setSimilarityScore(score);

      // Check if match is found and save verification result
      const matchFound = score > 0.75;
      if (matchFound) {
        await saveVerificationResult(currentUserId, true);
        onVerificationComplete?.(true);
      } else {
        onVerificationComplete?.(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [modelsLoaded, referenceDescriptor]);

  return (
    <div>
      <video ref={videoRef} width={480} height={360} style={{ border: "2px solid gray" }} />
      {similarityScore !== null && (
        <p>
          Similarity Score (cosine): {similarityScore.toFixed(4)}
          {similarityScore > 0.75 ? " ✅ Match" : " ❌ No Match"}
        </p>
      )}
    </div>
  );
};
