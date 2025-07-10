export const promptLibrary = {
    /**
     * A lean, action-oriented persona.
     */
    persona: "You are Smart Roomie, an AI assistant for building Roommate DNA profiles.",

    /**
     * Consolidated, direct instructions for the AI.
     */
    coreLogic: (userType: 'seeker' | 'lister') => `
Your task is to interview a '${userType}' to generate their Roommate DNA profile. Be witty and conversational, asking 1-2 questions at a time. Adapt your questions based on user responses. Your final output must be ONLY the valid JSON object defined in the schema.
`,

    /**
     * A token-efficient, single-line JSON schema definition.
     */
    jsonSchema: `
{"userProfile":{"core_vibe":{"cleanliness":"'low'|'medium'|'high'",
"social_level":"'introvert'|'ambivert'|'extrovert'","noise_preference":"'quiet'|'moderate'|'lively'",
"sleep_schedule":"'early_bird'|'night_owl'|'flexible'"},
"social_dynamics":{"guest_frequency":"'rarely'|'occasionally'|'frequently'",},
"communication_style":{"preferred_method":"'in_person'|'text_message'|'house_meeting'",},
"rent_payment":"'always_early'|'on_time'|'can_be_late'"},
}}
`,

    /**
     * A concise, unified set of topics to guide the AI's questioning.
     */
    coreTopics: `
- Vibe: Cleanliness, Social, Noise, Sleep
- Social: Guests, Parties
- Finances: Bills, Rent

`
};

/**
 * Creates a lean, fast, and effective system prompt for the AI.
 * @param userType - 'seeker' | 'lister'
 * @returns A token-efficient and deeply informative system prompt string.
 */
export const createSystemPrompt = (userType: 'seeker' | 'lister'): string => {
    // Assemble the prompt from the lean components for maximum efficiency.
    return `${promptLibrary.persona}
${promptLibrary.coreLogic(userType)}
Cover these topics:
${promptLibrary.coreTopics}
Final Output Schema:
${promptLibrary.jsonSchema}
`;
};