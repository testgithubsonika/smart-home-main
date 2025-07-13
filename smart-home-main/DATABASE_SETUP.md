# Database Setup Guide

This guide explains how to set up your Firestore database with sample data for the Smart Home Harmony system.

## Overview

The Smart Home Harmony system uses Firebase Firestore as its database. The database contains several collections that store different types of data:

- **Users**: Household members and their profiles
- **Households**: Shared living spaces and their details
- **Rent Payments**: Monthly rent tracking and payments
- **Bills**: Utility and other shared expenses
- **Chores**: Task assignments and completion tracking
- **Sensors**: IoT device data and events
- **Chat Messages**: Household communication
- **Notifications**: System alerts and reminders

## Automatic Setup (Recommended)

The application automatically sets up the database with sample data when running in development mode. This happens when you first load the app.

### What Gets Created

The auto-setup creates:

- **3 Sample Users**: Alex Johnson, Sam Chen, Jordan Smith
- **1 Household**: Sunset Apartments #302
- **3 Rent Payments**: Various payment statuses (paid, overdue)
- **3 Bills**: Electricity, Internet, Water bills
- **4 Chores**: Kitchen cleaning, vacuuming, recycling, maintenance
- **3 Sensors**: Motion, door, and trash level sensors
- **Sample Data**: Chat messages, notifications, and settings

## Manual Setup

If you prefer to set up the database manually or need to reset it:

### Option 1: Using the Dev Tools UI

1. Navigate to `/dev-tools` in your application
2. Click on the "Database Setup" tab
3. Click "Check Status" to see current database state
4. Click "Setup Database" to populate with sample data
5. Use "Clear Database" to remove all data if needed

### Option 2: Using the Console

You can also run the setup from the browser console:

```javascript
// Check if database is empty
import { checkDatabaseEmpty } from '@/utils/setupDatabase';
const isEmpty = await checkDatabaseEmpty();
console.log('Database is empty:', isEmpty);

// Setup database with sample data
import { setupDatabase } from '@/utils/setupDatabase';
await setupDatabase();

// Clear all data
import { clearDatabase } from '@/utils/setupDatabase';
await clearDatabase();
```

## Database Collections

### Users Collection
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  joinedAt: Date;
}
```

### Households Collection
```typescript
interface Household {
  id: string;
  name: string;
  address: string;
  members: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
}
```

### Rent Payments Collection
```typescript
interface RentPayment {
  id: string;
  householdId: string;
  userId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  method?: 'bank_transfer' | 'cash' | 'check' | 'digital';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Bills Collection
```typescript
interface Bill {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  category: 'electricity' | 'water' | 'gas' | 'internet' | 'trash' | 'other';
  paidBy?: string; // User ID who paid
  splitBetween: string[]; // User IDs
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Chores Collection
```typescript
interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  assignedTo?: string; // User ID
  assignedBy?: string; // User ID
  dueDate?: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  category: 'cleaning' | 'maintenance' | 'shopping' | 'cooking' | 'other';
  points: number; // Reward points for completion
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // Every X days/weeks/months
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Firestore Security Rules

The current security rules allow all authenticated users to read and write data. This is suitable for development but should be tightened for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users (development only)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Permission Errors
If you see "Missing or insufficient permissions" errors:

1. Check that your Firebase project is properly configured
2. Verify that Firestore is enabled in your Firebase console
3. Ensure the security rules are deployed correctly
4. Check that you're authenticated with Clerk

### Empty Database
If the database appears empty after setup:

1. Check the browser console for errors
2. Verify Firebase configuration in `src/lib/firebase.ts`
3. Try manually running the setup from the Dev Tools
4. Check if you're connected to the correct Firebase project

### Sample Data Not Loading
If sample data isn't loading:

1. Check the browser console for setup errors
2. Verify that all required collections are created
3. Try clearing and re-setting up the database
4. Check Firestore quotas and limits

## Development vs Production

### Development Mode
- Auto-setup is enabled
- Permissive security rules
- Sample data for testing
- Debug logging enabled

### Production Mode
- Auto-setup is disabled
- Strict security rules
- No sample data
- Minimal logging

## Next Steps

After setting up the database:

1. **Test the Application**: Navigate through different pages to ensure data is loading
2. **Verify Permissions**: Test creating, updating, and deleting records
3. **Check Real-time Updates**: Ensure Firestore listeners are working
4. **Review Security Rules**: Tighten permissions for production use

## Support

If you encounter issues with database setup:

1. Check the browser console for error messages
2. Review the Firebase console for any issues
3. Verify your Firebase configuration
4. Check the Dev Tools for database status and testing utilities 