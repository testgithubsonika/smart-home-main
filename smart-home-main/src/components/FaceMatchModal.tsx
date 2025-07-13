import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FaceCompare } from "@/components/FaceCompare";
import { User, CheckCircle, XCircle } from "lucide-react";

interface FaceMatchModalProps {
  isVerified: boolean;
  onVerificationChange: (verified: boolean) => void;
}

export const FaceMatchModal: React.FC<FaceMatchModalProps> = ({ isVerified, onVerificationChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed">("pending");

  const handleVerificationComplete = (verified: boolean) => {
    setVerificationStatus(verified ? "success" : "failed");
    onVerificationChange(verified);
    
    // Auto-close modal after successful verification
    if (verified) {
      setTimeout(() => setIsOpen(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <User className="w-4 h-4 mr-2" />
          {isVerified ? "Face Verification Complete ✓" : "Start Face Verification"}
          {isVerified && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Face Identity Verification
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {verificationStatus === "pending" && (
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 font-medium">🔍 Face Verification in Progress</p>
              <p className="text-sm text-blue-600 mt-1">
                Please position your face clearly in the camera. The system will compare it with your reference image.
              </p>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">✅ Face Verification Successful!</p>
              <p className="text-sm text-green-600 mt-1">
                Your identity has been verified. You can now proceed with your listing.
              </p>
            </div>
          )}

          {verificationStatus === "failed" && (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">❌ Face Verification Failed</p>
              <p className="text-sm text-red-600 mt-1">
                Please try again. Make sure your face is clearly visible and well-lit.
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Face Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <FaceCompare onVerificationComplete={handleVerificationComplete} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            {verificationStatus === "failed" && (
              <Button onClick={() => setVerificationStatus("pending")}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 