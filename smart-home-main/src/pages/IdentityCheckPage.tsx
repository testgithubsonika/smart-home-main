import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react"; // Import useUser hook
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { IdentityCheck } from "@/components/IdentityCheck";
// Import from your new Supabase helper file
import { checkVerificationStatus } from "@/services/supabaseServices"; 

const IdentityCheckPage = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser(); // Get user from Clerk
  const [isVerified, setIsVerified] = useState(false);
  // isLoading now depends on Clerk's loading state and our check
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure the user object is loaded before checking status
    if (isLoaded && user) {
      const checkStatus = async () => {
        setIsLoading(true); // Start loading
        const verified = await checkVerificationStatus(user.id);
        setIsVerified(verified);
        setIsLoading(false); // Finish loading
      };
      checkStatus();
    } else if (isLoaded && !user) {
      // Handle case where there is no signed-in user
      setIsLoading(false);
      navigate('/sign-in'); // Redirect to sign-in if not authenticated
    }
  }, [user, isLoaded, navigate]);

  const handleVerificationComplete = (verified: boolean) => {
    setIsVerified(verified);
    if (verified) {
      setTimeout(() => {
        navigate(-1); // Go back to the previous page
      }, 2000);
    }
  };

  // Show a loading state while Clerk is loading or we are checking status
  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // If the user is verified, show the success screen
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
                Your identity has been successfully verified.
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

  // If not verified, show the verification component
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
              Complete verification to build trust and unlock listing creation.
            </p>
          </CardHeader>
          <CardContent>
            {user && ( // Only render if the user exists
              <IdentityCheck 
                currentUserId={user.id}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IdentityCheckPage;