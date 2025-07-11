import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { UserTypeModal } from "@/components/UserTypeModal";

const Index = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isSignedIn } = useUser();

  const handleCTAClick = (type: 'find' | 'list') => {
    if (isSignedIn) {
      // Check if user already has a profile
      const existingProfile = localStorage.getItem('userProfile');
      
      if (type === 'find') {
        if (existingProfile) {
          // User has completed onboarding, go to dashboard
          navigate('/dashboard');
        } else {
          // New user, go to onboarding first
          navigate('/onboarding?type=seeker');
        }
      } else {
        if (existingProfile) {
          // User has completed onboarding, go to create listing
          navigate('/create-listing');
        } else {
          // New user, go to onboarding first
          navigate('/onboarding?type=lister');
        }
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleUserTypeSelect = (userType: 'seeker' | 'lister') => {
    console.log('User selected:', userType);
    // For non-signed-in users, use navigate instead of window.location.href
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