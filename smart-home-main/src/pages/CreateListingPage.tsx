import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase"; // Assuming this path is correct
import { Button } from "@/components/ui/button"; // Assuming this path is correct
import { Input } from "@/components/ui/input"; // Assuming this path is correct
import { Textarea } from "@/components/ui/textarea"; // Assuming this path is correct
import { Label } from "@/components/ui/label"; // Assuming this path is correct
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming this path is correct
import { ArrowLeft, Camera, Mic, CheckCircle, User, Shield, MapPin, AlertTriangle } from "lucide-react"; // Assuming lucide-react is installed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Assuming this path is correct
import FloorPlanViewer from "@/components/FloorPlanViewer"; // Assuming this path is correct
import { IdentityCheck } from "@/components/IdentityCheck"; // Assuming this path is correct
import { VerificationBadge } from "@/components/VerificationBadge"; // Assuming this path is correct
import { LocationVerifier, LocationVerificationData } from "@/components/LocationVerifier"; // Assuming this path is correct
import { Alert, AlertDescription } from "@/components/ui/alert"; // Assuming this path is correct

// --- Supabase Helper Functions for Verification ---
// These functions are placed here for demonstration. In a real application,
// they would typically reside in a separate utility file (e.g., utils/supabaseHelpers.ts).

/**
 * Checks the verification status of a user from Supabase.
 * @param userId The ID of the user to check.
 * @returns A boolean indicating if the user is verified.
 */
export const checkVerificationStatusSupabase = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles') // Assuming a 'user_profiles' table for verification status
      .select('is_verified')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error checking verification status from Supabase:", error);
      return false; // Assume not verified on error
    }

    return data?.is_verified || false;
  } catch (error) {
    console.error("Unexpected error checking verification status:", error);
    return false;
  }
};

/**
 * Saves the verification result for a user to Supabase.
 * @param userId The ID of the user.
 * @param isVerified The verification status to save.
 * @param verificationDetails Optional details about the verification.
 */
