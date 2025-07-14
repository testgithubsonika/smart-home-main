#!/usr/bin/env node

/**
 * Migration script to transfer data from Firestore to Supabase
 * 
 * Usage:
 * 1. Set up your environment variables
 * 2. Run: node scripts/migrate-to-supabase.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration (from your existing setup)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Utility function to convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp instanceof Date) return timestamp.toISOString();
  return timestamp;
};

// Utility function to convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

// Migration functions
async function migrateHouseholds() {
  console.log('🔄 Migrating households...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'households'));
    const households = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      households.push({
        id: doc.id,
        name: data.name,
        address: data.address,
        members: data.members || [],
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt),
      });
    });

    if (households.length > 0) {
      const { error } = await supabase
        .from('households')
        .upsert(households, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating households:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${households.length} households`);
      return true;
    } else {
      console.log('ℹ️  No households to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching households from Firestore:', error);
    return false;
  }
}

async function migrateChores() {
  console.log('🔄 Migrating chores...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'chores'));
    const chores = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      chores.push({
        id: doc.id,
        household_id: data.householdId,
        title: data.title,
        description: data.description,
        assigned_to: data.assignedTo,
        assigned_by: data.assignedBy,
        due_date: data.dueDate ? convertTimestamp(data.dueDate).split('T')[0] : null,
        completed_date: data.completedDate ? convertTimestamp(data.completedDate).split('T')[0] : null,
        status: data.status,
        priority: data.priority,
        category: data.category,
        points: data.points,
        recurring: data.recurring,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt),
      });
    });

    if (chores.length > 0) {
      const { error } = await supabase
        .from('chores')
        .upsert(chores, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating chores:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${chores.length} chores`);
      return true;
    } else {
      console.log('ℹ️  No chores to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching chores from Firestore:', error);
    return false;
  }
}

async function migrateBills() {
  console.log('🔄 Migrating bills...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'bills'));
    const bills = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bills.push({
        id: doc.id,
        household_id: data.householdId,
        name: data.name,
        amount: data.amount,
        due_date: data.dueDate ? convertTimestamp(data.dueDate).split('T')[0] : null,
        paid_date: data.paidDate ? convertTimestamp(data.paidDate).split('T')[0] : null,
        status: data.status,
        category: data.category,
        paid_by: data.paidBy,
        split_between: data.splitBetween || [],
        receipt_url: data.receiptUrl,
        notes: data.notes,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt),
      });
    });

    if (bills.length > 0) {
      const { error } = await supabase
        .from('bills')
        .upsert(bills, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating bills:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${bills.length} bills`);
      return true;
    } else {
      console.log('ℹ️  No bills to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching bills from Firestore:', error);
    return false;
  }
}

async function migrateRentPayments() {
  console.log('🔄 Migrating rent payments...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'rentPayments'));
    const payments = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        household_id: data.householdId,
        user_id: data.userId,
        amount: data.amount,
        due_date: data.dueDate ? convertTimestamp(data.dueDate).split('T')[0] : null,
        paid_date: data.paidDate ? convertTimestamp(data.paidDate).split('T')[0] : null,
        status: data.status,
        method: data.method,
        notes: data.notes,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt),
      });
    });

    if (payments.length > 0) {
      const { error } = await supabase
        .from('rent_payments')
        .upsert(payments, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating rent payments:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${payments.length} rent payments`);
      return true;
    } else {
      console.log('ℹ️  No rent payments to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching rent payments from Firestore:', error);
    return false;
  }
}

async function migrateSensors() {
  console.log('🔄 Migrating sensors...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'sensors'));
    const sensors = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sensors.push({
        id: doc.id,
        household_id: data.householdId,
        name: data.name,
        type: data.type,
        location: data.location,
        is_active: data.isActive,
        last_reading: data.lastReading,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt),
      });
    });

    if (sensors.length > 0) {
      const { error } = await supabase
        .from('sensors')
        .upsert(sensors, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating sensors:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${sensors.length} sensors`);
      return true;
    } else {
      console.log('ℹ️  No sensors to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching sensors from Firestore:', error);
    return false;
  }
}

async function migrateNudges() {
  console.log('🔄 Migrating nudges...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'nudges'));
    const nudges = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      nudges.push({
        id: doc.id,
        household_id: data.householdId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        target_users: data.targetUsers || [],
        is_read: data.isRead,
        is_dismissed: data.isDismissed,
        expires_at: convertTimestamp(data.expiresAt),
        action_url: data.actionUrl,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt),
      });
    });

    if (nudges.length > 0) {
      const { error } = await supabase
        .from('nudges')
        .upsert(nudges, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating nudges:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${nudges.length} nudges`);
      return true;
    } else {
      console.log('ℹ️  No nudges to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching nudges from Firestore:', error);
    return false;
  }
}

async function migrateChatMessages() {
  console.log('🔄 Migrating chat messages...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'chatMessages'));
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        household_id: data.householdId,
        user_id: data.userId,
        content: data.content,
        timestamp: convertTimestamp(data.timestamp),
        sentiment: data.sentiment,
        is_edited: data.isEdited,
        edited_at: convertTimestamp(data.editedAt),
        created_at: convertTimestamp(data.createdAt),
      });
    });

    if (messages.length > 0) {
      const { error } = await supabase
        .from('chat_messages')
        .upsert(messages, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating chat messages:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${messages.length} chat messages`);
      return true;
    } else {
      console.log('ℹ️  No chat messages to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching chat messages from Firestore:', error);
    return false;
  }
}

async function migrateNotifications() {
  console.log('🔄 Migrating notifications...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'notifications'));
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        user_id: data.userId,
        household_id: data.householdId,
        type: data.type,
        title: data.title,
        message: data.message,
        is_read: data.isRead,
        action_url: data.actionUrl,
        metadata: data.metadata,
        created_at: convertTimestamp(data.createdAt),
      });
    });

    if (notifications.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .upsert(notifications, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error migrating notifications:', error);
        return false;
      }
      
      console.log(`✅ Migrated ${notifications.length} notifications`);
      return true;
    } else {
      console.log('ℹ️  No notifications to migrate');
      return true;
    }
  } catch (error) {
    console.error('❌ Error fetching notifications from Firestore:', error);
    return false;
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Firestore to Supabase migration...\n');

  const migrations = [
    { name: 'Households', fn: migrateHouseholds },
    { name: 'Chores', fn: migrateChores },
    { name: 'Bills', fn: migrateBills },
    { name: 'Rent Payments', fn: migrateRentPayments },
    { name: 'Sensors', fn: migrateSensors },
    { name: 'Nudges', fn: migrateNudges },
    { name: 'Chat Messages', fn: migrateChatMessages },
    { name: 'Notifications', fn: migrateNotifications },
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    try {
      const success = await migration.fn();
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ Error in ${migration.name} migration:`, error);
      failureCount++;
    }
    console.log(''); // Add spacing between migrations
  }

  console.log('📊 Migration Summary:');
  console.log(`✅ Successful migrations: ${successCount}`);
  console.log(`❌ Failed migrations: ${failureCount}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with some failures. Please check the logs above.');
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
}); 