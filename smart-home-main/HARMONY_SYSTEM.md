# Post-Move-In Harmony System

A comprehensive smart home management system designed to foster harmony in shared living spaces through intelligent chore management, bill tracking, rent management, sensor-based nudges, and AI-powered conflict resolution.

## 🌟 Overview

The Harmony System transforms shared living into a seamless, cooperative experience by providing:

- **Shared Dashboard**: Centralized management of rent, bills, and chores
- **Smart Nudges**: Sensor-based reminders and encouragement
- **Conflict Coach**: AI-powered conflict resolution guidance
- **Real-time Insights**: Activity patterns and efficiency tracking
- **Gamification**: Points system for chore completion

## 🏗️ Architecture

### Core Components

```
src/
├── types/
│   └── harmony.ts              # TypeScript interfaces and types
├── services/
│   ├── harmonyService.ts       # Firestore data layer
│   ├── conflictCoachService.ts # LLM conflict resolution
│   └── sensorNudgeService.ts   # Sensor-based nudges
├── components/
│   ├── HarmonyDashboard.tsx    # Main dashboard
│   ├── ConflictCoach.tsx       # AI conflict resolution
│   ├── ChoreManager.tsx        # Chore management
│   ├── BillManager.tsx         # Bill tracking
│   ├── RentManager.tsx         # Rent management
│   └── SensorInsights.tsx      # Sensor analytics
└── pages/
    └── HarmonyHubPage.tsx      # Main harmony page
```

## 📊 Data Models

### Household Management
- **Household**: Core household information and member management
- **User**: Individual user profiles with preferences and settings

### Financial Management
- **RentPayment**: Monthly rent tracking with payment history
- **RentSchedule**: Automated rent scheduling and splitting
- **Bill**: Utility and service bill management
- **Payment**: Payment tracking and receipt storage

### Task Management
- **Chore**: Household task definition and assignment
- **ChoreCompletion**: Task completion tracking with points
- **ChoreSchedule**: Recurring chore automation

### Smart Home Integration
- **Sensor**: IoT device configuration and status
- **SensorEvent**: Real-time sensor data and events
- **Nudge**: Intelligent reminders and suggestions

### Communication & Conflict Resolution
- **ChatMessage**: Household communication history
- **ConflictAnalysis**: AI-powered sentiment analysis
- **ConflictCoachSession**: Guided conflict resolution sessions

## 🎯 Key Features

### 1. Shared Dashboard

The central hub provides real-time insights into household status:

- **Financial Overview**: Rent and bill payment status
- **Chore Leaderboard**: Gamified task completion tracking
- **Communication Health**: Sentiment analysis and conflict detection
- **Smart Notifications**: Contextual alerts and reminders

### 2. Intelligent Chore Management

Comprehensive task management with gamification:

- **Task Assignment**: Flexible assignment to household members
- **Recurring Chores**: Automated task scheduling
- **Points System**: Reward-based completion tracking
- **Progress Tracking**: Visual completion status and history
- **Smart Suggestions**: AI-powered task optimization

### 3. Financial Harmony

Streamlined financial management for shared expenses:

- **Rent Tracking**: Monthly payment monitoring and splitting
- **Bill Management**: Utility and service bill organization
- **Payment History**: Complete financial transaction records
- **Split Calculations**: Automated expense distribution
- **Due Date Reminders**: Proactive payment notifications

### 4. Sensor-Based Smart Nudges

Intelligent reminders triggered by household activity:

#### Sensor Types
- **Motion Sensors**: Activity detection in different rooms
- **Door Sensors**: Entry/exit monitoring
- **Appliance Sensors**: Dishwasher, washer, dryer status
- **Environmental Sensors**: Temperature, humidity monitoring
- **Smart Trash Bins**: Waste management tracking

#### Nudge Triggers
- **Time-based**: Morning/evening routine reminders
- **Activity-based**: Motion-triggered chore suggestions
- **Completion-based**: Appliance cycle completion alerts
- **Environmental**: Temperature/humidity optimization tips
- **Maintenance**: Trash bin fullness and appliance maintenance

### 5. AI Conflict Coach

LLM-powered conflict resolution and communication improvement:

#### Features
- **Sentiment Analysis**: Real-time chat sentiment monitoring
- **Conflict Detection**: Automatic identification of potential conflicts
- **Guided Resolution**: Step-by-step conflict resolution sessions
- **Topic-specific Advice**: Tailored suggestions for common issues
- **Communication Tips**: Active listening and expression guidance

#### Conflict Topics
- **Chores & Cleaning**: Task distribution and completion
- **Finances**: Bill splitting and payment responsibilities
- **Noise & Quiet**: Sound management and quiet hours
- **Personal Space**: Privacy and shared area boundaries
- **Scheduling**: Time management and coordination
- **Communication**: General communication improvement

## 🔧 Technical Implementation

### Firestore Collections

```typescript
// Core collections
households/
householdSettings/
users/

// Financial management
rentPayments/
rentSchedules/
bills/

// Task management
chores/
choreCompletions/

// Smart home
sensors/
sensorEvents/
nudges/

// Communication
chatMessages/
conflictAnalyses/
conflictCoachSessions/

// Notifications
notifications/
```

### Real-time Features

- **Live Updates**: Real-time dashboard updates using Firestore listeners
- **Instant Notifications**: Push notifications for important events
- **Live Chat**: Real-time household communication
- **Sensor Monitoring**: Continuous sensor data streaming

### AI Integration

#### Conflict Coach with Google Gemini
- **Sentiment Analysis**: AI-powered conversation analysis
- **Topic Classification**: Automatic issue categorization
- **Response Generation**: Contextual conflict resolution advice
- **Session Management**: Guided conversation flow
- **JSON Response Parsing**: Structured AI responses for consistent data

