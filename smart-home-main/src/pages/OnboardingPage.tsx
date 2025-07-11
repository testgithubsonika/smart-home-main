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

// Ensure this matches the EXACT structure Gemini is expected to return
interface UserProfile {
  userType: 'seeker' | 'lister';
  cleanliness: number; // Expecting number 1-5
  socialStyle: string;
  sleepSchedule: string;
  budget: string | null; // Allow null or string for budget
  requirements: string; // Used for "deal breakers" or "key requirements"
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'seeker' | 'lister' || 'seeker';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState(0); // Track AI questions asked
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
      // Sticking to gemini-1.5-flash for potentially better adherence to strict constraints
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const seekerQuestions = `
1. "Cleanliness (1-5)?"
2. "Quiet or social?"
3. "Early bird or night owl?"
4. "Monthly budget?"
5. "Deal breakers?"`;

      const listerQuestions = `
1. "Cleanliness (1-5)?"
2. "Peaceful or social home?"
3. "Early or late sleeper?"
4. "Monthly rent?"
5. "Key requirements?"`;

      // Enhanced System Prompt for strict control
      const systemPrompt = `You are "Smart Roomie," an AI assistant.
Your sole purpose is to ask 5 specific questions, ONE AT A TIME, to build a Roommate DNA profile for a user who is a '${userType}'.

---
**RULES:**
1.  **Ask exactly ONE question.**
2.  **Keep questions very short (max 5 words).**
3.  **Do NOT provide explanations or introductions.**
4.  **Do NOT acknowledge user responses with phrases like "Got it!" or "Okay."** Just ask the next question.
5.  **After the user answers the 5th question, your next and FINAL response MUST be ONLY a JSON object.** Do not include any other text, greetings, or markdown formatting (like \`\`\`json).

---
**QUESTIONS (${userType === 'seeker' ? 'Seeker' : 'Lister'}):**
${userType === 'seeker' ? seekerQuestions : listerQuestions}

---
**FINAL JSON FORMAT:**
{
  "isComplete": true,
  "userProfile": {
    "userType": "${userType}",
    "cleanliness": <number 1-5>, // Example: 3
    "socialStyle": "<brief string>", // Example: "Social" or "Quiet"
    "sleepSchedule": "<brief string>", // Example: "Night owl" or "Early bird"
    "budget": "<string or null>", // Example: "$800-1000" or null if not provided
    "requirements": "<string>" // Example: "No pets" or "Must be neat"
  }
}

---
**Start by asking Question 1 now.**`;

      const chatInstance = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 25, // Very strict token limit for AI's response length
          temperature: 0.05,  // Even lower for highly deterministic responses
          topP: 0.1,          // More focused on highest probability tokens
          topK: 1,            // Forces the model to pick only the single most probable token
        },
        safetySettings: [ // Safety settings are correctly placed here
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      });

      setChat(chatInstance);
      setIsTyping(true);

      // Get the initial message from the AI (should be Question 1)
      const result = await chatInstance.sendMessage("User is ready."); // A simple trigger for the AI to start
      const response = result.response;
      const text = response.text();

      const initialMessage: ChatMessage = {
        id: Date.now(),
        message: text,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialMessage]);
      setQuestionCount(1); // AI has asked the first question
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
      // Send user's response to Gemini
      const result = await chat.sendMessage(currentInput);
      const response = result.response;
      let text = response.text();

      // Robust JSON parsing (tries to find JSON within the text)
      let responseObject = null;
      const jsonMatch = text.match(/\{[\s\S]*\}/); // Regex to find content between { }
      if (jsonMatch) {
        try {
          responseObject = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Parsing failed, it's not a valid JSON
          responseObject = null;
        }
      }

      // Check if the response is the final JSON object
      if (responseObject && responseObject.isComplete && responseObject.userProfile) {
        const profile: UserProfile = responseObject.userProfile;

        // Validate cleanliness to be a number 1-5 (optional but good practice)
        if (typeof profile.cleanliness !== 'number' || profile.cleanliness < 1 || profile.cleanliness > 5) {
            console.warn("Cleanliness score received is not valid (1-5). Defaulting to 3.");
            profile.cleanliness = 3; // Default or handle error appropriately
        }

        localStorage.setItem('userProfile', JSON.stringify(profile));
        setProfileProgress(100); // Set progress to 100% on completion

        const finalMessage: ChatMessage = {
          id: Date.now() + 1,
          message: "✅ Profile complete! Redirecting you now...",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, finalMessage]);

        setTimeout(() => {
          if (profile.userType === 'seeker') {
            navigate('/dashboard'); // Or '/find-rooms' if you have a specific route
          } else {
            navigate('/create-listing');
          }
        }, 1500); // Give user a moment to read final message

        setIsTyping(false);
        return; // Stop further processing
      } else {
        // If not the final JSON, it's another question from AI
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          message: text,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);

        // Increment question count only if it's a new AI question and not the final JSON
        // Max 5 questions from AI, so total 10 messages (5 user + 5 AI questions) before JSON.
        if (questionCount < 5) {
            setQuestionCount(prev => prev + 1);
            setProfileProgress((prev) => Math.min(prev + 20, 100)); // 20% per question (5 questions)
        }
      }

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: "Connection issue. Try again? 🔄",
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
                      <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
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
                💡 Keep answers short - just 5 quick questions!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;