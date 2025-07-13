import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  X, 
  Lightbulb, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Heart,
  Brain,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

import { ConflictCoachSession } from '@/types/harmony';
import { 
  startConflictCoachSession, 
  continueConflictCoachSession,
  getConflictResolutionTips 
} from '@/services/conflictCoachService';

interface ConflictCoachProps {
  householdId: string;
  userId: string;
  onClose: () => void;
  initialTopic?: string;
  initialContext?: string;
}

export const ConflictCoach: React.FC<ConflictCoachProps> = ({
  householdId,
  userId,
  onClose,
  initialTopic = '',
  initialContext = '',
}) => {
  const [session, setSession] = useState<ConflictCoachSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showTopicSelection, setShowTopicSelection] = useState(!initialTopic);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [context, setContext] = useState(initialContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const topics = [
    { id: 'chores', label: 'Chores & Cleaning', icon: '🧹' },
    { id: 'finances', label: 'Bills & Money', icon: '💰' },
    { id: 'noise', label: 'Noise & Quiet', icon: '🔇' },
    { id: 'space', label: 'Personal Space', icon: '🏠' },
    { id: 'scheduling', label: 'Schedules & Timing', icon: '⏰' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'other', label: 'Other', icon: '❓' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleStartSession = async () => {
    if (!selectedTopic) {
      toast.error('Please select a topic');
      return;
    }

    setIsStarting(true);
    try {
      const newSession = await startConflictCoachSession(
        householdId,
        [userId], // Add other household members here
        selectedTopic,
        context
      );
      setSession(newSession);
      setShowTopicSelection(false);
      toast.success('Conflict coaching session started');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start coaching session');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !session) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const result = await continueConflictCoachSession(
        session.id,
        session,
        userMessage
      );

      // Update session with new messages
      setSession(prev => prev ? {
        ...prev,
        messages: [
          ...prev.messages,
          { role: 'user', content: userMessage, timestamp: new Date() },
          { role: 'assistant', content: result.response, timestamp: new Date() },
        ],
        suggestions: result.suggestions,
        status: result.shouldEndSession ? 'completed' : 'active',
        endedAt: result.shouldEndSession ? new Date() : undefined,
      } : null);

      if (result.shouldEndSession) {
        toast.success('Coaching session completed!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (session) {
        handleSendMessage();
      } else {
        handleStartSession();
      }
    }
  };

  const getTopicIcon = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.icon || '❓';
  };

  const getTopicLabel = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.label || 'Unknown Topic';
  };

  const [tips, setTips] = useState<string[]>([]);

  const getTips = () => {
    return tips;
  };

  // Load tips when topic changes
  useEffect(() => {
    if (selectedTopic) {
      getConflictResolutionTips(selectedTopic)
        .then(setTips)
        .catch(error => {
          console.error('Error loading tips:', error);
          setTips([
            'Practice active listening and empathy',
            'Use "I" statements to express feelings',
            'Focus on finding solutions together'
          ]);
        });
    } else {
      setTips([]);
    }
  }, [selectedTopic]);

  if (showTopicSelection) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conflict Resolution Coach
                </CardTitle>
                <CardDescription>
                  Let's work together to resolve this conflict peacefully
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Selection */}
            <div>
              <h3 className="font-medium mb-3">What's the main topic of this conflict?</h3>
              <div className="grid grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={selectedTopic === topic.id ? 'default' : 'outline'}
                    className="justify-start h-auto p-3"
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    <span className="text-lg mr-2">{topic.icon}</span>
                    <span className="text-sm">{topic.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Context Input */}
            <div>
              <h3 className="font-medium mb-3">Briefly describe the situation (optional)</h3>
              <Input
                placeholder="What happened? How are you feeling?"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            {/* Tips */}
            {selectedTopic && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Quick Tips for {getTopicLabel(selectedTopic)}:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    {getTips().slice(0, 3).map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleStartSession}
                disabled={!selectedTopic || isStarting}
                className="flex-1"
              >
                {isStarting ? 'Starting...' : 'Start Coaching Session'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conflict Coach
                {session && (
                  <Badge variant="outline" className="ml-2">
                    {getTopicIcon(session.topic)} {getTopicLabel(session.topic)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                AI-powered conflict resolution guidance
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
            {session?.messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.role === 'assistant' && (
                      <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-background border p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {session?.suggestions && session.suggestions.length > 0 && (
            <div className="flex-shrink-0">
              <Separator />
              <div className="pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Suggestions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {session.suggestions.map((suggestion, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Session Status */}
          {session?.status === 'completed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Session completed!</strong> You now have tools and strategies to resolve this conflict. 
                Remember to approach the conversation with empathy and focus on finding solutions together.
              </AlertDescription>
            </Alert>
          )}

          {/* Input */}
          {session?.status === 'active' && (
            <div className="flex-shrink-0">
              <Separator />
              <div className="pt-4 flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Session Info */}
          <div className="flex-shrink-0">
            <Separator />
            <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {session?.participants.length || 1} participant
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session?.startedAt ? 
                    `${Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)}m` : 
                    '0m'
                  }
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                AI-powered guidance
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 