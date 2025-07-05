import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Brain, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-roommates.jpg";

interface HeroSectionProps {
  onCTAClick: (type: 'find' | 'list') => void;
}

export const HeroSection = ({ onCTAClick }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-subtle overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-light/20 to-secondary-light/20" />
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                <Shield className="w-4 h-4 mr-2" />
                AI-Powered & Verified
              </Badge>
              <h1 className="text-5xl font-bold leading-tight">
                Find Your Perfect Roommate
                <span className="bg-gradient-hero bg-clip-text text-transparent"> with Smart Roomie</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Smart Roomie uses AI and sensor verification to match you with compatible roommates based on lifestyle, not just budget. Say goodbye to roommate roulette.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-accent" />
                Identity Verified
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-accent" />
                Room Scanned
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-accent" />
                AI Compatibility
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-soft hover:shadow-glow transition-all duration-300"
                onClick={() => onCTAClick('find')}
              >
                <Users className="w-5 h-5 mr-2" />
                Find a Room
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onCTAClick('list')}
              >
                <Brain className="w-5 h-5 mr-2" />
                List Your Room
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">92%</div>
                <div className="text-sm text-muted-foreground">Match Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">5 min</div>
                <div className="text-sm text-muted-foreground">Average Setup</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Verified Users</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-soft">
              <img 
                src={heroImage} 
                alt="Happy roommates in a modern apartment" 
                className="w-full h-auto object-cover"
              />
              {/* Floating Trust Badge */}
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-card">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-sm font-medium">Verified Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};