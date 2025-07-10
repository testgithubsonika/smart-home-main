import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/ChatBubble";
import { Send, ArrowLeft } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSystemPrompt } from "@/promptLibrary";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface ChatMessage {
    id: number;
    message: string;
    isUser: boolean;
    timestamp: string;
}

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userType = searchParams.get('type') as 'seeker' | 'lister' || 'seeker';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [chat, setChat] = useState<any>(null);
    const [messageCount, setMessageCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Effect to handle navigation after the final message is shown
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.message.startsWith("Perfect!")) {
            const timer = setTimeout(() => {
                if (userType === 'seeker') {
                    navigate('/dashboard');
                } else {
                    navigate('/create-listing');
                }
            }, 2500);

            return () => clearTimeout(timer); // Cleanup the timer
        }
    }, [messages, navigate, userType]);


    useEffect(() => {
        const initChat = async () => {
            if (!API_KEY) {
                console.error("VITE_GEMINI_API_KEY is not set.");
                const errorMessage = {
                    id: Date.now(),
                    message: "Configuration error: The AI service is currently unavailable.",
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages([errorMessage]);
                return;
            }

            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const systemPrompt = createSystemPrompt(userType);

            const chatInstance = model.startChat({
                history: [{ role: "user", parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 250,
                    temperature: 0.8,
                },
            });

            setChat(chatInstance);
            setIsTyping(true);

            const result = await chatInstance.sendMessage(
                `I see you're a ${userType}. To start, tell me a bit about your ideal living situation.`
            );
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
        const messageInput = currentInput; // Store currentInput before clearing it
        setCurrentInput("");
        setIsTyping(true);


        const nextMessageCount = messageCount + 1;
        setMessageCount(nextMessageCount);

        if (nextMessageCount >= 3) {
            const finalMessage: ChatMessage = {
                id: Date.now() + 1,
                message: "Perfect! Based on your preferences, I'm finding some great options for you now. One moment...",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, finalMessage]);
            setIsTyping(false); // Stop typing indicator for the final message
            return;
        }

        try {
            const result = await chat.sendMessage(messageInput);
            const response = result.response;
            const text = response.text();

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
                message: "I'm having a little trouble connecting right now. Please try again in a moment.",
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
                <div className="max-w-2xl mx-auto">
                    <div className="bg-card/60 backdrop-blur-sm rounded-2xl shadow-soft border border-border overflow-hidden">
                        <div className="bg-gradient-hero px-6 py-4 text-primary-foreground">
                            <h2 className="text-xl font-semibold">AI Roommate Profiling</h2>
                            <p className="text-sm opacity-90">Let's find your perfect match...</p>
                        </div>
                        <div className="h-96 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => (
                                <ChatBubble
                                    key={msg.id}
                                    message={msg.message}
                                    isUser={msg.isUser}
                                    timestamp={msg.timestamp}
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
                        <div className="border-t border-border p-4">
                            <div className="flex gap-3">
                                <Input
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Tell me about your preferences..."
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