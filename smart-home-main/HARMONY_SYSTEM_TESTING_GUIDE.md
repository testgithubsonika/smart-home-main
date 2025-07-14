# Harmony System Testing Guide

This guide provides comprehensive instructions for testing the Harmony System, a post-move-in shared living space management application with Supabase database and AI-powered features.

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 2. Access Development Tools

Navigate to `/dev-tools` to access the database seeding and testing utilities.

## 🗄️ Database Setup

### Supabase Configuration

The application uses Supabase as the primary database with the following configuration:

- **Database**: PostgreSQL via Supabase
- **Environment**: Development
- **Tables**: 15 main tables for harmony system data
- **Real-time**: Supabase real-time subscriptions for live updates

### Required Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Database Seeding

The system includes comprehensive seeding functionality to populate the database with sample data for testing.

#### Available Sample Data

1. **Households**: Sample shared living spaces
2. **Rent Payments**: Monthly rent tracking
3. **Bills**: Utility and household bills
4. **Chores**: Task assignments and completions
5. **Sensors**: IoT device configurations
6. **Nudges**: Smart notifications and reminders
7. **Chat Messages**: Real-time communication
8. **Notifications**: System alerts
9. **WebAuthn Credentials**: Biometric authentication data

#### Seeding Options

- **Seed All Data**: Populates all tables with sample data
- **Seed Specific Tables**: Choose individual tables to seed
- **Clear All Data**: Removes all seeded data

## 🧪 Testing Scenarios

### 1. Basic Functionality Testing

#### Dashboard Overview
1. Navigate to `/harmony-hub`
2. Verify dashboard loads with sample data
3. Check rent, bills, and chores sections
4. Test sensor insights display

#### Data Management
1. Create new chores and bills
2. Mark items as completed
3. Verify real-time updates
4. Test data persistence

### 2. AI-Powered Features Testing

#### Conflict Coach
1. Navigate to Conflict Coach section
2. Start a new coaching session
3. Test Gemini API integration
4. Verify response generation
5. Check session persistence

#### Smart Nudges
1. Trigger sensor events
2. Verify nudge generation
3. Test notification delivery
4. Check nudge dismissal

### 3. WebAuthn Authentication Testing

#### Biometric Registration
1. Navigate to Security Settings
2. Enable fingerprint authentication
3. Complete registration process
4. Verify credential storage in Supabase

#### Biometric Authentication
1. Test fingerprint login
2. Verify authentication flow
3. Check credential validation
4. Test fallback to password

### 4. Real-time Features Testing

#### Live Updates
1. Open multiple browser tabs
2. Make changes in one tab
3. Verify updates appear in other tabs
4. Test real-time subscriptions

#### Chat System
1. Send messages between users
2. Verify real-time delivery
3. Test sentiment analysis
4. Check conflict detection

## 🔧 Technical Testing

### Database Operations

#### CRUD Operations
```typescript
// Test household creation
const householdId = await createHousehold({
  name: "Test Household",
  address: "123 Test St",
  members: ["user1", "user2"]
});

// Test data retrieval
const household = await getHousehold(householdId);

// Test data updates
await updateHousehold(householdId, { name: "Updated Name" });

// Test data deletion
await deleteHousehold(householdId);
```

#### Real-time Subscriptions
```typescript
// Subscribe to household changes
const subscription = supabase
  .channel('household_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'households' },
    (payload) => {
      console.log('Household changed:', payload);
    }
  )
  .subscribe();
```

### AI Integration Testing

#### Gemini API
```typescript
// Test conflict analysis
const analysis = await analyzeChatSentiment(messages);

// Test coaching session
const session = await startConflictCoachSession(
  householdId, 
  participants, 
  topic
);
```

#### Error Handling
1. Test with invalid API keys
2. Verify graceful degradation
3. Check error logging
4. Test retry mechanisms

### WebAuthn Testing

#### Credential Management
```typescript
// Test credential storage
await storeCredential(credentialData, userId);

// Test credential retrieval
const credentials = await getStoredCredentials(userId);

// Test credential deletion
await deleteCredential(credentialId);
```

#### Security Testing
1. Test credential validation
2. Verify sign count tracking
3. Check replay attack prevention
4. Test credential expiration

## 📊 Performance Testing

### Database Performance
- Test with large datasets (1000+ records)
- Monitor query performance
- Check real-time subscription efficiency
- Test concurrent operations

### AI Response Times
- Measure Gemini API response times
- Test concurrent requests
- Monitor error rates
- Check rate limiting

### WebAuthn Performance
- Test biometric response times
- Monitor credential validation speed
- Check memory usage
- Test device compatibility

### UI Performance
- Test with slow network conditions
- Check memory usage
- Verify smooth animations
- Test mobile responsiveness

## 🔒 Security Testing

### Data Access Control
- Test user permissions
- Verify household isolation
- Check admin privileges
- Test data encryption

### WebAuthn Security
- Test credential validation
- Verify attestation verification
- Check replay attack prevention
- Test device authentication

### API Security
- Test authentication
- Verify authorization
- Check rate limiting
- Test input validation

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify Supabase configuration
- Check internet connection
- Ensure database is accessible
- Verify RLS policies

#### Seeding Failures
- Clear browser cache
- Check console for errors
- Verify Supabase permissions
- Check table structure

#### AI Features Not Working
- Check Gemini API key configuration
- Verify API quota limits
- Test network connectivity
- Check error logs

#### WebAuthn Issues
- Verify HTTPS is enabled
- Check browser compatibility
- Test device biometric support
- Verify credential storage

### Debug Commands

```javascript
// Check Supabase connection
console.log('Supabase config:', supabaseConfig);

// Test database access
import { supabase } from '@/lib/supabase';
console.log('Supabase instance:', supabase);

// Verify seeded data
const household = await getHousehold('household1');
console.log('Household data:', household);

// Test WebAuthn support
console.log('WebAuthn supported:', window.PublicKeyCredential !== undefined);
```

## 📈 Monitoring

### Key Metrics
- Database query performance
- AI API response times
- WebAuthn success rates
- Real-time subscription health
- Error rates and types

### Logging
- Enable debug logging for development
- Monitor error logs
- Track user interactions
- Log performance metrics

## 🚀 Deployment Testing

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] API keys secured
- [ ] HTTPS enabled
- [ ] Error monitoring setup
- [ ] Performance monitoring active

### Testing Checklist

#### Core Features
- [ ] Dashboard loads with sample data
- [ ] Rent management functionality
- [ ] Bill tracking and payments
- [ ] Chore assignment and completion
- [ ] Sensor data display
- [ ] Real-time updates

#### AI Features
- [ ] Gemini conflict coaching
- [ ] Sentiment analysis
- [ ] Smart nudge generation
- [ ] Contextual reminders

#### Authentication
- [ ] Clerk authentication
- [ ] WebAuthn registration
- [ ] WebAuthn authentication
- [ ] Credential management

#### Data Persistence
- [ ] Create new records
- [ ] Update existing records
- [ ] Delete records
- [ ] Data retrieval
- [ ] Real-time subscriptions

#### User Experience
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Navigation flow

## 🔮 Future Enhancements

### Planned Testing Features
- **Automated Testing**: Unit and integration tests
- **Load Testing**: Performance under stress
- **Security Auditing**: Automated security scans
- **Accessibility Testing**: WCAG compliance
- **Cross-browser Testing**: Multi-browser compatibility

### Monitoring Improvements
- **Real-time Dashboards**: Live system monitoring
- **Alert Systems**: Proactive issue detection
- **Performance Tracking**: Detailed metrics
- **User Analytics**: Usage pattern analysis 