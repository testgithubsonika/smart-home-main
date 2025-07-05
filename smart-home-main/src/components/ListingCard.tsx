import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, MapPin, DollarSign, Shield } from "lucide-react";

interface CompatibilityFactor {
  label: string;
  match: boolean;
  description: string;
}

interface ListingCardProps {
  id: string;
  title: string;
  location: string;
  rent: number;
  image: string;
  isVerified: boolean;
  matchScore: number;
  compatibility: CompatibilityFactor[];
  listerName: string;
  listerAge: number;
}

export const ListingCard = ({ 
  title, 
  location, 
  rent, 
  image, 
  isVerified, 
  matchScore, 
  compatibility, 
  listerName, 
  listerAge 
}: ListingCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-soft transition-all duration-300 border-1 bg-card/70 backdrop-blur-sm overflow-hidden">
      {/* Image */}
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        {isVerified && (
          <div className="absolute top-3 right-3 bg-accent/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">Verified</span>
          </div>
        )}
        {/* Match Score Badge */}
        <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-sm font-bold text-primary-foreground">{matchScore}% Match</span>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold leading-tight">{title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${rent}/month
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {listerName}, {listerAge} years old
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Compatibility Report */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-hero rounded-full flex items-center justify-center">
              <CheckCircle className="w-2 h-2 text-primary-foreground" />
            </div>
            Compatibility Report
          </h4>
          
          <div className="space-y-2">
            {compatibility.map((factor, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {factor.match ? (
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium">{factor.label}:</span>
                  <span className="text-muted-foreground ml-1">{factor.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="hero" size="sm" className="flex-1">
            Message {listerName}
          </Button>
          <Button variant="outline" size="sm">
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};