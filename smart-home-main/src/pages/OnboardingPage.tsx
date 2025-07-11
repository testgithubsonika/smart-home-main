import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatBubble } from "@/components/ChatBubble";
import { Send, ArrowLeft, Users, Home, Clock, Sparkles } from "lucide-react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Ensure your API key is correctly set in your .env file
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

  // Initialize the chat
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

      const seekerQuestions = `**Core Vibe**: Start by asking about their ideal home environment (cleanliness in scale of 1-5, social atmosphere, noise tolerence).
      - **Lifestyle**: Inquire about their daily routine (sleep schedule, work-from-home, cooking habits).
      - **Social Life**: Ask how they approach having guests, parties, and overnight stays.
      - **Deal-Breakers**: End by asking for their absolute 'must-haves' and 'can't-stands' in a living situation.
      - **Budget**: Ask for a rough estimate of their budget for a one-month stay.
      - **Requirements**: Finally, ask for any specific requirements or preferences they have for the space, such as pets, smoking, or specific amenities.`;

      const listerQuestions = `**Core Vibe**: Ask them to describe the *current* vibe of their home (cleanliness, social life, noise).
      - **Ideal Roommate**: Inquire about the kind of person who would fit best into the existing household (sleep schedule, lifestyle).
      - **Household Harmony**: Ask how the current residents handle communication, disagreements, and shared finances.
      - **The Non-Negotiables**: Ask what absolute 'deal-breakers' a potential applicant must meet.
      - **Budget**: Ask for the expected budget range for a one-month stay.`;
      
      const systemPrompt = `
You are Smart Roomie AI, a friendly and insightful AI assistan. Your goal is to onboard a new user by asking exactly 5 questions.

**Your Persona:**
- You are a friendly and insightful AI assistant .
Your goal is to quickly understand the user's 'Roommate DNA' profile to help them find or offer a place.
- Intelligently adapt your questions to the user, who is a '${userType}'. A 'seeker' is looking for a place, while a 'lister' is offering one.
- **Be Honest and Realistic**: Don't make up answers or exaggerate. Be truthful and realistic.


**STRICT RULES - NON-NEGOTIABLE:**
1.  **ONE QUESTION AT A TIME:** Never ask more than one question in a single message.
5.  **THE 6 QUESTION LIMIT:** After you receive the answer to the 5th and final question, your *only* response must be the completion JSON. Do not say anything else.

**Question Script for a '${userType}':**
${userType === 'seeker' ? seekerQuestions : listerQuestions}

**Completion Step:**
After the 5th question is answered, you MUST respond with ONLY the following JSON structure, filling in the user's details. Do not include markdown formatting.
{
  "isComplete": true,
  "userProfile": {
    "userType": "${userType}",
    "cleanliness": <number 1-5>,
    "socialStyle": "<string >",
    "sleepSchedule": "<string>",
    "budget": "<string>",
    "requirements": "<string>"
  }
}

Now, begin! Start with the very first question for the ${userType}.`;

      // The generationConfig object has been removed from this call.
      const chatInstance = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }],
      });

      setChat(chatInstance);
      setIsTyping(true);

      const result = await chatInstance.sendMessage("Let's start!");
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
    
    setProfileProgress(Math.min(((messages.length + 1) / 10) * 100, 99));

    try {
      const result = await chat.sendMessage(currentInput);
      const response = result.response;
      let text = response.text();

      try {
        const jsonString = text.replace(/```json|```/g, '').trim();
        const responseObject = JSON.parse(jsonString);

        if (responseObject.isComplete && responseObject.userProfile) {
          const profile: UserProfile = responseObject.userProfile;
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setProfileProgress(100);

          const finalMessage: ChatMessage = {
            id: Date.now() + 1,
            message: "🎉 Awesome! Your profile is all set. Let's get you to the right place...",
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
        message: "Oops! My circuits got a little tangled. 😅 Could you try sending that again?",
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

  // ... The rest of your JSX remains the same
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
                  <h2 className="text-xl font-semibold">Chat with Smart Roomie</h2>
                  <p className="text-sm opacity-90">
                    Just 5 quick questions to build your profile!
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
                      <span className="text-xs text-muted-foreground ml-2">Smart Roomie is typing...</span>
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
                  placeholder="Type your answer here..."
                  className="flex-1"
                  disabled={isTyping || profileProgress >= 100}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isTyping || profileProgress >= 100}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                💡 Just be yourself! Your answers help us find the perfect match.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;