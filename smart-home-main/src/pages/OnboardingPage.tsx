import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Correctly using the imported Supabase service function
import { createHousehold } from "@/services/harmonyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatBubble } from "@/components/ChatBubble";
import { Send, ArrowLeft, Users, Home, Clock, Sparkles } from "lucide-react";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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

interface CompletionResponse {
  isComplete: boolean;
  userProfile: UserProfile;
}

// Type for the Gemini chat instance
interface GeminiChat {
  sendMessage: (message: string) => Promise<{
    response: {
      text: () => string;
    };
  }>;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'seeker' | 'lister' || 'seeker';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState<GeminiChat | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate progress based on actual questions asked
  const profileProgress = Math.min((questionsAsked / 5) * 100, 100);

  // Validate completion JSON schema
  const validateCompletionResponse = (obj: unknown): obj is CompletionResponse => {
    if (!obj || typeof obj !== 'object') return false;
    
    const typedObj = obj as Record<string, unknown>;
    
    // Check isComplete
    if (typedObj.isComplete !== true) return false;
    
    // Check userProfile exists and has required fields
    if (!typedObj.userProfile || typeof typedObj.userProfile !== 'object') return false;
    
    const profile = typedObj.userProfile as Record<string, unknown>;
    
    // Validate required fields
    if (profile.userType !== 'seeker' && profile.userType !== 'lister') return false;
    if (typeof profile.cleanliness !== 'number' || profile.cleanliness < 1 || profile.cleanliness > 5) return false;
    if (typeof profile.socialStyle !== 'string' || profile.socialStyle.trim() === '') return false;
    if (typeof profile.sleepSchedule !== 'string' || profile.sleepSchedule.trim() === '') return false;
    
    // Optional fields can be undefined or string
    if (profile.budget !== undefined && typeof profile.budget !== 'string') return false;
    if (profile.requirements !== undefined && typeof profile.requirements !== 'string') return false;
    
    return true;
  };

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
        model: "gemini-1.5-flash",
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
      - **Deal-Breakers**: End by asking for their absolute 'must-haves' and 'can't-stands' in a living situation.
      - **Budget**: Ask for a rough estimate of their budget for a one-month stay.
      - **Requirements**: Finally, ask for any specific requirements or preferences they have for the space, such as pets, smoking, or specific amenities.`;

      const listerQuestions = `**Core Vibe**: Ask them to describe the *current* vibe of their home (cleanliness, social life, noise).
      - **Ideal Roomie**: Inquire about the kind of person who would fit best into the existing household (sleep schedule, lifestyle).
      - **Household Harmony**: Ask how the current residents handle communication, disagreements, and shared finances.
      - **The Non-Negotiables**: Ask what absolute 'deal-breakers' a potential applicant must meet.
      - **Budget**: Ask for the expected budget range for a one-month stay.`;
      
      const systemPrompt = `
You are Smart Roomie AI, a friendly and insightful AI assistant. Your goal is to onboard a new user by asking exactly 5 questions.

**Your Persona:**
- You are a friendly and insightful AI assistant.
- Your goal is to quickly understand the user's 'Roommate DNA' profile to help them find or offer a place.
- Intelligently adapt your questions to the user, who is a '${userType}'. A 'seeker' is looking for a place, while a 'lister' is offering one.
- **Be Honest and Realistic**: Don't make up answers or exaggerate. Be truthful and realistic.

**STRICT RULES - NON-NEGOTIABLE:**
1. **EXACTLY 5 QUESTIONS**: You must ask exactly 5 questions, no more, no less.
2. **ONE QUESTION AT A TIME**: Never ask more than one question in a single message.
3. **COUNT YOUR QUESTIONS**: Keep track internally. After the 5th question is answered, you MUST respond with the completion JSON.
4. **NO EXTRA QUESTIONS**: Do not ask follow-up questions or clarification unless absolutely necessary.

**Question Script for a '${userType}':**
${userType === 'seeker' ? seekerQuestions : listerQuestions}

**Completion Step:**
After the 5th question is answered, you MUST respond with ONLY the following JSON structure, filling in the user's details. Do not include markdown formatting or any other text.

{
  "isComplete": true,
  "userProfile": {
    "userType": "${userType}",
    "cleanliness": <number 1-5>,
    "socialStyle": "<string>",
    "sleepSchedule": "<string>",
    "budget": "<string>",
    "requirements": "<string>"
  }
}

**IMPORTANT**: 
- cleanliness must be a number between 1-5
- socialStyle and sleepSchedule are required strings
- budget and requirements are optional strings
- Do not include any text before or after the JSON

Now, begin! Start with the very first question for the ${userType}.`;

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
      setQuestionsAsked(1); // First question asked
      setIsTyping(false);
    };

    initChat();
  }, [userType]);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !chat || isComplete) return;

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
      const text = response.text();

      // Try to parse as completion JSON
      try {
        const jsonString = text.replace(/```json|```/g, '').trim();
        const responseObject = JSON.parse(jsonString);

        if (validateCompletionResponse(responseObject)) {
          // Valid completion JSON
          const profile: UserProfile = responseObject.userProfile;
          
          // FIX: Replaced Firebase setDoc with Supabase createHousehold
          await createHousehold(profile);
          setIsComplete(true);

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
        // Not a valid JSON object, treat as a regular message
      }

      // Regular AI response - increment question count
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        message: text,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Increment questions asked (but don't exceed 5)
      const newQuestionCount = Math.min(questionsAsked + 1, 5);
      setQuestionsAsked(newQuestionCount);
      
      // If we've reached 5 questions but didn't get completion JSON, force completion
      if (newQuestionCount >= 5 && !isComplete) {
        const fallbackMessage: ChatMessage = {
          id: Date.now() + 2,
          message: "I've asked all my questions! Let me create your profile based on your answers...",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, fallbackMessage]);
        
        // Create a fallback profile and complete
        setTimeout(async () => {
          const fallbackProfile: UserProfile = {
            userType,
            cleanliness: 3, // Default middle value
            socialStyle: "Balanced",
            sleepSchedule: "Regular",
            budget: "Flexible",
            requirements: "None specified"
          };
          
          // FIX: Replaced Firebase setDoc with Supabase createHousehold
          await createHousehold(fallbackProfile);
          setIsComplete(true);
          
          const finalMessage: ChatMessage = {
            id: Date.now() + 3,
            message: "🎉 Profile created! Let's get you to the right place...",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, finalMessage]);
          
          setTimeout(() => {
            if (fallbackProfile.userType === 'seeker') {
              navigate('/dashboard');
            } else {
              navigate('/create-listing');
            }
          }, 2000);
        }, 1500);
      }

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
            <span className="text-sm font-medium">
              Question {questionsAsked} of 5 ({Math.round(profileProgress)}%)
            </span>
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
                    {isComplete ? "Profile complete! Redirecting..." : `Question ${questionsAsked} of 5`}
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
                  placeholder={isComplete ? "Profile complete!" : "Type your answer here..."}
                  className="flex-1"
                  disabled={isTyping || isComplete}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isTyping || isComplete}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                {isComplete ? (
                  "🎉 Redirecting you to the next step..."
                ) : (
                  `💡 Just be yourself! Question ${questionsAsked} of 5.`
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;