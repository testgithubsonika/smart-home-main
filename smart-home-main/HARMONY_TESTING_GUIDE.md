# Harmony System Testing Guide

This guide provides comprehensive instructions for testing the Harmony System, a post-move-in shared living space management application with Firestore database and AI-powered features.

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 2. Access Development Tools

Navigate to `/dev-tools` to access the database seeding and testing utilities.

## 🗄️ Database Setup

### Firestore Configuration

The application uses Firebase Firestore as the primary database with the following configuration:

- **Project ID**: `cyberpunk-85ee8`
- **Environment**: Development
- **Collections**: 12 main collections for harmony system data

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

#### Seeding Options

- **Seed All Data**: Populates all collections with sample data
- **Seed Specific Collections**: Choose individual collections to seed
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

#### Conflict Coaching (Gemini Integration)
1. Send messages in the chat
2. Trigger conflict detection
3. Test AI coaching responses
4. Verify sentiment analysis

#### Smart Nudges
1. Simulate sensor events
2. Check nudge generation
3. Test contextual reminders
4. Verify notification delivery

### 3. Sensor Integration Testing

#### Motion Sensors
- Kitchen motion detection
- Living room activity tracking
- Bathroom usage monitoring

#### Appliance Sensors
- Dishwasher completion alerts
- Washer/dryer status updates
- Trash level monitoring

#### Environmental Sensors
- Temperature monitoring
- Humidity tracking
- Light level detection

## 🔧 Development Tools

### Database Seeding Tool

Located at `/dev-tools`, this tool provides:

- **One-click seeding**: Populate entire database
- **Selective seeding**: Choose specific collections
- **Data clearing**: Reset database state
- **ID tracking**: Monitor seeded document IDs

### Console Testing

Use the browser console to run tests:

```javascript
// Test database seeding
await testDatabaseSeeding();

// Access seeded data
const seededIds = seedService.getSeededIds();
console.log('Seeded IDs:', seededIds);
```

## 📊 Sample Data Structure

### Household Data
```typescript
{
  name: "Sunset Apartments #302",
  address: "123 Sunset Blvd, Apt 302, Los Angeles, CA 90210",
  rentAmount: 2800,
  memberIds: ["user1", "user2", "user3"],
  adminId: "user1"
}
```

### Chore Data
```typescript
{
  title: "Clean Kitchen",
  description: "Wipe counters, clean sink, take out trash",
  assignedTo: "user1",
  frequency: "daily",
  points: 10,
  status: "pending"
}
```

### Sensor Data
```typescript
{
  name: "Kitchen Motion Sensor",
  type: "motion",
  location: "kitchen",
  isActive: true,
  settings: {
    sensitivity: "medium",
    triggerDelay: 30,
    notifications: true
  }
}
```

## 🎯 Testing Checklist

### Core Features
- [ ] Dashboard loads with sample data
- [ ] Rent management functionality
- [ ] Bill tracking and payments
- [ ] Chore assignment and completion
- [ ] Sensor data display
- [ ] Real-time updates

### AI Features
- [ ] Gemini conflict coaching
- [ ] Sentiment analysis
- [ ] Smart nudge generation
- [ ] Contextual reminders

### Data Persistence
- [ ] Create new records
- [ ] Update existing records
- [ ] Delete records
- [ ] Data retrieval
- [ ] Real-time subscriptions

### User Experience
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Navigation flow

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify Firebase configuration
- Check internet connection
- Ensure Firestore rules allow read/write

#### Seeding Failures
- Clear browser cache
- Check console for errors
- Verify Firestore permissions

#### AI Features Not Working
- Check Gemini API key configuration
- Verify API quota limits
- Test network connectivity

### Debug Commands

```javascript
// Check Firebase connection
console.log('Firebase config:', firebaseConfig);

// Test Firestore access
import { db } from '@/lib/firebase';
console.log('Firestore instance:', db);

// Verify seeded data
const household = await getHousehold('household1');
console.log('Household data:', household);
```

## 📈 Performance Testing

### Database Performance
- Test with large datasets
- Monitor query performance
- Check real-time subscription efficiency

### AI Response Times
- Measure Gemini API response times
- Test concurrent requests
- Monitor error rates

### UI Performance
- Test with slow network
- Check memory usage
- Verify smooth animations

## 🔒 Security Testing

### Data Access Control
- Test user permissions
- Verify household isolation
- Check admin privileges

### API Security
- Test authentication
- Verify authorization
- Check data validation

## 📱 Mobile Testing

### Responsive Design
- Test on various screen sizes
- Verify touch interactions
- Check mobile navigation

### Performance
- Test on slower devices
- Monitor battery usage
- Check offline functionality

## 🚀 Deployment Testing

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables
- Verify API keys
- Check configuration
- Test feature flags

## 📝 Test Reports

### Automated Testing
- Unit tests for services
- Integration tests for components
- E2E tests for user flows

### Manual Testing
- User acceptance testing
- Exploratory testing
- Accessibility testing

## 🎉 Success Criteria

A successful test run should demonstrate:

1. **Database Functionality**: All CRUD operations work correctly
2. **AI Integration**: Gemini coaching responds appropriately
3. **Real-time Updates**: Changes reflect immediately
4. **User Experience**: Smooth, intuitive interface
5. **Performance**: Fast loading and responsive interactions
6. **Security**: Proper data isolation and access control

## 📞 Support

For issues or questions:

1. Check the console for error messages
2. Review the Firestore schema documentation
3. Test with the provided sample data
4. Use the development tools for debugging

---

**Note**: This testing guide is for development purposes. Always test thoroughly before deploying to production. 