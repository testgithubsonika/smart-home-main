import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const saveVerificationResult = async (userId: string, verified: boolean) => {
  const ref = doc(db, "identityVerifications", userId);
  await setDoc(ref, {
    userId,
    verified,
    verifiedAt: new Date().toISOString(),
  });
};

export const checkVerificationStatus = async (userId: string): Promise<boolean> => {
  const ref = doc(db, "identityVerifications", userId);
  const snap = await getDoc(ref);
  return snap.exists() && snap.data().verified === true;
};
