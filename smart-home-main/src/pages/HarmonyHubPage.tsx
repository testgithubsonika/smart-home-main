import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { HarmonyDashboard } from "@/components/HarmonyDashboard";

const HarmonyHubPage = () => {
  const navigate = useNavigate();

  // Mock household and user data - replace with actual auth data
  const householdId = 'household-123';
  const userId = 'user-456';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sarah & Leo's Harmony Hub</h1>
            <p className="text-muted-foreground">Your shared space for a happy home.</p>
          </div>
        </div>

        {/* Harmony Dashboard */}
        <HarmonyDashboard 
          householdId={householdId}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default HarmonyHubPage;
