# Firebase Data Upload Guide

This guide explains how to upload, manage, and work with Firestore data in the Smart Home Harmony system.

## 🚀 Quick Start

### Method 1: Using the Web Interface (Recommended)

1. **Navigate to DevTools**: Go to `/devtools` in your application
2. **Open Firebase Manager Tab**: Click on the "Firebase Manager" tab
3. **Enter Household ID**: Use a household ID like `household-123`
4. **Upload Sample Data**: Click "Upload Sample Data" button
5. **Verify Connection**: Ensure the database connection status shows "Connected"

### Method 2: Using Command Line Script

1. **Navigate to project directory**:
   ```bash
   cd smart-home-main
   ```

2. **Run the upload script**:
   ```bash
   node scripts/upload-firestore-data.js upload household-123
   ```

3. **Check the output** for success confirmation.

## 📋 Prerequisites

### 1. Firebase Configuration

Ensure your Firebase configuration is set up in `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Firestore Rules

Make sure your Firestore security rules allow write operations for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // For development - allow all operations
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning**: These rules are for development only. Use proper authentication rules for production.

## 🔧 Available Services

### FirebaseServices Class

The main service class provides comprehensive data management:

```typescript
import { FirebaseServices } from '@/services/firebaseServices';

// Create a household
const householdId = await FirebaseServices.createHousehold({
  name: "My Household",
  address: "123 Main St",
  adminId: "user1",
  memberIds: ["user1", "user2"]
});

// Upload sample data
await FirebaseServices.uploadSampleData(householdId);

// Export data
const data = await FirebaseServices.exportHouseholdData(householdId);

// Clear data
await FirebaseServices.clearHouseholdData(householdId);
```

### Individual Functions

```typescript
import { 
  createHousehold, 
  uploadSampleData, 
  exportHouseholdData,
  clearHouseholdData,
  checkDatabaseConnection 
} from '@/services/firebaseServices';

// Check database connection
const isConnected = await checkDatabaseConnection();

// Create household
const householdId = await createHousehold({
  name: "Sample Household",
  address: "123 Sample Street",
  adminId: "user1",
  memberIds: ["user1", "user2", "user3"]
});

// Upload sample data
await uploadSampleData(householdId);
```

## 📊 Data Structure

### Sample Data Includes:

1. **Household** (1 record)
   - Basic household information
   - Admin and member IDs

2. **Rent Payments** (3 records)
   - Monthly rent payments
   - Different payment statuses (paid, pending)
   - Various payment methods

3. **Bills** (2 records)
   - Utility bills (electricity, internet)
   - Different categories and statuses
   - Split between household members

4. **Chores** (3 records)
   - Household tasks
   - Different priorities and categories
   - Assignment and completion status

5. **Notifications** (2 records)
   - System notifications
   - Different types and priorities
   - Read/unread status

6. **Nudges** (2 records)
   - AI-powered suggestions
   - Different types and target users
   - Action URLs

## 🛠️ Web Interface Features

### Firebase Data Manager Component

The web interface provides:

- **Connection Status**: Real-time database connection monitoring
- **Household Configuration**: Set household ID for operations
- **Upload Sample Data**: One-click sample data upload
- **Export Data**: Download current data as JSON
- **Clear Data**: Remove all household data (with confirmation)
- **Data Preview**: Visual summary of data structure
- **Export Summary**: Detailed breakdown of exported data

### Usage Steps:

1. **Check Connection**: Ensure database is connected
2. **Enter Household ID**: Use a unique identifier
3. **Upload Data**: Click "Upload Sample Data"
4. **Verify**: Check the success message
5. **Test**: Navigate to your app to see the data

## 📝 Command Line Usage

### Basic Commands

```bash
# Upload sample data
node scripts/upload-firestore-data.js upload household-123

# Clear household data
node scripts/upload-firestore-data.js clear household-123

# Show help
node scripts/upload-firestore-data.js help
```

### Environment Setup

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### Script Features

- **Batch Operations**: Uses Firestore batch writes for efficiency
- **Error Handling**: Comprehensive error reporting
- **Progress Tracking**: Real-time upload progress
- **Data Validation**: Ensures data integrity
- **Summary Reports**: Detailed upload summaries

## 🔍 Data Verification

### Check Uploaded Data

1. **Firebase Console**: Visit [Firebase Console](https://console.firebase.google.com)
2. **Navigate to Firestore**: Go to Firestore Database
3. **Check Collections**: Verify data in each collection:
   - `households`
   - `rentPayments`
   - `bills`
   - `chores`
   - `notifications`
   - `nudges`

### Verify in Application

1. **Navigate to Harmony Hub**: Go to `/harmony-hub`
2. **Check Dashboard**: Verify data appears in dashboard
3. **Test Features**: Try creating/editing items
4. **Check Tabs**: Verify data in Chores, Bills, Rent tabs

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check Firebase configuration
   - Verify API keys are correct
   - Ensure Firestore is enabled

2. **Permission Denied**
   - Check Firestore security rules
   - Verify authentication setup
   - Ensure proper user permissions

3. **Data Not Appearing**
   - Check household ID consistency
   - Verify data was uploaded successfully
   - Check application queries

4. **Upload Errors**
   - Check network connection
   - Verify Firebase project settings
   - Check console for detailed errors

### Debug Steps

1. **Check Console Logs**: Look for error messages
2. **Verify Configuration**: Double-check Firebase config
3. **Test Connection**: Use the connection test feature
4. **Check Firestore Rules**: Ensure write permissions
5. **Verify Data**: Check Firebase Console for uploaded data

## 🔄 Data Management

### Updating Data

```typescript
import { updateHousehold, updateRentPayment } from '@/services/firebaseServices';

// Update household
await updateHousehold(householdId, {
  name: "Updated Household Name"
});

// Update rent payment
await updateRentPayment(paymentId, {
  status: "paid",
  paidDate: new Date()
});
```

### Deleting Data

```typescript
import { clearHouseholdData } from '@/services/firebaseServices';

// Clear all household data
await clearHouseholdData(householdId);
```

### Exporting Data

```typescript
import { exportHouseholdData } from '@/services/firebaseServices';

// Export all household data
const data = await exportHouseholdData(householdId);
console.log('Exported data:', data);
```

## 📈 Best Practices

1. **Use Unique IDs**: Always use unique household IDs
2. **Test in Development**: Use development environment for testing
3. **Backup Data**: Export data before major changes
4. **Monitor Usage**: Check Firebase usage limits
5. **Secure Rules**: Use proper security rules in production
6. **Error Handling**: Always handle errors gracefully
7. **Data Validation**: Validate data before uploading

## 🔗 Related Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Harmony System Guide](./HARMONY_SYSTEM.md)
- [Database Setup Guide](./DATABASE_SETUP.md)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Firebase Console for errors
3. Check application console logs
4. Verify all configuration settings
5. Test with a simple upload first

For additional help, refer to the Firebase documentation or create an issue in the project repository. 