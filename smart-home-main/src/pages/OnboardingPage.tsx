import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatBubble } from "@/components/ChatBubble";
import { Send, ArrowLeft, Users, Home, Clock, Sparkles } from "lucide-react";
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
  budget?: string;
  requirements?: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'seeker' | 'lister' || 'seeker';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [profileProgress, setProfileProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize the chat with enhanced configuration
  useEffect(() => {
    const initChat = async () => {
      if (!API_KEY) {
        console.error("VITE_GEMINI_API_KEY is not set.");
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
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const seekerQuestions = `
Ask these 5 questions ONE AT A TIME:
1. "Rate cleanliness 1-5?"
2. "Quiet space or social hub?"
3. "Early bird or night owl?"
4. "Monthly budget?"
5. "Any deal breakers?"

Keep it SHORT - max 5 words per question.`;

      const listerQuestions = `
Ask these 5 questions ONE AT A TIME:
1. "Cleanliness level 1-5?"
2. "Peaceful or social home?"
3. "Early or late sleeper?"
4. "Monthly rent amount?"
5. "Key requirements?"

Keep it SHORT - max 5 words per question.`;

      const systemPrompt = `You are Smart Roomie AI. Ask ONLY 5 quick questions for ${userType}.

STRICT RULES:
- Ask ONE question at a time
- Keep responses under 10 words
- Be direct and casual
- NO explanations
- Use simple language

QUESTIONS:
${userType === 'seeker' ? seekerQuestions : listerQuestions}

RESPONSE STYLE:
- Question only (no "Hi!" or introductions)
- Acknowledge with "Got it!" then ask next
- NO long sentences
- NO paragraphs

COMPLETION:
After 5 answers, respond with this JSON only:
{
  "isComplete": true,
  "userProfile": {
    "userType": "${userType}",
    "cleanliness": <number 1-5>,
    "socialStyle": "<brief string>",
    "sleepSchedule": "<brief string>",
    "budget": "<string or null>",
    "requirements": "<string>"
  }
}

Start with question 1 now.`;

      const chatInstance = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 80,  // Increased slightly for emojis and friendly tone
          temperature: 0.4,     // Slightly more creative for engaging responses
          topP: 0.6,           // More variety in word choices
          topK: 15,            // More options for engaging language
        },
      });

      setChat(chatInstance);
      setIsTyping(true);

      // Get the initial message from the AI
      const result = await chatInstance.sendMessage(`Hi! Let's make this fun! 😊 Start with question 1 for ${userType}.`);
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
  }, [userType]);

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
      const result = await chat.sendMessage(currentInput + " (Keep it fun and under 12 words! 😊)");
      const response = result.response;
      let text = response.text();

      // Update progress based on message count (5 questions max)
      setProfileProgress(Math.min((messages.length / 10) * 100, 90));

      // Check if the response is a JSON object indicating completion
      try {
        const jsonString = text.replace(/```json|```/g, '').trim();
        const responseObject = JSON.parse(jsonString);

        if (responseObject.isComplete && responseObject.userProfile) {
          const profile: UserProfile = responseObject.userProfile;
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setProfileProgress(100);

          // Add a final confirmation message before navigating
          const finalMessage: ChatMessage = {
            id: Date.now() + 1,
            message: "🎉 Perfect! Your profile is ready! Taking you there now...",
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
          }, 1500);

          setIsTyping(false);
          return;
        }
      } catch (e) {
        // Not a JSON object, treat as a regular message
      }

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        message: text,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: "Oops! Connection hiccup 🔄 Try again?",
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
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Profile: {Math.round(profileProgress)}%</span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl shadow-soft border border-border overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-hero px-6 py-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {userType === 'seeker' ? <Users className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Smart Roomie AI</h2>
                  <p className="text-sm opacity-90">
                    Quick 5 questions to build your profile
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${profileProgress}%` }}
                />
              </div>
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
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">Smart Roomie is thinking... 🤔</span>
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
                  placeholder="Your answer..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isTyping}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Quick Tips */}
              <div className="mt-2 text-xs text-muted-foreground">
                💡 Just 5 fun questions - be yourself! ✨
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;