import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";

interface VerificationBadgeProps {
  isVerified: boolean;
  isPending?: boolean;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  isPending = false,
  size = "md",
  showIcon = true
}) => {
  const getBadgeContent = () => {
    if (isPending) {
      return {
        text: "Verification Pending",
        variant: "secondary" as const,
        icon: <Clock className="w-3 h-3" />,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200"
      };
    }
    
    if (isVerified) {
      return {
        text: "Identity Verified",
        variant: "default" as const,
        icon: <CheckCircle className="w-3 h-3" />,
        className: "bg-green-100 text-green-800 border-green-200"
      };
    }
    
    return {
      text: "Not Verified",
      variant: "destructive" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-red-100 text-red-800 border-red-200"
    };
  };

  const content = getBadgeContent();

  return (
    <Badge 
      variant={content.variant}
      className={`${content.className} flex items-center gap-1 border`}
    >
      {showIcon && content.icon}
      <span className="text-xs font-medium">{content.text}</span>
    </Badge>
  );
};

// Compact version for small spaces
export const CompactVerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  isPending = false
}) => {
  if (isPending) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="w-3 h-3" />
      </Badge>
    );
  }
  
  if (isVerified) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3" />
      </Badge>
    );
  }
  
  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
      <XCircle className="w-3 h-3" />
    </Badge>
  );
}; 