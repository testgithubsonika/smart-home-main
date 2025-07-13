import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { IdentityCheck } from "@/components/IdentityCheck";
import { checkVerificationStatus } from "@/utils/firestoreHelpers";

const IdentityCheckPage = () => {
  const navigate = useNavigate();
  const [currentUserId] = useState("user-id-from-auth"); // Replace with Clerk/Firebase auth
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check verification status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      const verified = await checkVerificationStatus(currentUserId);
      setIsVerified(verified);
      setIsLoading(false);
    };
    checkStatus();
  }, [currentUserId]);

  const handleVerificationComplete = (verified: boolean) => {
    setIsVerified(verified);
    if (verified) {
      // Auto-navigate back after successful verification
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-12">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <Card className="bg-card/60 backdrop-blur-sm border-border shadow-soft">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                Identity Already Verified
              </CardTitle>
              <p className="text-muted-foreground">
                Your identity has been successfully verified. You can proceed with creating listings.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/create-listing')}>
                Create New Listing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Identity Verification Required
            </CardTitle>
            <p className="text-muted-foreground">
              Complete identity verification to build trust with potential roommates and unlock listing creation.
            </p>
          </CardHeader>
          <CardContent>
            <IdentityCheck 
              currentUserId={currentUserId}
              onVerificationComplete={handleVerificationComplete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IdentityCheckPage; 