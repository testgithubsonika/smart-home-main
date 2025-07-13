import { 
  collection, 
  doc, 
  addDoc, 
  writeBatch,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Household,
  RentPayment,
  RentSchedule,
  Bill,
  Chore,
  ChoreCompletion,
  Sensor,
  SensorEvent,
  Nudge,
  ChatMessage,
  ConflictAnalysis,
  ConflictCoachSession,
  Notification,
  HouseholdSettings,
  User
} from '@/types/harmony';

// Sample data for seeding
// Sample users will be created with actual Clerk user IDs
const createSampleUsers = (clerkUserIds: string[]): Omit<User, 'id'>[] => [
  {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    joinedAt: new Date('2024-01-01')
  },
  {
    name: 'Sam Chen',
    email: 'sam@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    joinedAt: new Date('2024-01-01')
  },
  {
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    joinedAt: new Date('2024-01-01')
  }
];

const createSampleHouseholds = (clerkUserIds: string[]): Omit<Household, 'id'>[] => [
  {
    name: 'Sunset Apartments #302',
    address: '123 Sunset Blvd, Apt 302, Los Angeles, CA 90210',
    members: clerkUserIds,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

const sampleRentSchedules: Omit<RentSchedule, 'id'>[] = [
  {
    householdId: 'household1',
    monthlyAmount: 2800,
    dueDay: 1,
    splitType: 'equal',
    splits: [
      { userId: 'user1', amount: 933.33, percentage: 33.33 },
      { userId: 'user2', amount: 933.33, percentage: 33.33 },
      { userId: 'user3', amount: 933.34, percentage: 33.34 }
    ],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    isActive: true
  }
];

const sampleRentPayments: Omit<RentPayment, 'id'>[] = [
  {
    householdId: 'household1',
    userId: 'user1',
    amount: 933.33,
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2024-01-01'),
    status: 'paid',
    method: 'bank_transfer',
    notes: 'January rent payment',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    householdId: 'household1',
    userId: 'user2',
    amount: 933.33,
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2024-01-02'),
    status: 'paid',
    method: 'digital',
    notes: 'January rent payment',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02')
  },
  {
    householdId: 'household1',
    userId: 'user3',
    amount: 933.34,
    dueDate: new Date('2024-01-01'),
    paidDate: null,
    status: 'overdue',
    method: 'digital',
    notes: 'January rent payment - overdue',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

const sampleBills: Omit<Bill, 'id'>[] = [
  {
    householdId: 'household1',
    name: 'Electricity',
    amount: 120.50,
    dueDate: new Date('2024-01-15'),
    category: 'electricity',
    status: 'unpaid',
    paidBy: undefined,
    splitBetween: ['user1', 'user2', 'user3'],
    notes: 'Monthly electricity bill',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    name: 'Internet',
    amount: 89.99,
    dueDate: new Date('2024-01-20'),
    category: 'internet',
    status: 'paid',
    paidBy: 'user2',
    splitBetween: ['user1', 'user2', 'user3'],
    notes: 'Monthly internet bill',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20')
  },
  {
    householdId: 'household1',
    name: 'Water',
    amount: 45.00,
    dueDate: new Date('2024-01-25'),
    category: 'water',
    status: 'unpaid',
    paidBy: undefined,
    splitBetween: ['user1', 'user2', 'user3'],
    notes: 'Monthly water bill',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

const sampleChores: Omit<Chore, 'id'>[] = [
  {
    householdId: 'household1',
    title: 'Clean Kitchen',
    description: 'Wipe counters, clean sink, take out trash',
    assignedTo: 'user1',
    assignedBy: 'user1',
    dueDate: new Date('2024-01-15'),
    status: 'pending',
    priority: 'medium',
    category: 'cleaning',
    points: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    title: 'Vacuum Living Room',
    description: 'Vacuum carpets and clean surfaces',
    assignedTo: 'user2',
    assignedBy: 'user1',
    dueDate: new Date('2024-01-10'),
    completedDate: new Date('2024-01-10'),
    status: 'completed',
    priority: 'low',
    category: 'cleaning',
    points: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10')
  },
  {
    householdId: 'household1',
    title: 'Take Out Recycling',
    description: 'Sort and take out recycling bins',
    assignedTo: 'user3',
    assignedBy: 'user1',
    dueDate: new Date('2024-01-12'),
    status: 'completed',
    priority: 'low',
    category: 'cleaning',
    points: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-12')
  },
  {
    householdId: 'household1',
    title: 'Fix Leaky Faucet',
    description: 'Repair the kitchen faucet leak',
    assignedTo: 'user1',
    assignedBy: 'user2',
    dueDate: new Date('2024-01-20'),
    status: 'in_progress',
    priority: 'high',
    category: 'maintenance',
    points: 25,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

const sampleChoreCompletions: Omit<ChoreCompletion, 'id'>[] = [
  {
    choreId: 'chore2',
    userId: 'user2',
    completedAt: new Date('2024-01-10'),
    verifiedBy: 'user1',
    pointsEarned: 15,
    notes: 'Great job cleaning!'
  },
  {
    choreId: 'chore3',
    userId: 'user3',
    completedAt: new Date('2024-01-12'),
    verifiedBy: 'user1',
    pointsEarned: 5,
    notes: 'Recycling sorted properly'
  }
];

const sampleSensors: Omit<Sensor, 'id'>[] = [
  {
    householdId: 'household1',
    name: 'Kitchen Motion Sensor',
    type: 'motion',
    location: 'Kitchen',
    isActive: true,
    lastReading: {
      value: true,
      timestamp: new Date()
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    name: 'Front Door Sensor',
    type: 'door',
    location: 'Front Door',
    isActive: true,
    lastReading: {
      value: false,
      timestamp: new Date()
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    name: 'Trash Level Sensor',
    type: 'trash',
    location: 'Kitchen',
    isActive: true,
    lastReading: {
      value: 75,
      timestamp: new Date()
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

const sampleSensorEvents: Omit<SensorEvent, 'id'>[] = [
  {
    sensorId: 'sensor1',
    eventType: 'motion_detected',
    value: true,
    timestamp: new Date(),
    metadata: { duration: 300 }
  },
  {
    sensorId: 'sensor2',
    eventType: 'door_opened',
    value: true,
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    metadata: { user: 'user1' }
  },
  {
    sensorId: 'sensor3',
    eventType: 'threshold_exceeded',
    value: 80,
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    metadata: { threshold: 75 }
  }
];

const sampleNudges: Omit<Nudge, 'id'>[] = [
  {
    householdId: 'household1',
    title: 'Kitchen Cleanup Reminder',
    message: 'The kitchen motion sensor detected activity. Don\'t forget to clean up after cooking!',
    type: 'chore_reminder',
    priority: 'medium',
    targetUsers: ['user1', 'user2', 'user3'],
    isRead: false,
    isDismissed: false,
    expiresAt: new Date(Date.now() + 86400000), // 24 hours
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    title: 'Trash Almost Full',
    message: 'The trash level sensor shows 80% full. Consider taking it out soon.',
    type: 'sensor_triggered',
    priority: 'low',
    targetUsers: ['user1', 'user2', 'user3'],
    isRead: false,
    isDismissed: false,
    expiresAt: new Date(Date.now() + 86400000), // 24 hours
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleChatMessages: Omit<ChatMessage, 'id'>[] = [
  {
    householdId: 'household1',
    userId: 'user1',
    content: 'Hey everyone! I noticed the kitchen is getting a bit messy. Should we set up a cleaning schedule?',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    sentiment: 'neutral',
    isEdited: false
  },
  {
    householdId: 'household1',
    userId: 'user2',
    content: 'That\'s a great idea! I\'m happy to help create one.',
    timestamp: new Date(Date.now() - 82800000), // 23 hours ago
    sentiment: 'positive',
    isEdited: false
  },
  {
    householdId: 'household1',
    userId: 'user3',
    content: 'Sure, but I think we should also talk about the noise levels at night.',
    timestamp: new Date(Date.now() - 79200000), // 22 hours ago
    sentiment: 'neutral',
    isEdited: false
  }
];

const sampleNotifications: Omit<Notification, 'id'>[] = [
  {
    userId: 'user1',
    householdId: 'household1',
    type: 'chore_assigned',
    title: 'New Chore Assigned',
    message: 'You have been assigned: Clean Kitchen',
    isRead: false,
    actionUrl: '/chores',
    createdAt: new Date()
  },
  {
    userId: 'user2',
    householdId: 'household1',
    type: 'bill_due',
    title: 'Bill Due Soon',
    message: 'Internet bill is due in 3 days',
    isRead: false,
    actionUrl: '/bills',
    createdAt: new Date()
  }
];

const sampleHouseholdSettings: Omit<HouseholdSettings, 'householdId'>[] = [
  {
    rentReminders: {
      enabled: true,
      daysBeforeDue: 3
    },
    billReminders: {
      enabled: true,
      daysBeforeDue: 5
    },
    choreReminders: {
      enabled: true,
      frequency: 'daily'
    },
    sensorNudges: {
      enabled: true,
      types: ['motion', 'door', 'trash']
    },
    conflictCoaching: {
      enabled: true,
      autoTrigger: true,
      sentimentThreshold: 'medium'
    },
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }
];

class DatabaseSetup {
  private batch: ReturnType<typeof writeBatch>;
  private documentIds: Map<string, string> = new Map();

  constructor() {
    this.batch = writeBatch(db);
  }

  private async addDocument(collectionName: string, data: Record<string, unknown>, customId?: string): Promise<string> {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    if (customId) {
      this.documentIds.set(customId, docRef.id);
    }
    
    return docRef.id;
  }

  async checkIfDatabaseIsEmpty(): Promise<boolean> {
    try {
      // Check a few key collections
      const collections = ['households', 'users', 'chores', 'bills'];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return false; // Database has data
        }
      }
      
      return true; // Database is empty
    } catch (error) {
      console.error('Error checking database:', error);
      return true; // Assume empty if error
    }
  }

  async setupDatabase(): Promise<void> {
    console.log('Starting database setup...');
    
    const isEmpty = await this.checkIfDatabaseIsEmpty();
    if (!isEmpty) {
      console.log('Database already has data. Skipping setup.');
      return;
    }

    try {
      // For development, we'll create sample data with the current user
      // In a real app, you'd have multiple users joining households
      const currentUserId = 'current_user'; // This would be the actual Clerk user ID
      
      // Create sample users (in real app, these would be actual Clerk users)
      console.log('Creating sample users...');
      const sampleUserIds = ['user1', 'user2', 'user3'];
      
      for (let i = 0; i < 3; i++) {
        const userData = createSampleUsers(sampleUserIds)[i];
        const userId = await this.addDocument('users', userData, `user${i + 1}`);
        console.log(`Created user: ${userId}`);
      }

      // Create households
      console.log('Creating households...');
      const householdData = createSampleHouseholds(sampleUserIds)[0];
      const householdId = await this.addDocument('households', householdData, 'household1');
      console.log(`Created household: ${householdId}`);

      // Create rent schedules
      console.log('Creating rent schedules...');
      for (const schedule of sampleRentSchedules) {
        const scheduleId = await this.addDocument('rentSchedules', schedule);
        console.log(`Created rent schedule: ${scheduleId}`);
      }

      // Create rent payments
      console.log('Creating rent payments...');
      for (const payment of sampleRentPayments) {
        const paymentId = await this.addDocument('rentPayments', payment);
        console.log(`Created rent payment: ${paymentId}`);
      }

      // Create bills
      console.log('Creating bills...');
      for (let i = 0; i < sampleBills.length; i++) {
        const billId = await this.addDocument('bills', sampleBills[i], `bill${i + 1}`);
        console.log(`Created bill: ${billId}`);
      }

      // Create chores
      console.log('Creating chores...');
      for (let i = 0; i < sampleChores.length; i++) {
        const choreId = await this.addDocument('chores', sampleChores[i], `chore${i + 1}`);
        console.log(`Created chore: ${choreId}`);
      }

      // Create chore completions
      console.log('Creating chore completions...');
      for (const completion of sampleChoreCompletions) {
        const completionId = await this.addDocument('choreCompletions', completion);
        console.log(`Created chore completion: ${completionId}`);
      }

      // Create sensors
      console.log('Creating sensors...');
      for (let i = 0; i < sampleSensors.length; i++) {
        const sensorId = await this.addDocument('sensors', sampleSensors[i], `sensor${i + 1}`);
        console.log(`Created sensor: ${sensorId}`);
      }

      // Create sensor events
      console.log('Creating sensor events...');
      for (const event of sampleSensorEvents) {
        const eventId = await this.addDocument('sensorEvents', event);
        console.log(`Created sensor event: ${eventId}`);
      }

      // Create nudges
      console.log('Creating nudges...');
      for (const nudge of sampleNudges) {
        const nudgeId = await this.addDocument('nudges', nudge);
        console.log(`Created nudge: ${nudgeId}`);
      }

      // Create chat messages
      console.log('Creating chat messages...');
      for (const message of sampleChatMessages) {
        const messageId = await this.addDocument('chatMessages', message);
        console.log(`Created chat message: ${messageId}`);
      }

      // Create notifications
      console.log('Creating notifications...');
      for (const notification of sampleNotifications) {
        const notificationId = await this.addDocument('notifications', notification);
        console.log(`Created notification: ${notificationId}`);
      }

      // Create household settings
      console.log('Creating household settings...');
      for (let i = 0; i < sampleHouseholdSettings.length; i++) {
        const settingsId = await this.addDocument('householdSettings', {
          householdId: this.documentIds.get(`household${i + 1}`),
          ...sampleHouseholdSettings[i]
        });
        console.log(`Created household settings: ${settingsId}`);
      }

      console.log('Database setup completed successfully!');
      console.log('Created document IDs:', Object.fromEntries(this.documentIds));
      
    } catch (error) {
      console.error('Error setting up database:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    console.log('Clearing database...');
    
    const collections = [
      'users', 'households', 'rentSchedules', 'rentPayments', 'bills', 
      'chores', 'choreCompletions', 'sensors', 'sensorEvents', 'nudges', 
      'chatMessages', 'notifications', 'householdSettings'
    ];

    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`Cleared collection: ${collectionName}`);
      } catch (error) {
        console.error(`Error clearing ${collectionName}:`, error);
      }
    }
    
    console.log('Database cleared successfully!');
  }

  getCreatedIds(): Map<string, string> {
    return new Map(this.documentIds);
  }
}

// Create singleton instance
const databaseSetup = new DatabaseSetup();

// Export functions
export const setupDatabase = () => databaseSetup.setupDatabase();
export const clearDatabase = () => databaseSetup.clearDatabase();
export const checkDatabaseEmpty = () => databaseSetup.checkIfDatabaseIsEmpty();
export const getCreatedIds = () => databaseSetup.getCreatedIds();

export default databaseSetup; 