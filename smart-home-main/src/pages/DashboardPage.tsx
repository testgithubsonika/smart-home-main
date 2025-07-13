import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, getDocs, collection, query, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/ListingCard";
import { Search, Filter, ArrowLeft, User } from "lucide-react";
import room1Image from "@/assets/room-1.jpg";
import room2Image from "@/assets/room-2.jpg";
import room3Image from "@/assets/room-3.jpg";
import room4Image from "@/assets/room-4.jpg";
import room5Image from "@/assets/third.jpg";
import room6Image from "@/assets/living-room.jpg";
import room7Image from "@/assets/dinner.jpg";
import room8Image from "@/assets/drawingroom.jpg";

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
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true); // NEW: loading state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Firestore functions
  const getUserProfileFromFirestore = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  };

  const getListingsFromFirestore = async (userId?: string) => {
    try {
      let listingsQuery;
      if (userId) {
        // Get user's own listings
        listingsQuery = query(collection(db, "listings"), where("userId", "==", userId));
      } else {
        // Get all listings
        listingsQuery = collection(db, "listings");
      }
      
      const querySnapshot = await getDocs(listingsQuery);
      const listings: Listing[] = [];
      querySnapshot.forEach((doc) => {
        listings.push({ id: doc.id, ...doc.data() } as Listing);
      });
      return listings;
    } catch (error) {
      console.error("Error getting listings:", error);
      return [];
    }
  };

  const seedDummyListings = async () => {
    const dummyListings = [
      {
        title: 'Spacious Room in Sunny Apartment',
        location: 'Williamsburg, Brooklyn',
        rent: 1450,
        isVerified: true,
        listerName: 'Alex',
        listerAge: 28,
        userId: 'dummy1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Cozy Bedroom near Downtown',
        location: 'East Village, Manhattan',
        rent: 1600,
        isVerified: true,
        listerName: 'Jessica',
        listerAge: 25,
        userId: 'dummy2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Modern Loft with a Great View',
        location: 'DUMBO, Brooklyn',
        rent: 1800,
        isVerified: true,
        listerName: 'Mike',
        listerAge: 31,
        userId: 'dummy3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Quiet and Bright Room in Queens',
        location: 'Astoria, Queens',
        rent: 1100,
        isVerified: false,
        listerName: 'Sarah',
        listerAge: 29,
        userId: 'dummy4',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Artistic Space in Bushwick',
        location: 'Bushwick, Brooklyn',
        rent: 1250,
        isVerified: true,
        listerName: 'David',
        listerAge: 27,
        userId: 'dummy5',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      for (const listing of dummyListings) {
        await addDoc(collection(db, "listings"), listing);
      }
      console.log("Dummy listings seeded successfully");
    } catch (error) {
      console.error("Error seeding dummy listings:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    
    const loadData = async () => {
      try {
        // Get user profile from Firestore
        const userId = "user123"; // Replace with actual user ID from auth
        const profile = await getUserProfileFromFirestore(userId);
        
        if (profile) {
          setUserProfile(profile);
          
          // Get listings based on user type
          if (profile.userType === 'seeker') {
            const allListings = await getListingsFromFirestore();
            if (allListings.length === 0) {
              // Seed dummy data if no listings exist
              await seedDummyListings();
              const seededListings = await getListingsFromFirestore();
              setListings(seededListings);
            } else {
              setListings(allListings);
            }
          } else {
            const myListings = await getListingsFromFirestore(userId);
            setListings(myListings);
          }
        } else {
          navigate('/onboarding?type=seeker');
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
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

  if (loading) {
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

  // Simple filter logic
  const applyFilters = () => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query) ||
        listing.listerName.toLowerCase().includes(query)
      );
    }

    // Rent range filter
    if (minRent) {
      filtered = filtered.filter(listing => listing.rent >= parseInt(minRent));
    }
    if (maxRent) {
      filtered = filtered.filter(listing => listing.rent <= parseInt(maxRent));
    }

    // Verified filter
    if (verifiedOnly) {
      filtered = filtered.filter(listing => listing.isVerified);
    }

    setFilteredListings(filtered);
  };

  // Apply filters when criteria change
  useEffect(() => {
    applyFilters();
  }, [listings, searchQuery, minRent, maxRent, verifiedOnly]);

  const images = [room1Image, room2Image, room3Image, room4Image, room5Image, room6Image, room7Image, room8Image]; // Add as many images as you want

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters {filteredListings.length !== listings.length && `(${filteredListings.length})`}
          </Button>
        </div>

        {/* Simple Filter Panel */}
        {showFilters && (
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 mb-8 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setMinRent('');
                  setMaxRent('');
                  setVerifiedOnly(false);
                }}
              >
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rent Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Rent Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
              </div>

              {/* Verified Only */}
              <div>
                <label className="block text-sm font-medium mb-2">Verified Only</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span>Show verified listings only</span>
                </label>
              </div>

              {/* Results Count */}
              <div>
                <label className="block text-sm font-medium mb-2">Results</label>
                <p className="text-sm text-muted-foreground">
                  {filteredListings.length} of {listings.length} listings
                </p>
              </div>
            </div>
          </div>
        )}

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
          {filteredListings.length > 0 ? (
            filteredListings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                location={listing.location}
                rent={listing.rent}
                image={images[index % images.length]} // Cycle through placeholder images
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