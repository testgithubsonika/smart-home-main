# Firestore Database Schema

This document describes the Firestore database schema for the Harmony System, a post-move-in shared living space management application.

## Overview

The Harmony System uses Firestore as its primary database, with collections organized around households, users, and various management features. The schema is designed to support real-time updates, complex queries, and scalable data management.

## Collections

### 1. households

Stores information about shared living spaces.

```typescript
interface Household {
  id: string;
  name: string;
  address: string;
  description?: string;
  rentAmount: number;
  rentDueDay: number;
  memberIds: string[];
  adminId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `adminId` (ascending)
- `memberIds` (array-contains)

### 2. rentPayments

Tracks individual rent payments from household members.

```typescript
interface RentPayment {
  id: string;
  householdId: string;
  userId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'pending';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `dueDate` (descending)
- `userId` (ascending) + `status` (ascending)
- `status` (ascending) + `dueDate` (ascending)

### 3. rentSchedules

Defines recurring rent payment schedules.

```typescript
interface RentSchedule {
  id: string;
  householdId: string;
  amount: number;
  dueDay: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `isActive` (ascending)

### 4. bills

Manages utility and other household bills.

```typescript
interface Bill {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  dueDate: Date;
  category: 'utilities' | 'rent' | 'insurance' | 'maintenance' | 'other';
  status: 'unpaid' | 'paid' | 'overdue';
  assignedTo?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `dueDate` (descending)
- `householdId` (ascending) + `status` (ascending)
- `assignedTo` (ascending) + `status` (ascending)

### 5. chores

Defines household chores and assignments.

```typescript
interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'one-time';
  points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate?: Date;
  completedDate?: Date;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `status` (ascending)
- `householdId` (ascending) + `assignedTo` (ascending)
- `householdId` (ascending) + `dueDate` (ascending)

### 6. choreCompletions

Records when chores are completed.

```typescript
interface ChoreCompletion {
  id: string;
  householdId: string;
  choreId: string;
  userId: string;
  completedAt: Date;
  points: number;
  notes?: string;
  createdAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `completedAt` (descending)
- `choreId` (ascending) + `completedAt` (descending)
- `userId` (ascending) + `completedAt` (descending)

### 7. sensors

Manages IoT sensors for smart home features.

```typescript
interface Sensor {
  id: string;
  householdId: string;
  name: string;
  type: 'motion' | 'door' | 'temperature' | 'humidity' | 'light' | 'noise';
  location: string;
  isActive: boolean;
  settings: {
    sensitivity?: string;
    triggerDelay?: number;
    notifications?: boolean;
    autoLog?: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `isActive` (ascending)
- `householdId` (ascending) + `type` (ascending)

### 8. sensorEvents

Records events from IoT sensors.

```typescript
interface SensorEvent {
  id: string;
  sensorId: string;
  householdId: string;
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  createdAt: Timestamp;
}
```

**Indexes:**
- `sensorId` (ascending) + `timestamp` (descending)
- `householdId` (ascending) + `timestamp` (descending)
- `type` (ascending) + `timestamp` (descending)

### 9. nudges

Smart notifications and reminders.

```typescript
interface Nudge {
  id: string;
  householdId: string;
  userId?: string;
  type: 'chore_reminder' | 'rent_reminder' | 'bill_reminder' | 'sensor_trigger' | 'conflict_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: Date;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `isRead` (ascending)
- `userId` (ascending) + `isRead` (ascending)
- `householdId` (ascending) + `type` (ascending)

### 10. chatMessages

Real-time communication between household members.

```typescript
interface ChatMessage {
  id: string;
  householdId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  createdAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `timestamp` (descending)
- `userId` (ascending) + `timestamp` (descending)

### 11. notifications

System notifications for users.

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'chore_completed' | 'rent_overdue' | 'bill_due' | 'nudge' | 'conflict_alert';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Timestamp;
}
```

**Indexes:**
- `userId` (ascending) + `isRead` (ascending)
- `userId` (ascending) + `timestamp` (descending)

### 12. householdSettings

Configuration settings for each household.

```typescript
interface HouseholdSettings {
  id: string;
  householdId: string;
  rentSettings: {
    splitMethod: 'equal' | 'percentage' | 'fixed';
    gracePeriod: number;
    lateFees: number;
  };
  choreSettings: {
    pointSystem: boolean;
    autoAssign: boolean;
    reminderFrequency: 'daily' | 'weekly';
  };
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  conflictResolution: {
    autoCoachEnabled: boolean;
    sentimentThreshold: number;
    escalationDelay: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending)

### 13. conflictAnalyses

AI-powered conflict analysis records.

```typescript
interface ConflictAnalysis {
  id: string;
  householdId: string;
  triggerMessageId?: string;
  sentiment: number;
  topics: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  createdAt: Timestamp;
}
```

**Indexes:**
- `householdId` (ascending) + `createdAt` (descending)
- `severity` (ascending) + `createdAt` (descending)

### 14. conflictCoachSessions

AI coaching session records.

```typescript
interface ConflictCoachSession {
  id: string;
  householdId: string;
  participants: string[];
  startedAt: Timestamp;
  endedAt?: Timestamp;
  status: 'active' | 'completed' | 'abandoned';
  topics: string[];
  resolution?: string;
  feedback?: {
    helpful: boolean;
    rating: number;
    comments?: string;
  };
}
```

**Indexes:**
- `householdId` (ascending) + `status` (ascending)
- `participants` (array-contains) + `status` (ascending)

## Security Rules

### Basic Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Household access control
    match /households/{householdId} {
      allow read, write: if request.auth != null && 
        (resource.data.adminId == request.auth.uid || 
         request.auth.uid in resource.data.memberIds);
    }
    
    // Household-scoped collections
    match /{collection}/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.householdId in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.memberIds;
    }
  }
}
```

### Collection-Specific Rules

1. **households**: Only household members can read/write
2. **rentPayments**: Members can read all, but only modify their own
3. **chores**: Members can read all, assigned user can update status
4. **chatMessages**: All household members can read/write
5. **notifications**: Users can only access their own notifications

## Data Relationships

### One-to-Many Relationships
- Household → Rent Payments
- Household → Bills
- Household → Chores
- Household → Sensors
- User → Notifications

### Many-to-Many Relationships
- Household ↔ Users (through memberIds array)
- Chores ↔ Users (through assignments)

### Hierarchical Relationships
- Sensor → Sensor Events
- Chore → Chore Completions
- Chat Message → Conflict Analysis

## Query Patterns

### Common Queries

1. **Get household dashboard data:**
```typescript
const householdData = await Promise.all([
  getRentPayments(householdId),
  getBills(householdId),
  getChores(householdId),
  getSensors(householdId)
]);
```

2. **Get user-specific data:**
```typescript
const userData = await Promise.all([
  getUserNotifications(userId),
  getChoresByUser(householdId, userId),
  getRentPaymentsByUser(householdId, userId)
]);
```

3. **Real-time subscriptions:**
```typescript
const unsubscribe = onSnapshot(
  query(collection(db, 'chatMessages'), 
        where('householdId', '==', householdId),
        orderBy('timestamp', 'desc'),
        limit(50)),
  (snapshot) => {
    // Handle real-time updates
  }
);
```

## Performance Considerations

### Indexing Strategy
- Composite indexes for common query patterns
- Array indexes for member relationships
- Timestamp indexes for chronological queries

### Data Denormalization
- Household ID included in all related documents
- User information cached in documents where needed
- Calculated fields stored to avoid complex queries

### Pagination
- Use `limit()` and `startAfter()` for large result sets
- Implement cursor-based pagination for chat messages
- Use `orderBy()` with `limit()` for recent items

## Backup and Recovery

### Export Strategy
```bash
# Export all collections
firebase firestore:export --project=cyberpunk-85ee8

# Export specific collections
firebase firestore:export --project=cyberpunk-85ee8 --collection-ids=households,chores,bills
```

### Import Strategy
```bash
# Import from backup
firebase firestore:import --project=cyberpunk-85ee8 --backup=backup-folder
```

## Monitoring and Analytics

### Key Metrics
- Document read/write operations
- Query performance
- Index usage
- Storage costs

### Alerts
- High error rates
- Slow query performance
- Storage quota approaching limits
- Security rule violations

## Development Workflow

### Local Development
1. Use Firebase Emulator Suite for local development
2. Seed data using the provided seed service
3. Test queries and security rules locally
4. Use Firebase CLI for deployment

### Testing
1. Unit tests for service functions
2. Integration tests with emulator
3. Security rule testing
4. Performance testing with large datasets

### Deployment
1. Deploy security rules: `firebase deploy --only firestore:rules`
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Monitor deployment in Firebase Console

## Best Practices

1. **Security First**: Always validate data and enforce access controls
2. **Efficient Queries**: Use indexes and avoid complex queries
3. **Real-time Updates**: Leverage Firestore's real-time capabilities
4. **Data Consistency**: Use transactions for related operations
5. **Error Handling**: Implement proper error handling and retry logic
6. **Monitoring**: Set up alerts and monitor performance
7. **Backup**: Regular backups and disaster recovery planning
8. **Documentation**: Keep schema documentation up to date

## Migration Strategy

### Version Control
- Track schema changes in version control
- Use migration scripts for breaking changes
- Test migrations in staging environment

### Backward Compatibility
- Maintain backward compatibility when possible
- Use optional fields for new features
- Implement gradual rollouts for major changes

### Rollback Plan
- Keep previous schema versions
- Maintain backup points before migrations
- Test rollback procedures regularly 