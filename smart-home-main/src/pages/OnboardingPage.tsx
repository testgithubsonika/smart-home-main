import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatBubble } from "@/components/ChatBubble";
import { Send, ArrowLeft } from "lucide-react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface ChatMessage {
  id: number;
  message: string;
  isUser: boolean;
  timestamp: string;
}

interface UserProfile {
  userType: 'seeker' | 'lister';
  cleanliness: number;
  socialStyle: string;
  sleepSchedule: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'seeker' | 'lister' || 'seeker';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize the chat
  useEffect(() => {
    const initChat = async () => {
      if (!API_KEY) {
        console.error("VITE_GEMINI_API_KEY is not set.");
        // Optionally, display an error message to the user
        const errorMessage = {
          id: Date.now(),
          message: "Configuration error: The AI service is currently unavailable. Please contact support.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([errorMessage]);
        return;
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const seekerQuestions = `
- For cleanliness, ask them to rate their ideal level of cleanliness in a shared space on a scale of 1-5.
- For social style, ask if they are looking for a quiet sanctuary or a lively social hub.
- For sleep schedule, ask if they are more of an 'early bird' or a 'night owl'.`;

      const listerQuestions = `
- For cleanliness, ask what level of cleanliness (on a scale of 1-5) they expect from a potential roommate.
- For social style, ask them to describe the social vibe of their home (e.g., is it a peaceful retreat or a place for frequent get-togethers?).
- For sleep schedule, ask what kind of sleep schedule in a roommate would be most compatible with the household.`;

      const systemPrompt = `You are 'Smart Roomie,' a friendly and witty AI assistant. Your goal is to build a 'Roommate DNA' profile for a user who is a '${userType}'.
      1. Ask questions one at a time to discover their preferences. Keep your tone conversational and engaging.
      ${userType === 'seeker' ? seekerQuestions : listerQuestions}
      2. Once you have gathered answers for all preferences, your FINAL response MUST be ONLY a valid JSON object. Do not include any other text or markdown formatting.
      3. The JSON object must have this exact structure, summarizing the user's preferences in the string values:
      {
        "isComplete": true,
        "userProfile": {
          "userType": "${userType}",
          "cleanliness": <number from 1-5>,
          "socialStyle": "<string>",
          "sleepSchedule": "<string>"
        }
      }`;

      const chatInstance = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 250,
        },
      });

      setChat(chatInstance);
      setIsTyping(true);

      // Get the initial message from the AI
      const result = await chatInstance.sendMessage(`Let's begin. I see you are a ${userType}.`);
      const response = result.response;
      const text = response.text();

      const initialMessage: ChatMessage = {
        id: Date.now(),
        message: text,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialMessage]);
      setIsTyping(false);
    };

    initChat();
  }, []);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !chat) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      message: currentInput,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput("");
    setIsTyping(true);

    try {
      const result = await chat.sendMessage(currentInput);
      const response = result.response;
      let text = response.text();

      // Check if the response is a JSON object indicating completion
      try {
        // Clean the text to ensure it's a valid JSON string
        const jsonString = text.replace(/```json|```/g, '').trim();
        const responseObject = JSON.parse(jsonString);

        if (responseObject.isComplete && responseObject.userProfile) {
          const profile: UserProfile = responseObject.userProfile;
          localStorage.setItem('userProfile', JSON.stringify(profile));

          // Add a final confirmation message before navigating
          const finalMessage: ChatMessage = {
            id: Date.now() + 1,
            message: "Great, your Roommate DNA profile is complete! Taking you to the next step...",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, finalMessage]);

          setTimeout(() => {
            if (profile.userType === 'seeker') {
              navigate('/dashboard');
            } else {
              navigate('/create-listing');
            }
          }, 2000);

          setIsTyping(false);
          return; // Stop further processing
        }
      } catch (e) {
        // Not a JSON object, treat as a regular message
      }

      const aiMessage: ChatMessage = {
        id: Date.now() + 1, // Ensure unique ID
        message: text,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: "Sorry, I'm having a little trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Chat Container */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl shadow-soft border border-border overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-hero px-6 py-4 text-primary-foreground">
              <h2 className="text-xl font-semibold">AI Roommate Profiling</h2>
              <p className="text-sm opacity-90">Building your compatibility DNA...</p>
            </div>

            {/* Messages Area */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.message}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-card">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-3">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isTyping}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;