export const saveVerificationResultSupabase = async (
  userId: string,
  isVerified: boolean,
  verificationDetails?: Record<string, any>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles') // Assuming a 'user_profiles' table
      .update({
        is_verified: isVerified,
        verification_details: verificationDetails, // Store additional details if needed
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
    console.log(`Verification result for user ${userId} saved to Supabase: ${isVerified}`);
  } catch (error) {
    console.error("Error saving verification result to Supabase:", error);
    throw error;
  }
};

// --- End Supabase Helper Functions ---


interface Listing {
  id?: string;
  title: string;
  location: string;
  rent: number;
  description: string;
  isVerified: boolean;
  listerName: string;
  listerAge: number;
  floorPlanUrl?: string | null; // Made optional and can be null
  ambientNoiseDb?: number | null; // Added for ambient noise, now optional
  faceDescriptor?: Float32Array; // Added for face verification
  locationVerification?: LocationVerificationData; // Added for location verification
  createdAt?: Date;
  updatedAt?: Date;
  ownerId?: string; // Changed from userId to match security rules
}

const CreateListingPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [rent, setRent] = useState("");
  const [description, setDescription] = useState("");
  const [isWebcamScanning, setIsWebcamScanning] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isNoiseSampling, setIsNoiseSampling] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentAudioLevel, setCurrentAudioLevel] = useState(0); // Current level for visualization
  const [measuredNoiseDb, setMeasuredNoiseDb] = useState<number | null>(null); // Final dB value
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null); // Initialized as null
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [currentUserId] = useState("user-id-from-auth"); // Replace with Clerk/Firebase auth
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [locationVerification, setLocationVerification] = useState<LocationVerificationData | null>(null);
  const [showLocationVerifier, setShowLocationVerifier] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check verification status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      const verified = await checkVerificationStatusSupabase(currentUserId);
      setIsIdentityVerified(verified);
    };
    checkStatus();
  }, [currentUserId]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null); // To store FFT data
  const audioLevelSamplesRef = useRef<number[]>([]); // To store samples for averaging
  const snapshotTimerRef = useRef<NodeJS.Timeout | null>(null); // Timer for the 30-second snapshot
  const animationFrameRef = useRef<number>(); // For requestAnimationFrame
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null); // For face detection interval
  const startTimeRef = useRef<number>(0); // Track when sampling started


  // Supabase functions
  const saveListingToSupabase = async (listing: Listing) => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .insert({
          ...listing,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: currentUserId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error("Error saving listing to Supabase:", error);
      throw error;
    }
  };

  const getListingsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*");

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error getting listings from Supabase:", error);
      return [];
    }
  };

  const handleFloorPlanUpdate = (url: string | null) => { // Allow null for floor plan URL
    setFloorPlanUrl(url);
    console.log('Floor plan updated:', url);
  };

  const handlePublishListing = async () => {
    if (!title || !location || !rent || !description) {
      // Basic validation
      alert("Please fill out all fields before publishing.");
      return;
    }

    // Check identity verification
    const verified = await checkVerificationStatusSupabase(currentUserId);
    if (!verified) {
      alert("Identity not verified. Please complete identity check.");
      return;
    }

    // Check location verification
    if (!locationVerification) {
      alert("Please complete location verification before publishing.");
      return;
    }

    try {
      const newListing: Listing = {
        title,
        location,
        rent: parseInt(rent, 10),
        description,
        isVerified: true, // Assuming verification for now
        listerName: "You", // Placeholder
        listerAge: 25, // Placeholder
        floorPlanUrl: floorPlanUrl, // Now can be null
        ambientNoiseDb: measuredNoiseDb, // Save the measured dB value (can be null)
        faceDescriptor: faceDescriptor, // Save the face descriptor
        locationVerification: locationVerification, // Save the location verification data
      };

      // Save to Supabase
      const listingId = await saveListingToSupabase(newListing);
      console.log("Listing saved with ID:", listingId);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error publishing listing:", error);
      alert("Failed to publish listing. Please try again.");
    }
  };

  const handleWebcamScan = async () => {
    setMediaError(null);
    if (isWebcamScanning) {
      // Stop the stream
      webcamStream?.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsWebcamScanning(false);
      // Stop face detection interval
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
    } else {
      // Start the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setWebcamStream(stream);
        setIsWebcamScanning(true);
      } catch (err) {
        console.error("Error accessing webcam:", err);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setMediaError("Webcam access was denied. Please enable it in your browser settings.");
          } else {
            setMediaError("Could not access the webcam. Is it connected and not in use?");
          }
        } else {
          setMediaError("An unknown error occurred while accessing the webcam.");
        }
      }
    }
  };


  const handleNoiseSample = async () => {
    setMediaError(null);
    setMeasuredNoiseDb(null); // Reset previous measurement
    audioLevelSamplesRef.current = []; // Clear samples for new measurement

    if (isNoiseSampling) {
      // Stop the stream
      audioStream?.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (snapshotTimerRef.current) {
        clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
      setIsNoiseSampling(false);
      setCurrentAudioLevel(0);
      startTimeRef.current = 0;
    } else {
      // Start the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        setAudioStream(stream);

        // Create audio context
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Standard size, can be adjusted
        analyser.smoothingTimeConstant = 0.8; // Smooth the data
        analyserRef.current = analyser;
        source.connect(analyser);

        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        setIsNoiseSampling(true);
        startTimeRef.current = Date.now();
        startAudioAnalysis(analyser, dataArrayRef.current);

        // Enforce 30-second snapshot
        snapshotTimerRef.current = setTimeout(() => {
          // Stop recording after 30 seconds
          audioStream?.getTracks().forEach(track => track.stop());
          setAudioStream(null);
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
          }
          setIsNoiseSampling(false);

          // Calculate average dB from collected samples
          if (audioLevelSamplesRef.current.length > 0) {
            const sum = audioLevelSamplesRef.current.reduce((acc, val) => acc + val, 0);
            const averageDb = parseFloat((sum / audioLevelSamplesRef.current.length).toFixed(1)); // To 1 decimal place
            setMeasuredNoiseDb(averageDb); // Store the final dB value
            console.log("Average Ambient Noise dB:", averageDb);
          } else {
            setMeasuredNoiseDb(0); // Default if no samples
          }
          setCurrentAudioLevel(0); // Reset UI visualizer
          audioLevelSamplesRef.current = []; // Clear samples
          startTimeRef.current = 0;
        }, 30000); // 30 seconds
      } catch (err) {
        console.error("Error accessing microphone:", err);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setMediaError("Microphone access was denied. Please enable it in your browser settings.");
          } else if (err.name === "NotFoundError") {
            setMediaError("No microphone found. Please connect a microphone and try again.");
          } else if (err.name === "NotReadableError") {
            setMediaError("Microphone is already in use by another application. Please close other apps using the microphone.");
          } else {
            setMediaError("Could not access the microphone. Is it connected and not in use?");
          }
        } else {
          setMediaError("An unknown error occurred while accessing the microphone.");
        }
        setIsNoiseSampling(false);
      }
    }
  };

  useEffect(() => {
    if (isWebcamScanning && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [isWebcamScanning, webcamStream]);

  // Cleanup stream on component unmount
  useEffect(() => {
    return () => {
      webcamStream?.getTracks().forEach(track => track.stop());
      audioStream?.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (snapshotTimerRef.current) {
        clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
      startTimeRef.current = 0;
    };
  }, [webcamStream, audioStream]);

  const startAudioAnalysis = (analyser: AnalyserNode, dataArray: Uint8Array) => {
    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) for better loudness estimation
      let sumOfSquares = 0;
      let validSamples = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] / 255.0; // Normalize to 0-1
        if (value > 0.01) { // Only count non-silent samples
          sumOfSquares += value * value;
          validSamples++;
        }
      }

      const rms = validSamples > 0 ? Math.sqrt(sumOfSquares / validSamples) : 0;

      // Convert RMS to dB (using 1.0 as reference for 0dBFS)
      // A common range for web audio is -100dB to 0dB, mapping to 0-1 for normalized RMS
      // Using a small epsilon to avoid log(0)
      const epsilon = 1e-10;
      const dB = rms > epsilon ? 20 * Math.log10(rms) : -100; // Cap at -100dB for silence

      // Map dB (-100 to 0) to 0-100 for UI progress bar
      const normalizedLevel = Math.min(Math.max(0, (dB + 100) * 1.5), 100); // Scale for better visibility
      setCurrentAudioLevel(normalizedLevel);

      // Store actual dB values for final average (only if not silence)
      if (dB > -90) { // Only store if not essentially silent
        audioLevelSamplesRef.current.push(dB);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Create Your Listing</CardTitle>
                <CardDescription>Fill out the details below to find your perfect roommate.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <VerificationBadge isVerified={isIdentityVerified} />
                {!isIdentityVerified && (
                  <Link to="/identity-check">
                    <Button variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50">
                      <Shield className="w-4 h-4 mr-2" />
                      Complete Identity Verification
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Sunny Room in a Quiet Apartment" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Williamsburg, Brooklyn" />
              </div>
              <div>
                <Label htmlFor="rent">Monthly Rent ($)</Label>
                <Input id="rent" type="number" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="e.g., 1200" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the room, apartment, and ideal roommate..." rows={5} />
              </div>

              {/* Floor Plan Viewer */}
              <div>
                <Label>Floor Plan (Optional)</Label> {/* Changed label to indicate optional */}
                <div className="mt-2">
                  <FloorPlanViewer
                    floorPlanUrl={floorPlanUrl} // Can now be null
                    householdId="temp-household-id" // Replace with actual household ID
                    userId={currentUserId}
                    onFloorPlanUpdate={handleFloorPlanUpdate}
                    editable={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Interactive 3D floor plan viewer. Upload your floor plan or capture it with your camera to help potential roommates visualize the space.
                  <br/>
                  This step is **optional**. Listings without a floor plan will still be published.
                </p>
              </div>
            </div>

            {/* Verification Section */}
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Verify Your Listing to Build Trust</h3>
              <p className="text-muted-foreground text-sm mb-6">Verified listings get 3x more applicants. Complete these simple, simulated checks.</p>
              <div className="flex flex-col items-center gap-4">
                {mediaError && (
                  <Alert variant="destructive" className="w-full max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{mediaError}</AlertDescription>
                  </Alert>
                )}
                {isWebcamScanning && (
                  <div className="w-full max-w-md bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                  </div>
                )}
                {isNoiseSampling && (
                  <div className="w-full max-w-md bg-muted rounded-lg p-4 flex items-center gap-4">
                    <Mic className="w-6 h-6 text-primary animate-pulse" />
                    <div className="w-full bg-background rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(currentAudioLevel, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {Math.max(0, Math.ceil((30000 - (Date.now() - startTimeRef.current)) / 1000))}s remaining
                    </span>
                  </div>
                )}


                {/* Noise Sample Info & Button */}
                <div className="w-full flex flex-col items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground cursor-help">
                          What is "Noise Sample"?
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm text-sm">
                        <p>
                          We'll take a 30-second snapshot of your room's ambient noise to provide potential roommates with objective information.
                          <strong>Only the numerical noise level (in dB) is recorded and saved, not any audio recordings or conversations.</strong>
                          This helps us match you with seekers who prefer a specific noise environment (e.g., very quiet vs. lively).
                          <br/><br/>
                          This step is **optional** but highly recommended for better matches.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex-1"
                    onClick={handleNoiseSample}
                    disabled={isWebcamScanning || (isNoiseSampling && measuredNoiseDb === null)}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {isNoiseSampling
                      ? "Sampling Noise..."
                      : measuredNoiseDb !== null
                        ? `Retake Noise Sample (${measuredNoiseDb} dB)`
                        : "Begin Noise Sample (30s)"}
                    {measuredNoiseDb !== null && !isNoiseSampling && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
                  </Button>
                  {measuredNoiseDb !== null && !isNoiseSampling && (
                    <p className="text-sm text-green-600 mt-1">
                      Ambient Noise Measured: <strong>{measuredNoiseDb} dB</strong>. Ready for publishing!
                    </p>
                  )}
                  {measuredNoiseDb === null && !isNoiseSampling && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Ambient noise sample is optional. You can publish without it, but it's recommended!
                    </p>
                  )}
                </div>

                {/* Webcam Scan Button */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleWebcamScan}
                    disabled={isNoiseSampling}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isWebcamScanning ? "Stop Webcam Scan" : "Start Webcam Scan"}
                  </Button>
                </div>

                {/* Location Verification */}
                <div className="w-full flex flex-col items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground cursor-help">
                          What is "Location Verification"?
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm text-sm">
                        <p>
                          We verify that you are physically near the property you're listing using your device's location services.
                          This helps ensure you have access to the property and builds trust with potential roommates.
                          <strong>Only approximate location is used for verification, not your exact address.</strong>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex-1"
                    onClick={() => setShowLocationVerifier(true)}
                    disabled={isWebcamScanning || isNoiseSampling}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {locationVerification
                      ? `Location Verified (${locationVerification.accuracy}m accuracy)`
                      : "Verify Location"}
                    {locationVerification && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
                  </Button>
                  {locationVerification && (
                    <p className="text-sm text-green-600 mt-1">
                      Location verified at {locationVerification.latitude.toFixed(4)}, {locationVerification.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div>
              <Button size="lg" className="w-full bg-gradient-hero" onClick={handlePublishListing}>
                Publish Listing
              </Button>
            </div>

            {/* Identity Verification Section */}
            <Card className="bg-card/60 border-border shadow-soft mt-10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Identity Verification</CardTitle>
                    <CardDescription>
                      Complete identity verification to build trust with potential roommates.
                    </CardDescription>
                  </div>
                  <VerificationBadge isVerified={isIdentityVerified} />
                </div>
              </CardHeader>
              <CardContent>
                <IdentityCheck
                  currentUserId={currentUserId}
                  // You might need to update IdentityCheck to use the new Supabase helper
                  // If IdentityCheck internally calls saveVerificationResult, you'll need to pass
                  // saveVerificationResultSupabase as a prop or update IdentityCheck itself.
                  onVerificationComplete={setIsIdentityVerified}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Location Verifier Modal */}
      {showLocationVerifier && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <LocationVerifier
              onVerificationComplete={(data) => {
                setLocationVerification(data);
                setShowLocationVerifier(false);
              }}
              onCancel={() => setShowLocationVerifier(false)}
              requiredAccuracy={100} // 100m accuracy requirement
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListingPage;
