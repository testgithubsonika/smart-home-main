import { 
  collection, 
  doc, 
  addDoc, 
  writeBatch,
  serverTimestamp,
  Timestamp 
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
  HouseholdSettings
} from '@/types/harmony';

// Sample data for seeding
const sampleUsers = [
  {
    id: 'user1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    preferences: {
      notifications: true,
      emailAlerts: true,
      theme: 'light'
    }
  },
  {
    id: 'user2',
    name: 'Sam Chen',
    email: 'sam@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    preferences: {
      notifications: true,
      emailAlerts: false,
      theme: 'dark'
    }
  },
  {
    id: 'user3',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    preferences: {
      notifications: false,
      emailAlerts: true,
      theme: 'light'
    }
  }
];

const sampleHouseholds = [
  {
    name: 'Sunset Apartments #302',
    address: '123 Sunset Blvd, Apt 302, Los Angeles, CA 90210',
    description: 'Modern 3-bedroom apartment with city views',
    rentAmount: 2800,
    rentDueDay: 1,
    memberIds: ['user1', 'user2', 'user3'],
    adminId: 'user1',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleRentSchedules = [
  {
    householdId: 'household1',
    amount: 2800,
    dueDay: 1,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleRentPayments = [
  {
    householdId: 'household1',
    userId: 'user1',
    amount: 933.33,
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2024-01-01'),
    status: 'paid',
    method: 'bank_transfer',
    notes: 'January rent payment',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user2',
    amount: 933.33,
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2024-01-02'),
    status: 'paid',
    method: 'credit_card',
    notes: 'January rent payment',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user3',
    amount: 933.34,
    dueDate: new Date('2024-01-01'),
    paidDate: null,
    status: 'overdue',
    method: 'pending',
    notes: 'January rent payment - overdue',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleBills = [
  {
    householdId: 'household1',
    name: 'Electricity',
    amount: 120.50,
    dueDate: new Date('2024-01-15'),
    category: 'utilities',
    status: 'unpaid',
    assignedTo: 'user1',
    notes: 'Monthly electricity bill',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    name: 'Internet',
    amount: 89.99,
    dueDate: new Date('2024-01-20'),
    category: 'utilities',
    status: 'paid',
    assignedTo: 'user2',
    notes: 'Monthly internet bill',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    name: 'Water',
    amount: 45.00,
    dueDate: new Date('2024-01-25'),
    category: 'utilities',
    status: 'unpaid',
    assignedTo: 'user3',
    notes: 'Monthly water bill',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleChores = [
  {
    householdId: 'household1',
    title: 'Clean Kitchen',
    description: 'Wipe counters, clean sink, take out trash',
    assignedTo: 'user1',
    frequency: 'daily',
    points: 10,
    status: 'pending',
    dueDate: new Date('2024-01-15'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    title: 'Vacuum Living Room',
    description: 'Vacuum carpets and clean surfaces',
    assignedTo: 'user2',
    frequency: 'weekly',
    points: 15,
    status: 'completed',
    dueDate: new Date('2024-01-10'),
    completedDate: new Date('2024-01-10'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    title: 'Take Out Recycling',
    description: 'Sort and take out recycling bins',
    assignedTo: 'user3',
    frequency: 'weekly',
    points: 8,
    status: 'pending',
    dueDate: new Date('2024-01-16'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    title: 'Clean Bathroom',
    description: 'Clean toilet, sink, and shower',
    assignedTo: 'user1',
    frequency: 'weekly',
    points: 20,
    status: 'pending',
    dueDate: new Date('2024-01-18'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleChoreCompletions = [
  {
    householdId: 'household1',
    choreId: 'chore2',
    userId: 'user2',
    completedAt: new Date('2024-01-10T14:30:00Z'),
    points: 15,
    notes: 'Completed vacuuming and dusting',
    createdAt: serverTimestamp()
  }
];

const sampleSensors = [
  {
    householdId: 'household1',
    name: 'Kitchen Motion Sensor',
    type: 'motion',
    location: 'kitchen',
    isActive: true,
    settings: {
      sensitivity: 'medium',
      triggerDelay: 30,
      notifications: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    name: 'Living Room Motion Sensor',
    type: 'motion',
    location: 'living_room',
    isActive: true,
    settings: {
      sensitivity: 'high',
      triggerDelay: 15,
      notifications: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    name: 'Bathroom Door Sensor',
    type: 'door',
    location: 'bathroom',
    isActive: true,
    settings: {
      notifications: false,
      autoLog: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleSensorEvents = [
  {
    sensorId: 'sensor1',
    type: 'motion_detected',
    timestamp: new Date('2024-01-15T08:30:00Z'),
    data: {
      duration: 45,
      intensity: 'medium'
    },
    createdAt: serverTimestamp()
  },
  {
    sensorId: 'sensor2',
    type: 'motion_detected',
    timestamp: new Date('2024-01-15T19:15:00Z'),
    data: {
      duration: 120,
      intensity: 'high'
    },
    createdAt: serverTimestamp()
  },
  {
    sensorId: 'sensor3',
    type: 'door_opened',
    timestamp: new Date('2024-01-15T20:45:00Z'),
    data: {
      openDuration: 300
    },
    createdAt: serverTimestamp()
  }
];

const sampleNudges = [
  {
    householdId: 'household1',
    userId: 'user1',
    type: 'chore_reminder',
    title: 'Kitchen Cleaning Due',
    message: 'Your kitchen cleaning chore is due today. Don\'t forget to wipe the counters!',
    priority: 'medium',
    isRead: false,
    isDismissed: false,
    expiresAt: new Date('2024-01-16T23:59:59Z'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user3',
    type: 'rent_reminder',
    title: 'Rent Payment Overdue',
    message: 'Your rent payment is overdue. Please submit payment as soon as possible.',
    priority: 'high',
    isRead: false,
    isDismissed: false,
    expiresAt: new Date('2024-01-20T23:59:59Z'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user2',
    type: 'bill_reminder',
    title: 'Internet Bill Due Soon',
    message: 'Your internet bill is due in 3 days. Amount: $89.99',
    priority: 'medium',
    isRead: true,
    isDismissed: false,
    expiresAt: new Date('2024-01-23T23:59:59Z'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const sampleChatMessages = [
  {
    householdId: 'household1',
    userId: 'user1',
    content: 'Hey everyone! I cleaned the kitchen this morning. All set for the day!',
    type: 'text',
    timestamp: new Date('2024-01-15T08:00:00Z'),
    createdAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user2',
    content: 'Thanks Alex! I\'ll handle the living room vacuuming this evening.',
    type: 'text',
    timestamp: new Date('2024-01-15T08:05:00Z'),
    createdAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user3',
    content: 'I\'m a bit behind on rent this month. Can we talk about a payment plan?',
    type: 'text',
    timestamp: new Date('2024-01-15T08:10:00Z'),
    createdAt: serverTimestamp()
  },
  {
    householdId: 'household1',
    userId: 'user1',
    content: 'No worries Jordan, we can work something out. Let\'s discuss it tonight.',
    type: 'text',
    timestamp: new Date('2024-01-15T08:15:00Z'),
    createdAt: serverTimestamp()
  }
];

const sampleNotifications = [
  {
    userId: 'user1',
    type: 'chore_completed',
    title: 'Chore Completed',
    message: 'Sam completed the living room vacuuming chore',
    isRead: false,
    data: {
      choreId: 'chore2',
      completedBy: 'user2'
    },
    createdAt: serverTimestamp()
  },
  {
    userId: 'user3',
    type: 'rent_overdue',
    title: 'Rent Payment Overdue',
    message: 'Your rent payment is overdue. Please submit payment.',
    isRead: false,
    data: {
      amount: 933.34,
      dueDate: '2024-01-01'
    },
    createdAt: serverTimestamp()
  }
];

const sampleHouseholdSettings = {
  householdId: 'household1',
  rentSettings: {
    splitMethod: 'equal',
    gracePeriod: 3,
    lateFees: 25
  },
  choreSettings: {
    pointSystem: true,
    autoAssign: false,
    reminderFrequency: 'daily'
  },
  notificationSettings: {
    emailNotifications: true,
    pushNotifications: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    }
  },
  conflictResolution: {
    autoCoachEnabled: true,
    sentimentThreshold: 0.3,
    escalationDelay: 24
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

export class SeedService {
  private batch: ReturnType<typeof writeBatch>;
  private documentIds: Map<string, string> = new Map();

  constructor() {
    this.batch = writeBatch(db);
  }

  private async addDocument(collectionName: string, data: Record<string, unknown>, customId?: string): Promise<string> {
    const docRef = doc(collection(db, collectionName));
    const docId = customId || docRef.id;
    
    this.batch.set(docRef, {
      ...data,
      id: docId
    });
    
    this.documentIds.set(customId || collectionName, docId);
    return docId;
  }

  async seedAllData(): Promise<void> {
    try {
      console.log('Starting database seeding...');

      // Seed households
      const householdId = await this.addDocument('households', sampleHouseholds[0], 'household1');
      console.log('✓ Seeded households');

      // Seed rent schedules
      await this.addDocument('rentSchedules', {
        ...sampleRentSchedules[0],
        householdId
      }, 'rentSchedule1');
      console.log('✓ Seeded rent schedules');

      // Seed rent payments
      for (let i = 0; i < sampleRentPayments.length; i++) {
        await this.addDocument('rentPayments', {
          ...sampleRentPayments[i],
          householdId
        }, `rentPayment${i + 1}`);
      }
      console.log('✓ Seeded rent payments');

      // Seed bills
      for (let i = 0; i < sampleBills.length; i++) {
        await this.addDocument('bills', {
          ...sampleBills[i],
          householdId
        }, `bill${i + 1}`);
      }
      console.log('✓ Seeded bills');

      // Seed chores
      for (let i = 0; i < sampleChores.length; i++) {
        await this.addDocument('chores', {
          ...sampleChores[i],
          householdId
        }, `chore${i + 1}`);
      }
      console.log('✓ Seeded chores');

      // Seed chore completions
      for (let i = 0; i < sampleChoreCompletions.length; i++) {
        await this.addDocument('choreCompletions', {
          ...sampleChoreCompletions[i],
          householdId
        }, `choreCompletion${i + 1}`);
      }
      console.log('✓ Seeded chore completions');

      // Seed sensors
      for (let i = 0; i < sampleSensors.length; i++) {
        await this.addDocument('sensors', {
          ...sampleSensors[i],
          householdId
        }, `sensor${i + 1}`);
      }
      console.log('✓ Seeded sensors');

      // Seed sensor events
      for (let i = 0; i < sampleSensorEvents.length; i++) {
        await this.addDocument('sensorEvents', {
          ...sampleSensorEvents[i],
          householdId
        }, `sensorEvent${i + 1}`);
      }
      console.log('✓ Seeded sensor events');

      // Seed nudges
      for (let i = 0; i < sampleNudges.length; i++) {
        await this.addDocument('nudges', {
          ...sampleNudges[i],
          householdId
        }, `nudge${i + 1}`);
      }
      console.log('✓ Seeded nudges');

      // Seed chat messages
      for (let i = 0; i < sampleChatMessages.length; i++) {
        await this.addDocument('chatMessages', {
          ...sampleChatMessages[i],
          householdId
        }, `chatMessage${i + 1}`);
      }
      console.log('✓ Seeded chat messages');

      // Seed notifications
      for (let i = 0; i < sampleNotifications.length; i++) {
        await this.addDocument('notifications', sampleNotifications[i], `notification${i + 1}`);
      }
      console.log('✓ Seeded notifications');

      // Seed household settings
      await this.addDocument('householdSettings', {
        ...sampleHouseholdSettings,
        householdId
      }, 'householdSettings1');
      console.log('✓ Seeded household settings');

      // Commit all changes
      await this.batch.commit();
      console.log('✓ All data seeded successfully!');

      return this.documentIds;
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }

  async seedSpecificData(dataType: string): Promise<void> {
    try {
      console.log(`Seeding ${dataType}...`);

      switch (dataType) {
        case 'households': {
          const householdId = await this.addDocument('households', sampleHouseholds[0], 'household1');
          console.log('✓ Seeded households');
          break;
        }

        case 'chores': {
          const householdIdForChores = this.documentIds.get('household1') || 'household1';
          for (let i = 0; i < sampleChores.length; i++) {
            await this.addDocument('chores', {
              ...sampleChores[i],
              householdId: householdIdForChores
            }, `chore${i + 1}`);
          }
          console.log('✓ Seeded chores');
          break;
        }

        case 'bills': {
          const householdIdForBills = this.documentIds.get('household1') || 'household1';
          for (let i = 0; i < sampleBills.length; i++) {
            await this.addDocument('bills', {
              ...sampleBills[i],
              householdId: householdIdForBills
            }, `bill${i + 1}`);
          }
          console.log('✓ Seeded bills');
          break;
        }

        case 'sensors': {
          const householdIdForSensors = this.documentIds.get('household1') || 'household1';
          for (let i = 0; i < sampleSensors.length; i++) {
            await this.addDocument('sensors', {
              ...sampleSensors[i],
              householdId: householdIdForSensors
            }, `sensor${i + 1}`);
          }
          console.log('✓ Seeded sensors');
          break;
        }

        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      await this.batch.commit();
      console.log(`✓ ${dataType} seeded successfully!`);
    } catch (error) {
      console.error(`Error seeding ${dataType}:`, error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      console.log('Clearing all seeded data...');
      
      // Note: This is a simplified version. In production, you'd want to be more careful
      // about what data to delete and ensure proper cleanup
      
      const collections = [
        'households', 'rentSchedules', 'rentPayments', 'bills', 'chores',
        'choreCompletions', 'sensors', 'sensorEvents', 'nudges', 'chatMessages',
        'notifications', 'householdSettings'
      ];

      for (const collectionName of collections) {
        // In a real implementation, you'd query for documents and delete them
        // For now, we'll just log that this would happen
        console.log(`Would clear collection: ${collectionName}`);
      }

      console.log('✓ Data clearing completed (simulated)');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  getSeededIds(): Map<string, string> {
    return this.documentIds;
  }
}

// Export singleton instance
export const seedService = new SeedService();

// Convenience functions
export const seedDatabase = () => seedService.seedAllData();
export const seedSpecificCollection = (dataType: string) => seedService.seedSpecificData(dataType);
export const clearDatabase = () => seedService.clearAllData(); 