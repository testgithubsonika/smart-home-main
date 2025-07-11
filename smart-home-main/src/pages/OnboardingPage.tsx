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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        const messageInput = currentInput;
        setCurrentInput("");
        setIsTyping(true);

        try {
            const result = await chat.sendMessage(messageInput);
            const response = result.response;
            const text = response.text().trim();

            if (text === "NAVIGATE_TO_DASHBOARD") {
                const finalMessage: ChatMessage = {
                    id: Date.now() + 1,
                    message: "Perfect! Based on your preferences, I'm finding some great options for you now. One moment...",
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, finalMessage]);

                setTimeout(() => {
                    if (userType === 'seeker') {
                        navigate('/dashboard');
                    } else {
                        navigate('/create-listing');
                    }
                }, 2500);

            } else {
                const aiMessage: ChatMessage = {
                    id: Date.now() + 1,
                    message: text,
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, aiMessage]);
            }
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

    // ... (Your JSX remains the same)
    return (
        <div className="min-h-screen bg-gradient-subtle">
            <div className="container mx-auto px-6 py-8">
                {/* ... rest of your JSX */}
            </div>
        </div>
    );
};

export default OnboardingPage;