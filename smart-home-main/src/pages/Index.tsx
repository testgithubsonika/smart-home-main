import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
// Import your new Supabase service function
import { getHousehold } from "@/services/harmonyService";
import { checkUserProfileExists } from "@/services/supabaseServices";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { UserTypeModal } from "@/components/UserTypeModal";

const Index = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isSignedIn } = useUser(); // Destructure 'user' to get the ID

  // The checkUserProfile function is now handled in supabaseService.ts
  // and imported as checkUserProfileExists.

  const handleCTAClick = async (type: 'find' | 'list') => {
    if (isSignedIn && user) {
      try {
        // Check if user already has a profile using the new service function
        const hasProfile = await checkUserProfileExists(user.id);
        
        if (type === 'find') {
          if (hasProfile) {
            // User has completed onboarding, go to dashboard
            navigate('/dashboard');
          } else {
            // New user, go to onboarding first
            navigate('/onboarding?type=seeker');
          }
        } else { // type === 'list'
          if (hasProfile) {
            // User has completed onboarding, go to create listing
            navigate('/create-listing');
          } else {
            // New user, go to onboarding first
            navigate('/onboarding?type=lister');
          }
        }
      } catch (error) {
          console.error("Failed to check user profile:", error);
          // Optionally, handle the error in the UI
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleUserTypeSelect = (userType: 'seeker' | 'lister') => {
    // For non-signed-in users, navigate to the correct onboarding flow
    navigate(`/onboarding?type=${userType}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection onCTAClick={handleCTAClick} />
      <HowItWorksSection />
      <FeaturesSection />
      
      <UserTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectType={handleUserTypeSelect}
      />
    </div>
  );
};

export default Index;