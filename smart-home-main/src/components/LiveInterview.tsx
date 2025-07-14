import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  MessageCircle,
  User,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveInterviewProps {
  onInterviewComplete?: (success: boolean) => void;
  participantName?: string;
  isHost?: boolean;
}

export const LiveInterview: React.FC<LiveInterviewProps> = ({
  onInterviewComplete,
  participantName = 'Interview Participant',
  isHost = false
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize media stream
  useEffect(() => {
    const initializeStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setStream(mediaStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        
        setIsConnected(true);
        toast.success('Camera and microphone connected');
      } catch (err) {
        setError('Failed to access camera and microphone');
        toast.error('Failed to access camera and microphone');
      }
    };

    initializeStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        toast.info(videoTrack.enabled ? 'Video enabled' : 'Video disabled');
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        toast.info(audioTrack.enabled ? 'Microphone enabled' : 'Microphone disabled');
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    toast.success('Recording started');
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.success('Recording stopped');
  };

  const endInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsConnected(false);
    onInterviewComplete?.(true);
    toast.success('Interview ended');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Interview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Badge>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                Recording
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              You
            </div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-48 object-cover rounded-lg bg-gray-900"
            />
          </CardContent>
        </Card>

        {/* Remote Video */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              {participantName}
            </div>
            <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <p>Waiting for participant...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? 'default' : 'outline'}
              size="sm"
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? 'default' : 'outline'}
              size="sm"
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            
            <Button
              onClick={endInterview}
              variant="destructive"
              size="sm"
            >
              <PhoneOff className="h-4 w-4" />
              End Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Interview Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-50 rounded-lg p-3 overflow-y-auto">
            <p className="text-sm text-gray-500">Chat feature coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
