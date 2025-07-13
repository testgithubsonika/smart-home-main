// Utility to test if face-api.js models are accessible
export const testModelsAccessibility = async (): Promise<{
  success: boolean;
  errors: string[];
  details: Record<string, boolean>;
}> => {
  const errors: string[] = [];
  const details: Record<string, boolean> = {};
  const baseUrl = "/models/face-api.js-models-master";

  const modelPaths = [
    "/ssd_mobilenetv1/ssd_mobilenetv1_model-weights_manifest.json",
    "/face_landmark_68/face_landmark_68_model-weights_manifest.json", 
    "/face_recognition/face_recognition_model-weights_manifest.json"
  ];

  for (const path of modelPaths) {
    try {
      const response = await fetch(`${baseUrl}${path}`);
      if (response.ok) {
        details[path] = true;
        console.log(`✅ Model accessible: ${path}`);
      } else {
        details[path] = false;
        errors.push(`Model not accessible: ${path} (Status: ${response.status})`);
        console.error(`❌ Model not accessible: ${path} (Status: ${response.status})`);
      }
    } catch (error) {
      details[path] = false;
      errors.push(`Failed to fetch model: ${path} - ${error}`);
      console.error(`❌ Failed to fetch model: ${path}`, error);
    }
  }

  const success = errors.length === 0;
  
  if (success) {
    console.log("🎉 All face-api.js models are accessible!");
  } else {
    console.error("❌ Some models are not accessible:", errors);
  }

  return { success, errors, details };
}; 