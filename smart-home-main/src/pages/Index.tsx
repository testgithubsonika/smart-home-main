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
      // Both 'find' and 'list' users now navigate to onboarding
      // with their respective types if already signed in.
      if (type === 'find') {
        window.location.href = `/onboarding?type=seeker`; // Explicitly set seeker for 'find'
      } else {
        window.location.href = `/onboarding?type=lister`; // Explicitly set lister for 'list'
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleUserTypeSelect = (userType: 'seeker' | 'lister') => {
    console.log('User selected:', userType);
    window.location.href = `/onboarding?type=${userType}`;
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