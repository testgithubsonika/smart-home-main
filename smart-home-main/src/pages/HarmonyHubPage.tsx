import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Lightbulb } from "lucide-react";

const HarmonyHubPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
        </div>

        {/* Hub Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Shared Chores Card */}
          <Card className="bg-card/60 backdrop-blur-sm border-border shadow-soft">
            <CardHeader>
              <CardTitle>Shared Chores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox id="chore1" defaultChecked />
                <label htmlFor="chore1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Take out trash
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="chore2" />
                <label htmlFor="chore2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Clean bathroom
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="chore3" />
                <label htmlFor="chore3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Buy paper towels
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Shared Bills Card */}
          <Card className="bg-card/60 backdrop-blur-sm border-border shadow-soft">
            <CardHeader>
              <CardTitle>Shared Bills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-medium">Rent</p>
                <p className="text-muted-foreground">$2800 (Due Oct 1st)</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Utilities</p>
                <p className="text-muted-foreground">$95 (Due Oct 15th)</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Internet</p>
                <p className="text-muted-foreground">$60 (Due Oct 20th)</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Nudge Card */}
          <Card className="bg-primary/10 border-primary/30 text-primary-foreground col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                AI Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                It looks like the trash is full. A friendly reminder to take it out might be helpful to keep your shared space clean!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HarmonyHubPage;
