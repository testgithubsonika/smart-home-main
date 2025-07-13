#!/usr/bin/env node

/**
 * Firestore Data Upload Script
 * 
 * Usage:
 * node scripts/upload-firestore-data.js [householdId]
 * 
 * Example:
 * node scripts/upload-firestore-data.js household-123
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  writeBatch,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration - update with your config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data structure
const sampleData = {
  household: {
    name: "Sample Household",
    address: "123 Sample Street, City, State 12345",
    adminId: "user1",
    memberIds: ["user1", "user2", "user3"],
  },
  rentPayments: [
    {
      userId: "user1",
      amount: 800,
      dueDate: new Date(2024, 0, 1),
      status: "paid",
      method: "bank_transfer",
      paidDate: new Date(2024, 0, 1),
      paidBy: "user1",
      notes: "January rent payment",
    },
    {
      userId: "user2",
      amount: 800,
      dueDate: new Date(2024, 0, 1),
      status: "paid",
      method: "check",
      paidDate: new Date(2024, 0, 2),
      paidBy: "user2",
      notes: "January rent payment",
    },
    {
      userId: "user3",
      amount: 800,
      dueDate: new Date(2024, 0, 1),
      status: "pending",
      method: "pending",
      notes: "January rent payment",
    }
  ],
  bills: [
    {
      name: "Electricity Bill",
      amount: 120,
      category: "electricity",
      dueDate: new Date(2024, 0, 15),
      status: "paid",
      paidBy: "user1",
      splitBetween: ["user1", "user2", "user3"],
      notes: "December electricity bill",
    },
    {
      name: "Internet Bill",
      amount: 80,
      category: "internet",
      dueDate: new Date(2024, 0, 20),
      status: "pending",
      splitBetween: ["user1", "user2", "user3"],
      notes: "January internet bill",
    }
  ],
  chores: [
    {
      title: "Clean Kitchen",
      description: "Wash dishes, wipe counters, sweep floor",
      category: "cleaning",
      priority: "high",
      points: 15,
      assignedTo: "user1",
      assignedBy: "user1",
      dueDate: new Date(2024, 0, 5),
      status: "completed",
    },
    {
      title: "Take Out Trash",
      description: "Empty all trash bins and take to curb",
      category: "cleaning",
      priority: "medium",
      points: 10,
      assignedTo: "user2",
      assignedBy: "user1",
      dueDate: new Date(2024, 0, 7),
      status: "pending",
    },
    {
      title: "Pay Bills",
      description: "Pay electricity and internet bills",
      category: "finances",
      priority: "high",
      points: 20,
      assignedTo: "user1",
      assignedBy: "user1",
      dueDate: new Date(2024, 0, 10),
      status: "pending",
    }
  ],
  notifications: [
    {
      userId: "user1",
      title: "Rent Due Soon",
      message: "Your rent payment of $800 is due in 3 days",
      type: "rent_due",
      priority: "high",
      isRead: false,
      actionUrl: "/rent",
    },
    {
      userId: "user2",
      title: "Chore Assigned",
      message: "You have been assigned to clean the kitchen",
      type: "chore_assigned",
      priority: "medium",
      isRead: false,
      actionUrl: "/chores",
    }
  ],
  nudges: [
    {
      title: "Kitchen Cleanup Reminder",
      message: "The kitchen could use some attention. Consider cleaning up after meals.",
      type: "chore_reminder",
      priority: "medium",
      targetUsers: ["user1", "user2", "user3"],
      actionUrl: "/chores",
    },
    {
      title: "Bill Payment Due",
      message: "Electricity bill is due in 2 days. Don't forget to pay!",
      type: "bill_due",
      priority: "high",
      targetUsers: ["user1"],
      actionUrl: "/bills",
    }
  ]
};

async function uploadSampleData(householdId) {
  console.log(`🚀 Starting data upload for household: ${householdId}`);
  
  try {
    const batch = writeBatch(db);
    
    // Create household
    const householdRef = doc(db, 'households', householdId);
    batch.set(householdRef, {
      ...sampleData.household,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Household document prepared');

    // Add rent payments
    sampleData.rentPayments.forEach((payment, index) => {
      const paymentRef = doc(collection(db, 'rentPayments'));
      batch.set(paymentRef, {
        householdId,
        ...payment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    console.log(`✅ ${sampleData.rentPayments.length} rent payments prepared`);

    // Add bills
    sampleData.bills.forEach((bill, index) => {
      const billRef = doc(collection(db, 'bills'));
      batch.set(billRef, {
        householdId,
        ...bill,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    console.log(`✅ ${sampleData.bills.length} bills prepared`);

    // Add chores
    sampleData.chores.forEach((chore, index) => {
      const choreRef = doc(collection(db, 'chores'));
      batch.set(choreRef, {
        householdId,
        ...chore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    console.log(`✅ ${sampleData.chores.length} chores prepared`);

    // Add notifications
    sampleData.notifications.forEach((notification, index) => {
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        ...notification,
        createdAt: serverTimestamp(),
      });
    });
    console.log(`✅ ${sampleData.notifications.length} notifications prepared`);

    // Add nudges
    sampleData.nudges.forEach((nudge, index) => {
      const nudgeRef = doc(collection(db, 'nudges'));
      batch.set(nudgeRef, {
        householdId,
        ...nudge,
        createdAt: serverTimestamp(),
      });
    });
    console.log(`✅ ${sampleData.nudges.length} nudges prepared`);

    // Commit the batch
    console.log('📤 Committing batch to Firestore...');
    await batch.commit();
    
    console.log('🎉 Data upload completed successfully!');
    console.log(`📊 Summary for household ${householdId}:`);
    console.log(`   • 1 household record`);
    console.log(`   • ${sampleData.rentPayments.length} rent payments`);
    console.log(`   • ${sampleData.bills.length} bills`);
    console.log(`   • ${sampleData.chores.length} chores`);
    console.log(`   • ${sampleData.notifications.length} notifications`);
    console.log(`   • ${sampleData.nudges.length} nudges`);
    
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

async function clearHouseholdData(householdId) {
  console.log(`🗑️  Clearing data for household: ${householdId}`);
  
  try {
    // Note: This is a simplified version. In a real implementation,
    // you would need to query for all documents and delete them
    console.log('⚠️  Clear functionality requires additional implementation');
    console.log('   Use the Firebase Console or the web interface to clear data');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔥 Firestore Data Upload Script

Usage:
  node scripts/upload-firestore-data.js [command] [householdId]

Commands:
  upload <householdId>    Upload sample data for a household
  clear <householdId>     Clear all data for a household
  help                    Show this help message

Examples:
  node scripts/upload-firestore-data.js upload household-123
  node scripts/upload-firestore-data.js clear household-123
  node scripts/upload-firestore-data.js help

Environment Variables:
  Set these in your .env file or environment:
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
`);
}

// Main execution
async function main() {
  const command = process.argv[2];
  const householdId = process.argv[3];

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  if (!householdId) {
    console.error('❌ Error: Household ID is required');
    showHelp();
    process.exit(1);
  }

  switch (command) {
    case 'upload':
      await uploadSampleData(householdId);
      break;
    case 'clear':
      await clearHouseholdData(householdId);
      break;
    default:
      console.error(`❌ Error: Unknown command "${command}"`);
      showHelp();
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadSampleData, clearHouseholdData }; 