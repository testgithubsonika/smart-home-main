import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Smile, RotateCcw } from "lucide-react";

export default function LivenessChallenge() {
  const [currentChallenge, setCurrentChallenge] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [challengeStep, setChallengeStep] = useState(0);

  const challenges = [
    "Blink your eyes",
    "Smile naturally",
    "Turn your head left",
    "Turn your head right",
    "Nod your head"
  ];

  const startChallenge = () => {
    setChallengeStep(0);
    setCurrentChallenge(challenges[0]);
    setIsCompleted(false);
  };

  const nextChallenge = () => {
    if (challengeStep < challenges.length - 1) {
      setChallengeStep(challengeStep + 1);
      setCurrentChallenge(challenges[challengeStep + 1]);
    } else {
      setIsCompleted(true);
      setCurrentChallenge("All challenges completed!");
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Liveness Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCompleted ? (
          <>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-lg font-medium mb-2">Current Challenge:</p>
              <p className="text-2xl text-primary">{currentChallenge}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={startChallenge} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
              <Button onClick={nextChallenge} size="sm">
                <Smile className="w-4 h-4 mr-2" />
                Complete Challenge
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Step {challengeStep + 1} of {challenges.length}
            </div>
          </>
        ) : (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">✅ Liveness verification completed!</p>
            <p className="text-sm text-green-600 mt-1">Your identity has been verified as a real person.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
