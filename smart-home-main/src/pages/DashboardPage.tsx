import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/ListingCard";
import { Search, Filter, ArrowLeft, User } from "lucide-react";
import room1Image from "@/assets/room-1.jpg";
import room2Image from "@/assets/room-2.jpg";

interface Listing {
  id: string;
  title: string;
  location: string;
  rent: number;
  image?: string;
  isVerified: boolean;
  listerName: string;
  listerAge: number;
  compatibility?: any[];
  matchScore?: number;
}

interface UserProfile {
  userType: 'seeker' | 'lister';
  cleanliness: number;
  socialStyle: string;
  sleepSchedule: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    // Seed with example data if no listings exist
    const existingListings = localStorage.getItem('listings');
    if (!existingListings || JSON.parse(existingListings).length === 0) {
      const dummyListings = [
        {
          id: '101',
          title: 'Spacious Room in Sunny Apartment',
          location: 'Williamsburg, Brooklyn',
          rent: 1450,
          isVerified: true,
          listerName: 'Alex',
          listerAge: 28,
        },
        {
          id: '102',
          title: 'Cozy Bedroom near Downtown',
          location: 'East Village, Manhattan',
          rent: 1600,
          isVerified: true,
          listerName: 'Jessica',
          listerAge: 25,
        },
        {
          id: '103',
          title: 'Modern Loft with a Great View',
          location: 'DUMBO, Brooklyn',
          rent: 1800,
          isVerified: true,
          listerName: 'Mike',
          listerAge: 31,
        },
        {
          id: '104',
          title: 'Quiet and Bright Room in Queens',
          location: 'Astoria, Queens',
          rent: 1100,
          isVerified: false,
          listerName: 'Sarah',
          listerAge: 29,
        },
        {
          id: '105',
          title: 'Artistic Space in Bushwick',
          location: 'Bushwick, Brooklyn',
          rent: 1250,
          isVerified: true,
          listerName: 'David',
          listerAge: 27,
        },
        {
          id: '106',
          title: 'Charming Room in Historic Brownstone',
          location: 'Harlem, Manhattan',
          rent: 1300,
          isVerified: true,
          listerName: 'Chloe',
          listerAge: 26,
        }
      ];
      localStorage.setItem('listings', JSON.stringify(dummyListings));
    }

    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      setUserProfile(profile);

      const allListings = JSON.parse(localStorage.getItem('listings') || '[]');
      
      if (profile.userType === 'seeker') {
        setListings(allListings);
      } else {
        const myListings = allListings.filter((l: any) => l.listerName === 'You');
        setListings(myListings);
      }

    } else {
      navigate('/onboarding?type=seeker');
    }
  }, [navigate]);

  const getCompatibilityData = (userProfile: UserProfile) => {
    const cleanlinessScore = userProfile.cleanliness || 3;
    const socialStyle = userProfile.socialStyle || '';
    const sleepSchedule = userProfile.sleepSchedule || '';

    return {
      listing1: [
        {
          label: "Cleanliness",
          match: cleanlinessScore >= 4,
          description: cleanlinessScore >= 4 
            ? "You both prefer a 'Spotless' space (5/5)" 
            : "Leo prefers 'Spotless' (5/5), you prefer moderate cleanliness"
        },
        {
          label: "Social Style",
          match: socialStyle.toLowerCase().includes('quiet') || socialStyle.toLowerCase().includes('homebody'),
          description: socialStyle.toLowerCase().includes('quiet') || socialStyle.toLowerCase().includes('homebody')
            ? "You're both 'Quiet Homebodies' who value privacy"
            : "Leo is a 'Quiet Homebody', you're more social - good to discuss"
        },
        {
          label: "Sleep Schedule",
          match: sleepSchedule.toLowerCase().includes('early'),
          description: sleepSchedule.toLowerCase().includes('early')
            ? "Both 'Early Birds' - perfect morning compatibility!"
            : "Leo is an 'Early Bird', you're a 'Night Owl' - discuss quiet hours"
        }
      ],
      listing2: [
        {
          label: "Cleanliness",
          match: cleanlinessScore <= 3,
          description: cleanlinessScore <= 3
            ? "Both prefer 'Lived-in' comfort over spotless spaces"
            : "Maya prefers 'Lived-in' (3/5), you prefer higher cleanliness"
        },
        {
          label: "Social Style", 
          match: socialStyle.toLowerCase().includes('social') || socialStyle.toLowerCase().includes('host'),
          description: socialStyle.toLowerCase().includes('social') || socialStyle.toLowerCase().includes('host')
            ? "You're both 'Social Hosts' who enjoy having friends over"
            : "Maya is a 'Social Host', you prefer quieter environments"
        },
        {
          label: "Sleep Schedule",
          match: sleepSchedule.toLowerCase().includes('night'),
          description: sleepSchedule.toLowerCase().includes('night')
            ? "Both 'Night Owls' - late-night compatibility is perfect!"
            : "Maya is a 'Night Owl', you're an 'Early Bird' - discuss schedules"
        }
      ]
    };
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your matches...</p>
        </div>
      </div>
    );
  }

  const compatibility = getCompatibilityData(userProfile);

  // Calculate match scores based on compatibility
  const getMatchScore = (compatibilityFactors: any[]) => {
    const matches = compatibilityFactors.filter(f => f.match).length;
    return Math.round((matches / compatibilityFactors.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
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
              <h1 className="text-3xl font-bold">Your Matches</h1>
              <p className="text-muted-foreground">Perfect roommate matches based on your compatibility profile</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-2 capitalize">
              <User className="w-3 h-3" />
              {userProfile.userType} 
            </Badge>
            {userProfile.userType === 'lister' && (
              <Button onClick={() => navigate('/create-listing')}>Create New Listing</Button>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by location, price, or amenities..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Profile Summary */}
        <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 mb-8 border border-border">
          <h2 className="text-lg font-semibold mb-4">Your Roommate DNA Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                {userProfile.cleanliness || 3}
              </div>
              <span>Cleanliness Level ({userProfile.cleanliness || 3}/5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
              <span>{userProfile.socialStyle || 'Social Style'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                🦉
              </div>
              <span>{userProfile.sleepSchedule || 'Sleep Schedule'}</span>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {listings.length > 0 ? (
            listings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                location={listing.location}
                rent={listing.rent}
                image={index % 2 === 0 ? room1Image : room2Image} // Cycle through placeholder images
                isVerified={listing.isVerified}
                matchScore={userProfile.userType === 'seeker' ? getMatchScore(compatibility.listing1) : undefined}
                compatibility={userProfile.userType === 'seeker' ? compatibility.listing1 : []}
                listerName={listing.listerName}
                listerAge={listing.listerAge}
              />
            ))
          ) : (
            <div className="lg:col-span-2 text-center py-16 bg-card/60 rounded-lg border border-dashed">
              <h3 className="text-xl font-semibold">No listings found.</h3>
              {userProfile.userType === 'lister' ? (
                <p className="text-muted-foreground mt-2">Click "Create New Listing" to get started.</p>
              ) : (
                <p className="text-muted-foreground mt-2">Check back later for new roommate opportunities!</p>
              )}
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Matches
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;