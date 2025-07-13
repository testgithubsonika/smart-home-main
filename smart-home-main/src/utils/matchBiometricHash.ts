export const matchBiometricHash = (hash1: string, hash2: string, tolerance = 5): boolean => {
  let diff = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) diff++;
    if (diff > tolerance) return false;
  }
  return true;
};
