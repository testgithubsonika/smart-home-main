import { ChatMessage, ConflictAnalysis, ConflictCoachSession } from '@/types/harmony';
import { createConflictAnalysis, createConflictCoachSession, updateConflictCoachSession } from './harmonyService';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiRequest {
  contents: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

// Gemini API client with improved error handling
class GeminiClient {
  private apiKey: string;
  private isAvailable: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.isAvailable = !!apiKey;
  }

  async generateContent(prompt: string, temperature: number = 0.7): Promise<string> {
    if (!this.isAvailable) {
      console.warn('Gemini API key not configured - using fallback responses');
      throw new Error('Gemini API key not configured');
    }

    const request: GeminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: 1000,
        topK: 40,
        topP: 0.95
      }
    };

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        console.error(`Gemini API error: ${response.status} ${response.statusText}`);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Check if API is available
  isApiAvailable(): boolean {
    return this.isAvailable;
  }
}

// Initialize Gemini client
const geminiClient = new GeminiClient(GEMINI_API_KEY);

// Gemini-powered conflict coach service with improved fallbacks
export class GeminiConflictCoach {
  static async analyzeSentiment(messages: ChatMessage[]): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    severity: 'low' | 'medium' | 'high';
    topics: string[];
    suggestions: string[];
  }> {
    // If Gemini is not available, use fallback
    if (!geminiClient.isApiAvailable()) {
      return {
        sentiment: 'neutral',
        severity: 'low',
        topics: ['general communication'],
        suggestions: [
          'Practice active listening and empathy',
          'Use "I" statements to express feelings',
          'Schedule a house meeting to discuss concerns'
        ]
      };
    }

    const recentMessages = messages.slice(-5); // Last 5 messages
    const conversationText = recentMessages.map(m => m.content).join('\n');
    
    const prompt = `
You are an AI conflict resolution expert analyzing household communication. Analyze the following conversation between roommates and provide insights:

Conversation:
${conversationText}

Please analyze this conversation and respond in the following JSON format:
{
  "sentiment": "positive|neutral|negative",
  "severity": "low|medium|high", 
  "topics": ["topic1", "topic2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Focus on:
- Overall emotional tone and sentiment
- Severity of potential conflict (low/medium/high)
- Main topics being discussed (chores, finances, noise, space, scheduling, communication)
- Specific, actionable suggestions for conflict resolution

Respond only with valid JSON.
`;

    try {
      const response = await geminiClient.generateContent(prompt, 0.3);
      const analysis = JSON.parse(response);
      
      return {
        sentiment: analysis.sentiment || 'neutral',
        severity: analysis.severity || 'low',
        topics: analysis.topics || ['general communication'],
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('Error analyzing sentiment with Gemini:', error);
      // Fallback to basic analysis
      return {
        sentiment: 'neutral',
        severity: 'low',
        topics: ['general communication'],
        suggestions: [
          'Practice active listening and empathy',
          'Use "I" statements to express feelings',
          'Schedule a house meeting to discuss concerns'
        ]
      };
    }
  }

  static async generateConflictResolution(
    topic: string,
    participants: string[],
    context: string
  ): Promise<{
    suggestions: string[];
    nextSteps: string[];
    resources: string[];
  }> {
    // If Gemini is not available, use fallback
    if (!geminiClient.isApiAvailable()) {
      return {
        suggestions: [
          'Schedule a house meeting to discuss the issue openly',
          'Use "I" statements to express your feelings',
          'Focus on finding solutions rather than assigning blame'
        ],
        nextSteps: [
          'Set up a meeting within the next 48 hours',
          'Prepare specific examples of the issues',
          'Come to the meeting with potential solutions'
        ],
        resources: [
          'Communication skills resources',
          'Conflict resolution techniques',
          'Mediation services in your area'
        ]
      };
    }

    const prompt = `
You are an AI conflict resolution coach helping roommates resolve a ${topic} conflict. 

Context: ${context}
Number of participants: ${participants.length}

Please provide guidance in the following JSON format:
{
  "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"],
  "nextSteps": ["immediate action 1", "immediate action 2", "immediate action 3"],
  "resources": ["resource 1", "resource 2", "resource 3"]
}

Focus on:
- Practical, actionable suggestions for ${topic} conflicts
- Immediate next steps they can take
- Helpful resources (apps, articles, techniques)

Make suggestions specific to ${topic} conflicts between roommates.
Respond only with valid JSON.
`;

    try {
      const response = await geminiClient.generateContent(prompt, 0.4);
      const resolution = JSON.parse(response);
      
      return {
        suggestions: resolution.suggestions || [],
        nextSteps: resolution.nextSteps || [],
        resources: resolution.resources || []
      };
    } catch (error) {
      console.error('Error generating conflict resolution with Gemini:', error);
      // Fallback suggestions
      return {
        suggestions: [
          'Schedule a house meeting to discuss the issue openly',
          'Use "I" statements to express your feelings',
          'Focus on finding solutions rather than assigning blame'
        ],
        nextSteps: [
          'Set up a meeting within the next 48 hours',
          'Prepare specific examples of the issues',
          'Come to the meeting with potential solutions'
        ],
        resources: [
          'Communication skills resources',
          'Conflict resolution techniques',
          'Mediation services in your area'
        ]
      };
    }
  }

  static async continueSession(
    sessionId: string,
    userMessage: string,
    sessionHistory: ConflictCoachSession
  ): Promise<{
    response: string;
    suggestions: string[];
    shouldEndSession: boolean;
  }> {
    // If Gemini is not available, use fallback
    if (!geminiClient.isApiAvailable()) {
      return {
        response: "I understand this is a challenging situation. Let's focus on finding a solution that works for everyone. What specific outcome would you like to see from this conflict resolution?",
        suggestions: [
          'Try to express your feelings using "I" statements',
          'Ask open-ended questions to understand the other person\'s perspective',
          'Focus on the specific behavior rather than the person'
        ],
        shouldEndSession: false
      };
    }

    const conversationHistory = sessionHistory.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `
You are an AI conflict resolution coach having a conversation with someone about resolving a ${sessionHistory.topic} conflict with their roommates.

Previous conversation:
${conversationHistory}

User's latest message: ${userMessage}

Please respond as a supportive, empathetic conflict resolution coach. Your response should:
1. Acknowledge their feelings
2. Provide helpful guidance
3. Ask clarifying questions if needed
4. Suggest next steps

Also, determine if the session should end (they seem ready to take action, are saying goodbye, or have a clear plan).

Respond in this JSON format:
{
  "response": "your empathetic response here",
  "suggestions": ["suggestion1", "suggestion2"],
  "shouldEndSession": true/false
}

Keep your response conversational and supportive. Respond only with valid JSON.
`;

    try {
      const response = await geminiClient.generateContent(prompt, 0.6);
      const result = JSON.parse(response);
      
      return {
        response: result.response || "I understand this is challenging. Let's work together to find a solution.",
        suggestions: result.suggestions || [],
        shouldEndSession: result.shouldEndSession || false
      };
    } catch (error) {
      console.error('Error continuing session with Gemini:', error);
      // Fallback response
      return {
        response: "I understand this is a challenging situation. Let's focus on finding a solution that works for everyone. What specific outcome would you like to see from this conflict resolution?",
        suggestions: [
          'Try to express your feelings using "I" statements',
          'Ask open-ended questions to understand the other person\'s perspective',
          'Focus on the specific behavior rather than the person'
        ],
        shouldEndSession: false
      };
    }
  }

  static async generateTopicSpecificSuggestions(topic: string): Promise<string[]> {
    // If Gemini is not available, use fallback
    if (!geminiClient.isApiAvailable()) {
      const fallbackSuggestions: Record<string, string[]> = {
        'chores': [
          'Create a chore rotation schedule',
          'Use a shared task management app',
          'Set clear expectations for each chore',
          'Have regular check-ins about household cleanliness',
          'Consider hiring a cleaning service for deep cleans'
        ],
        'finances': [
          'Set up a shared expense tracking system',
          'Create a monthly budget meeting',
          'Use apps like Splitwise for bill splitting',
          'Set up automatic payments for recurring bills',
          'Keep receipts and document all shared expenses'
        ],
        'noise': [
          'Establish quiet hours for the household',
          'Use noise-canceling headphones or earplugs',
          'Create designated quiet spaces',
          'Communicate about work schedules and sleep patterns',
          'Use a shared calendar for events that might be noisy'
        ],
        'space': [
          'Define personal and shared spaces clearly',
          'Create storage solutions for shared items',
          'Respect each other\'s personal boundaries',
          'Have regular discussions about space usage',
          'Consider rearranging furniture for better flow'
        ],
        'scheduling': [
          'Use a shared calendar for important events',
          'Give advance notice for guests or events',
          'Be flexible with each other\'s schedules',
          'Communicate about work schedules and sleep patterns',
          'Plan shared activities in advance'
        ],
        'communication': [
          'Practice active listening and empathy',
          'Use "I" statements to express feelings',
          'Take breaks when emotions run high',
          'Focus on finding solutions rather than assigning blame',
          'Consider seeking mediation if conflicts persist'
        ]
      };
      
      return fallbackSuggestions[topic] || fallbackSuggestions['communication'];
    }

    const prompt = `
You are an AI conflict resolution expert. Provide 5 specific, actionable suggestions for resolving ${topic} conflicts between roommates.

Respond with a JSON array of strings:
["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]

Make suggestions practical and specific to ${topic} conflicts.
Respond only with valid JSON.
`;

    try {
      const response = await geminiClient.generateContent(prompt, 0.4);
      const suggestions = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Error generating topic suggestions with Gemini:', error);
      // Fallback suggestions
      const fallbackSuggestions: Record<string, string[]> = {
        'chores': [
          'Create a chore rotation schedule',
          'Use a shared task management app',
          'Set clear expectations for each chore',
          'Have regular check-ins about household cleanliness',
          'Consider hiring a cleaning service for deep cleans'
        ],
        'finances': [
          'Set up a shared expense tracking system',
          'Create a monthly budget meeting',
          'Use apps like Splitwise for bill splitting',
          'Set up automatic payments for recurring bills',
          'Keep receipts and document all shared expenses'
        ],
        'noise': [
          'Establish quiet hours for the household',
          'Use noise-canceling headphones or earplugs',
          'Create designated quiet spaces',
          'Communicate about work schedules and sleep patterns',
          'Use a shared calendar for events that might be noisy'
        ],
        'space': [
          'Define personal and shared spaces clearly',
          'Create storage solutions for shared items',
          'Respect each other\'s personal boundaries',
          'Have regular discussions about space usage',
          'Consider rearranging furniture for better flow'
        ],
        'scheduling': [
          'Use a shared calendar for important events',
          'Give advance notice for guests or events',
          'Be flexible with each other\'s schedules',
          'Communicate about work schedules and sleep patterns',
          'Plan shared activities in advance'
        ],
        'communication': [
          'Practice active listening and empathy',
          'Use "I" statements to express feelings',
          'Take breaks when emotions run high',
          'Focus on finding solutions rather than assigning blame',
          'Consider seeking mediation if conflicts persist'
        ]
      };
      
      return fallbackSuggestions[topic] || fallbackSuggestions['communication'];
    }
  }
}

