import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, CheckCircle } from "lucide-react";

export const HowItWorksSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "AI-Powered Onboarding",
      description: "Chat with our AI for 5 minutes to build your Roommate DNA profile. No boring forms - just natural conversation about your lifestyle and preferences.",
      color: "bg-primary"
    },
    {
      icon: Users,
      title: "Compatibility Matching", 
      description: "Our AI analyzes thousands of compatibility factors to present you with matches that actually make sense for your specific living style.",
      color: "bg-secondary"
    },
    {
      icon: CheckCircle,
      title: "Verified & Safe",
      description: "Every user is identity verified and every room is sensor-scanned. No scams, no surprises - just transparent, trustworthy connections.",
      color: "bg-accent"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Three Simple Steps to Your Perfect Match
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From AI profiling to verified matches, we've streamlined the entire roommate finding process.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/60 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6">
                <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};