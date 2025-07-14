export const generateBiometricHash = async (
  landmarks: Array<{ x: number; y: number; z: number }>,
  depthMap: Uint16Array,
  width: number = 640,
  height: number = 480
): Promise<string> => {
  const data = [];

  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    const index = Math.floor(pt.y * height) * width + Math.floor(pt.x * width);
    const depth = depthMap[index] || 0;

    data.push(pt.x, pt.y, pt.z, depth);
  }

  const buffer = new Float32Array(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer.buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
