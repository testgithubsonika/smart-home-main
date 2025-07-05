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
      if (type === 'find') {
        navigate('/dashboard');
      } else {
        navigate('/create-listing');
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
