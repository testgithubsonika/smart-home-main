import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, Shield } from "lucide-react";
import IDScanner from "@/components/IDScanner";
import { FaceCompare } from "@/components/FaceCompare";
import { saveVerificationResult } from "@/utils/firestoreHelpers";

interface IdentityCheckProps {
  currentUserId: string;
  onVerificationComplete?: (verified: boolean) => void;
}

export const IdentityCheck: React.FC<IdentityCheckProps> = ({ 
  currentUserId, 
  onVerificationComplete 
}) => {
  const [ocrData, setOcrData] = useState<string | null>(null);
  const [matchComplete, setMatchComplete] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "scanning" | "matching" | "complete">("pending");

  const handleFaceMatch = async (match: boolean) => {
    if (match) {
      await saveVerificationResult(currentUserId, true);
      setMatchComplete(true);
      setVerificationStatus("complete");
      onVerificationComplete?.(true);
    }
  };

  const handleIDScan = (data: string) => {
    setOcrData(data);
    setVerificationStatus("matching");
  };

  const resetVerification = () => {
    setOcrData(null);
    setMatchComplete(false);
    setVerificationStatus("pending");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
        <p className="text-muted-foreground">
          Complete identity verification to build trust with potential roommates
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge 
          variant={matchComplete ? "default" : "secondary"}
          className={`flex items-center gap-2 ${
            matchComplete 
              ? "bg-green-100 text-green-800 border-green-200" 
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
          }`}
        >
          {matchComplete ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Verification Complete
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              {verificationStatus === "pending" && "Ready to Start"}
              {verificationStatus === "scanning" && "Scanning ID..."}
              {verificationStatus === "matching" && "Matching Face..."}
            </>
          )}
        </Badge>
      </div>

      {/* Step 1: ID Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Step 1: Scan Your ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IDScanner onScan={handleIDScan} />
          {ocrData && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✅ ID scanned successfully! Proceeding to face verification...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Face Comparison */}
      {ocrData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Step 2: Face Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FaceCompare onVerificationComplete={handleFaceMatch} />
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {matchComplete && (
        <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            ✅ Identity Verification Successful!
          </h3>
          <p className="text-green-600">
            Your identity has been verified. You can now proceed with creating listings.
          </p>
        </div>
      )}

      {/* Reset Button */}
      {matchComplete && (
        <div className="text-center">
          <Button variant="outline" onClick={resetVerification}>
            Reset Verification
          </Button>
        </div>
      )}
    </div>
  );
}; 