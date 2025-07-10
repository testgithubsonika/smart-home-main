import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/ChatBubble";
import { Send, ArrowLeft } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Import the new prompt creation function
import { createSystemPrompt } from "@/promptLibrary";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface ChatMessage {
    id: number;
    message: string;
    isUser: boolean;
    timestamp: string;
}

// Updated UserProfile to reflect the new detailed structure
interface UserProfile {
    userType: 'seeker' | 'lister';
    core_vibe: {
        cleanliness: string;
        social_level: string;
        noise_preference: string;
        sleep_schedule: string;
    };
    social_dynamics: {
        guest_frequency: string;
        overnight_guests: string;
        party_policy: string;
    };
    communication_style: {
        preferred_method: string;
        urgency_handling: string;
    };
}


const OnboardingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userType = searchParams.get('type') as 'seeker' | 'lister' || 'seeker';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [chat, setChat] = useState<any>(null);
    const [questionCount, setQuestionCount] = useState(0);

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
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Updated model for efficiency

            // Use the dynamic prompt from the library
            const systemPrompt = createSystemPrompt(userType);

            const chatInstance = model.startChat({
                history: [{ role: "user", parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 800,
                    temperature: 0.7,
                },
            });

            setChat(chatInstance);
            setIsTyping(true);

            // Get the initial message from the AI
            const result = await chatInstance.sendMessage(`Let's begin. I see you are a ${userType}. What's on your mind?`);
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
            let promptToSend = currentInput;
            
            // MODIFIED LOGIC: Check if questionCount is 3. 
            // On the 4th user message, the count (0, 1, 2, 3) will be 3, triggering the final summary.
            if (questionCount >= 3) { 
                promptToSend = `This is the final piece of information. Please generate the complete user profile JSON based on our entire conversation. Ensure all fields in the UserProfile are filled.`;
            }

            const result = await chat.sendMessage(promptToSend);
            const response = result.response;
            let text = response.text();

            // Increment the count for the next interaction (if any).
            setQuestionCount(prev => prev + 1);

            try {
                const jsonString = text.replace(/```json|```/g, '').trim();
                const responseObject = JSON.parse(jsonString);

                // Assuming the final response will be a specific JSON structure.
                // You might need to adjust this check based on your prompt instructions.
                if (responseObject.userProfile) { 
                    const profile: UserProfile = { userType, ...responseObject.userProfile };
                    localStorage.setItem('userProfile', JSON.stringify(profile));

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
                    return; // Stop processing since we are done
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
                            <p className="text-sm opacity-90">Building your compatibility DNA... </p>
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