// Main service functions using Gemini
export const analyzeChatSentiment = async (
  householdId: string,
  triggerMessageId: string,
  messages: ChatMessage[]
): Promise<ConflictAnalysis> => {
  const analysis = await GeminiConflictCoach.analyzeSentiment(messages);
  
  const conflictAnalysis: Omit<ConflictAnalysis, 'id' | 'createdAt'> = {
    householdId,
    triggerMessageId,
    analysis,
    isResolved: false,
  };
  
  const analysisId = await createConflictAnalysis(conflictAnalysis);
  
  return {
    id: analysisId,
    ...conflictAnalysis,
    createdAt: new Date(),
  };
};

export const startConflictCoachSession = async (
  householdId: string,
  participants: string[],
  topic: string,
  context: string
): Promise<ConflictCoachSession> => {
  try {
    const resolution = await GeminiConflictCoach.generateConflictResolution(topic, participants, context);
    
    const session: Omit<ConflictCoachSession, 'id' | 'startedAt'> = {
      householdId,
      participants,
      topic,
      status: 'active',
      messages: [
        {
          role: 'assistant',
          content: `I'm here to help you resolve this conflict about ${topic}. Let's work together to find a solution that works for everyone. What would you like to start with?`,
          timestamp: new Date(),
        },
      ],
      suggestions: resolution.suggestions,
    };
    
    const sessionId = await createConflictCoachSession(session);
    
    return {
      id: sessionId,
      ...session,
      startedAt: new Date(),
    };
  } catch (error) {
    console.error('Error starting conflict coach session:', error);
    // Create a basic session even if Gemini fails
    const session: Omit<ConflictCoachSession, 'id' | 'startedAt'> = {
      householdId,
      participants,
      topic,
      status: 'active',
      messages: [
        {
          role: 'assistant',
          content: `I'm here to help you resolve this conflict about ${topic}. Let's work together to find a solution that works for everyone. What would you like to start with?`,
          timestamp: new Date(),
        },
      ],
      suggestions: [
        'Schedule a house meeting to discuss the issue openly',
        'Use "I" statements to express your feelings',
        'Focus on finding solutions rather than assigning blame'
      ],
    };
    
    const sessionId = await createConflictCoachSession(session);
    
    return {
      id: sessionId,
      ...session,
      startedAt: new Date(),
    };
  }
};