#### Smart Nudges
- **Pattern Recognition**: Activity pattern analysis
- **Predictive Reminders**: Proactive task suggestions
- **Contextual Awareness**: Situation-appropriate notifications
- **Behavioral Insights**: Long-term habit analysis

## 🚀 Getting Started

### 0. Configure Gemini API

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Set Environment Variable**:
   Create a `.env` file in your project root:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### 1. Setup Household

```typescript
// Create a new household
const householdId = await createHousehold({
  name: "Sarah & Leo's Home",
  address: "123 Harmony Street",
  members: ["user1", "user2"]
});
```

### 2. Configure Sensors

```typescript
// Add motion sensor
await createSensor({
  householdId,
  name: "Kitchen Motion",
  type: "motion",
  location: "kitchen",
  isActive: true
});
```

### 3. Set Up Chores

```typescript
// Create recurring chore
await createChore({
  householdId,
  title: "Take out trash",
  category: "cleaning",
  priority: "medium",
  points: 10,
  recurring: {
    frequency: "weekly",
    interval: 1
  }
});
```

### 4. Initialize Services

```typescript
// Start sensor monitoring
await sensorNudgeService.initializeSensors(householdId);

// Set up conflict monitoring
// (Automatic with chat integration)
```

## 📱 User Experience

### Dashboard Navigation

1. **Overview Tab**: Quick stats and recent activity
2. **Chores Tab**: Task management and leaderboard
3. **Bills Tab**: Financial tracking and payments
4. **Rent Tab**: Rent management and history
5. **Sensors Tab**: Smart home insights and patterns

### Smart Notifications

- **Contextual Timing**: Delivered at optimal moments
- **Progressive Escalation**: Gentle reminders to stronger alerts
- **Personalization**: Tailored to individual preferences
- **Action Integration**: Direct links to relevant tasks

### Conflict Resolution Flow

1. **Detection**: Automatic conflict identification
2. **Analysis**: Sentiment and topic analysis
3. **Coaching**: Guided resolution session
4. **Follow-up**: Progress tracking and additional support

## 🔒 Security & Privacy

### Data Protection
- **User Authentication**: Clerk-based secure authentication
- **Household Isolation**: Data separation between households
- **Permission Controls**: Role-based access management
- **Data Encryption**: End-to-end encryption for sensitive data

### Privacy Features
- **Local Processing**: Sensor data processed locally when possible
- **Consent Management**: User control over data collection
- **Anonymization**: Aggregated insights without personal identification
- **Data Retention**: Configurable data retention policies

## 🎨 UI/UX Design

### Design Principles
- **Harmony**: Peaceful, cooperative visual language
- **Clarity**: Clear information hierarchy and navigation
- **Encouragement**: Positive reinforcement and celebration
- **Accessibility**: Inclusive design for all users

### Visual Elements
- **Color Palette**: Calming blues and greens with warm accents
- **Icons**: Friendly, approachable iconography
- **Animations**: Subtle, encouraging micro-interactions
- **Typography**: Clear, readable font hierarchy

## 🔮 Future Enhancements

### Planned Features
- **Voice Integration**: Voice-activated commands and responses
- **Advanced Analytics**: Machine learning-powered insights
- **Integration APIs**: Third-party service connections
- **Mobile App**: Native mobile application
- **Smart Home Hub**: Centralized IoT device management

### AI Improvements
- **Natural Language Processing**: Advanced conversation understanding
- **Predictive Analytics**: Anticipatory suggestions and alerts
- **Personalization**: Individual behavior pattern learning
- **Multi-language Support**: International household support

## 📚 API Reference

### Core Services

#### HarmonyService
```typescript
// Household management
createHousehold(household: Household): Promise<string>
getHousehold(householdId: string): Promise<Household | null>

// Financial management
createRentPayment(payment: RentPayment): Promise<string>
getBills(householdId: string): Promise<Bill[]>

// Task management
createChore(chore: Chore): Promise<string>
completeChore(choreId: string, completion: ChoreCompletion): Promise<string>

// Smart home
createSensor(sensor: Sensor): Promise<string>
recordSensorEvent(event: SensorEvent): Promise<string>
```

#### ConflictCoachService (Gemini-powered)
```typescript
// Conflict analysis
analyzeChatSentiment(messages: ChatMessage[]): Promise<ConflictAnalysis>
shouldTriggerConflictAnalysis(messages: ChatMessage[]): boolean

// Coaching sessions
startConflictCoachSession(householdId: string, participants: string[], topic: string): Promise<ConflictCoachSession>
continueConflictCoachSession(sessionId: string, message: string): Promise<CoachResponse>

// Gemini client (for testing)
geminiClient.generateContent(prompt: string, temperature?: number): Promise<string>
```

#### SensorNudgeService
```typescript
// Sensor management
initializeSensors(householdId: string): Promise<void>
processSensorEvent(householdId: string, sensorId: string, eventType: string): Promise<void>

// Insights
getSensorInsights(householdId: string): Promise<SensorInsights>
analyzeSensorPatterns(householdId: string): Promise<PatternAnalysis>
```

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration
4. Configure environment variables
5. Start development server: `npm run dev`

### Testing
- **Unit Tests**: Component and service testing
- **Integration Tests**: API and database testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Clerk**: Authentication and user management
- **Firebase**: Backend infrastructure and real-time features
- **shadcn/ui**: Beautiful, accessible UI components
- **Lucide**: Consistent iconography
- **React Query**: Efficient data fetching and caching

---

*Built with ❤️ for harmonious shared living* 