import React from 'react';
import { HarmonyDashboard } from '@/components/HarmonyDashboard';

const HarmonyPage: React.FC = () => {
  // Mock household and user data - replace with actual auth data
  const householdId = 'household-123';
  const userId = 'user-456';

  return (
    <div className="container mx-auto px-4 py-8">
      <HarmonyDashboard 
        householdId={householdId}
        userId={userId}
      />
    </div>
  );
};

export default HarmonyPage; 