export const continueConflictCoachSession = async (
  sessionId: string,
  sessionHistory: ConflictCoachSession,
  userMessage: string
): Promise<{
  response: string;
  suggestions: string[];
  shouldEndSession: boolean;
}> => {
  try {
    const result = await GeminiConflictCoach.continueSession(sessionId, userMessage, sessionHistory);
    
    // Update session in database
    await updateConflictCoachSession(sessionId, {
      messages: [
        ...sessionHistory.messages,
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: result.response, timestamp: new Date() },
      ],
      suggestions: result.suggestions,
      status: result.shouldEndSession ? 'completed' : 'active',
      endedAt: result.shouldEndSession ? new Date() : undefined,
    });
    
    return result;
  } catch (error) {
    console.error('Error continuing conflict coach session:', error);
    // Fallback response
    return {
      response: "I understand this is a challenging situation. Let's focus on finding a solution that works for everyone. What specific outcome would you like to see from this conflict resolution?",
      suggestions: [
        'Try to express your feelings using "I" statements',
        'Ask open-ended questions to understand the other person\'s perspective',
        'Focus on the specific behavior rather than the person'
      ],
      shouldEndSession: false
    };
  }
};

export const getConflictResolutionTips = async (topic: string): Promise<string[]> => {
  return await GeminiConflictCoach.generateTopicSpecificSuggestions(topic);
};

export const shouldTriggerConflictAnalysis = (messages: ChatMessage[]): boolean => {
  // Simple heuristic: trigger if recent messages contain negative keywords
  const negativeKeywords = ['angry', 'frustrated', 'upset', 'annoyed', 'hate', 'terrible', 'awful'];
  const recentMessages = messages.slice(-3);
  
  return recentMessages.some(message => 
    negativeKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    )
  );
};

// Export Gemini client for testing
export { geminiClient }; 