import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Camera, Mic } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();

  const handlePublishListing = () => {
    if (!title || !location || !rent || !description) {
      // Basic validation
      alert("Please fill out all fields before publishing.");
      return;
    }

    const newListing = {
      id: Date.now().toString(),
      title,
      location,
      rent: parseInt(rent, 10),
      description,
      isVerified: true, // Assuming verification for now
      listerName: "You", // Placeholder
      listerAge: 25, // Placeholder
    };

    // Get existing listings from localStorage
    const existingListings = JSON.parse(localStorage.getItem('listings') || '[]');
    
    // Add the new listing
    const updatedListings = [...existingListings, newListing];

    // Save back to localStorage
    localStorage.setItem('listings', JSON.stringify(updatedListings));

    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleWebcamScan = async () => {
    setMediaError(null);
    if (isWebcamScanning) {
      // Stop the stream
      webcamStream?.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsWebcamScanning(false);
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
      }
    };
  }, [webcamStream, audioStream]);

  const handleNoiseSample = async () => {
    setMediaError(null);
    if (isNoiseSampling) {
      // Stop the stream
      audioStream?.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      setIsNoiseSampling(false);
      setAudioLevel(0);
    } else {
      // Start the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const animate = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel(average);
          requestRef.current = requestAnimationFrame(animate);
        };

        animate();
        setIsNoiseSampling(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setMediaError("Microphone access was denied. Please enable it in your browser settings.");
          } else {
            setMediaError("Could not access the microphone. Is it connected and not in use?");
          }
        } else {
          setMediaError("An unknown error occurred while accessing the microphone.");
        }
      }
    }
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
            <CardTitle className="text-2xl font-bold">Create Your Listing</CardTitle>
            <CardDescription>Fill out the details below to find your perfect roommate.</CardDescription>
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
            </div>

            {/* Verification Section */}
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Verify Your Listing to Build Trust</h3>
              <p className="text-muted-foreground text-sm mb-6">Verified listings get 3x more applicants. Complete these simple, simulated checks.</p>
              <div className="flex flex-col items-center gap-4">
                {mediaError && <p className="text-red-500 text-sm">Error: {mediaError}</p>}
                {isWebcamScanning && (
                  <div className="w-full max-w-md bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                  </div>
                )}
                {isNoiseSampling && (
                  <div className="w-full max-w-md bg-muted rounded-lg p-4 flex items-center gap-4">
                    <Mic className="w-6 h-6 text-primary" />
                    <div className="w-full bg-background rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(audioLevel, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
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
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleNoiseSample}
                    disabled={isWebcamScanning}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {isNoiseSampling ? "Stop Noise Sample" : "Begin Noise Sample"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div>
              <Button size="lg" className="w-full bg-gradient-hero" onClick={handlePublishListing}>
                Publish Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateListingPage;
