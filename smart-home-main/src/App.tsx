import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { useEffect } from "react";
import { autoSetupDatabase, shouldAutoSetup } from "@/utils/autoSetup";
import { useFirebaseAuthSync } from "@/utils/firebaseAuthSync";
import Index from "./pages/Index";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import CreateListingPage from "./pages/CreateListingPage";
import IdentityCheckPage from "./pages/IdentityCheckPage";
import HarmonyHubPage from "./pages/HarmonyHubPage";
import { SecuritySettingsPage } from "./pages/SecuritySettingsPage";
import { DevToolsPage } from "./pages/DevToolsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Sync Firebase Auth with Clerk
  useFirebaseAuthSync();

  // Auto-setup database in development mode
  useEffect(() => {
    if (shouldAutoSetup()) {
      autoSetupDatabase();
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/onboarding"
          element={
            <>
              <SignedIn>
                <OnboardingPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <DashboardPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/create-listing"
          element={
            <>
              <SignedIn>
                <CreateListingPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/identity-check"
          element={
            <>
              <SignedIn>
                <IdentityCheckPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/harmony-hub"
          element={
            <>
              <SignedIn>
                <HarmonyHubPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/security-settings"
          element={
            <>
              <SignedIn>
                <SecuritySettingsPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dev-tools"
          element={
            <>
              <SignedIn>
                <DevToolsPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
