import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Users, MessageCircle, Camera, TrendingUp } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Roommate DNA",
      description: "Our AI creates a comprehensive compatibility profile in under 5 minutes. No boring forms - just natural conversation.",
      badge: "Smart Matching"
    },
    {
      icon: Camera,
      title: "Sensor Verification",
      description: "Webcam room scans capture dimensions, lighting, and noise levels. Every listing is verified and fraud-free.",
      badge: "Verified"
    },
    {
      icon: Shield,
      title: "Trust & Safety First",
      description: "Identity verification, background checks, and community ratings ensure you're matching with real, trustworthy people.",
      badge: "Secure"
    },
    {
      icon: MessageCircle,
      title: "AI-Mediated Chat",
      description: "Get conversation suggestions and conflict resolution tools. Our AI helps navigate those awkward roommate questions.",
      badge: "Guided"
    },
    {
      icon: Users,
      title: "Compatibility Explained",
      description: "See exactly why you match with detailed compatibility reports. No more guessing - transparency in every connection.",
      badge: "Transparent"
    },
    {
      icon: TrendingUp,
      title: "Post-Move Success",
      description: "Shared dashboards, chore tracking, and bill splitting tools help maintain harmony after you move in together.",
      badge: "Ongoing"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Revolutionary Features
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Beyond Basic Listings
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart Roomie uses cutting-edge AI and sensor technology to solve the deep compatibility challenges that other platforms ignore.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
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