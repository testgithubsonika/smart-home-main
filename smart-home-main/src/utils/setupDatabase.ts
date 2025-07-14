import { supabase, supabaseAdmin } from '@/lib/supabase';
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
    status: 'pending',
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
    status: 'pending',
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
      value: { motion: true, timestamp: Date.now() },
      timestamp: new Date()
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    name: 'Living Room Temperature Sensor',
    type: 'temperature',
    location: 'Living Room',
    isActive: true,
    lastReading: {
      value: { temperature: 72, humidity: 45 },
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
      value: { open: false, timestamp: Date.now() },
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
    value: { duration: 45, intensity: 'medium' },
    timestamp: new Date('2024-01-15T08:30:00Z'),
    metadata: { duration: 45, intensity: 'medium' }
  },
  {
    sensorId: 'sensor2',
    eventType: 'threshold_exceeded',
    value: { temperature: 72, humidity: 45 },
    timestamp: new Date('2024-01-15T12:00:00Z'),
    metadata: { temperature: 72, humidity: 45 }
  },
  {
    sensorId: 'sensor3',
    eventType: 'door_opened',
    value: { openDuration: 300 },
    timestamp: new Date('2024-01-15T18:45:00Z'),
    metadata: { openDuration: 300 }
  }
];

const sampleNudges: Omit<Nudge, 'id'>[] = [
  {
    householdId: 'household1',
    title: 'Kitchen Cleanup Reminder',
    message: 'The kitchen motion sensor detected activity. Consider cleaning up after cooking!',
    type: 'chore_reminder',
    priority: 'medium',
    targetUsers: ['user1', 'user2', 'user3'],
    isRead: false,
    isDismissed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    actionUrl: '/harmony-hub?tab=chores',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    householdId: 'household1',
    title: 'Rent Payment Overdue',
    message: 'Your rent payment is overdue. Please submit payment as soon as possible.',
    type: 'rent_due',
    priority: 'high',
    targetUsers: ['user3'],
    isRead: false,
    isDismissed: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    actionUrl: '/harmony-hub?tab=rent',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleChatMessages: Omit<ChatMessage, 'id'>[] = [
  {
    householdId: 'household1',
    userId: 'user1',
    content: 'Hey everyone! I cleaned the kitchen this morning. All set for the day!',
    timestamp: new Date('2024-01-15T08:00:00Z'),
    sentiment: 'positive',
    isEdited: false
  },
  {
    householdId: 'household1',
    userId: 'user2',
    content: 'Thanks Alex! I\'ll handle the living room vacuuming this evening.',
    timestamp: new Date('2024-01-15T08:05:00Z'),
    sentiment: 'positive',
    isEdited: false
  },
  {
    householdId: 'household1',
    userId: 'user3',
    content: 'I\'m a bit behind on rent this month. Can we talk about a payment plan?',
    timestamp: new Date('2024-01-15T08:10:00Z'),
    sentiment: 'neutral',
    isEdited: false
  },
  {
    householdId: 'household1',
    userId: 'user1',
    content: 'No worries Jordan, we can work something out. Let\'s discuss it tonight.',
    timestamp: new Date('2024-01-15T08:15:00Z'),
    sentiment: 'positive',
    isEdited: false
  }
];

const sampleNotifications: Omit<Notification, 'id'>[] = [
  {
    userId: 'user1',
    householdId: 'household1',
    type: 'chore_completed',
    title: 'Chore Completed',
    message: 'Sam completed the living room vacuuming chore',
    isRead: false,
    actionUrl: '/harmony-hub?tab=chores',
    metadata: {
      choreId: 'chore2',
      completedBy: 'user2'
    },
    createdAt: new Date('2024-01-10T14:30:00Z')
  },
  {
    userId: 'user3',
    householdId: 'household1',
    type: 'rent_due',
    title: 'Rent Payment Overdue',
    message: 'Your rent payment is overdue. Please submit payment.',
    isRead: false,
    actionUrl: '/harmony-hub?tab=rent',
    metadata: {
      amount: 933.34,
      dueDate: '2024-01-01'
    },
    createdAt: new Date('2024-01-02T00:00:00Z')
  }
];

const sampleHouseholdSettings: Omit<HouseholdSettings, 'id'> = {
  householdId: 'household1',
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
};

class DatabaseSetup {
  private documentIds: Map<string, string> = new Map();

  constructor() {
    // Initialize with empty map
  }

  private async insertRecord(tableName: string, data: Record<string, unknown>, customId?: string): Promise<string> {
    try {
      // Use admin client to bypass RLS for setup operations
      const client = supabaseAdmin || supabase;
      
      const { data: result, error } = await client
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        throw error;
      }

      const recordId = result.id;
      if (customId) {
        this.documentIds.set(customId, recordId);
      }
      
      return recordId;
    } catch (error) {
      console.error(`Failed to insert record into ${tableName}:`, error);
      throw error;
    }
  }

  async checkIfDatabaseIsEmpty(): Promise<boolean> {
    try {
      // Use admin client to bypass RLS for setup operations
      const client = supabaseAdmin || supabase;
      
      // Check if households table is empty
      const { data: households, error } = await client
        .from('households')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error checking database:', error);
        throw error;
      }

      return !households || households.length === 0;
    } catch (error) {
      console.error('Failed to check database status:', error);
      return true; // Assume empty if we can't check
    }
  }

  async setupDatabase(): Promise<void> {
    try {
      console.log('Starting database setup...');

      // Check if database is already populated
      const isEmpty = await this.checkIfDatabaseIsEmpty();
      if (!isEmpty) {
        console.log('Database already contains data. Skipping setup.');
        return;
      }

      // Create sample household
      console.log('Creating sample household...');
      const householdData = createSampleHouseholds(['user1', 'user2', 'user3'])[0];
      const { createdAt, updatedAt, ...householdDataWithoutDates } = householdData;
      const householdId = await this.insertRecord('households', {
        ...householdDataWithoutDates,
        created_at: createdAt.toISOString(),
        updated_at: updatedAt.toISOString()
      }, 'household1');
      console.log('✓ Household created:', householdId);

      // Create rent schedules
      console.log('Creating rent schedules...');
      for (const schedule of sampleRentSchedules) {
        await this.insertRecord('rent_schedules', {
          ...schedule,
          household_id: householdId,
          start_date: schedule.startDate.toISOString(),
          end_date: schedule.endDate?.toISOString()
        });
      }
      console.log('✓ Rent schedules created');

      // Create rent payments
      console.log('Creating rent payments...');
      for (const payment of sampleRentPayments) {
        const { createdAt, updatedAt, dueDate, paidDate, ...paymentDataWithoutDates } = payment;
        await this.insertRecord('rent_payments', {
          ...paymentDataWithoutDates,
          due_date: dueDate.toISOString(),
          paid_date: paidDate?.toISOString(),
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        });
      }
      console.log('✓ Rent payments created');

      // Create bills
      console.log('Creating bills...');
      for (const bill of sampleBills) {
        const { createdAt, updatedAt, dueDate, paidDate, ...billDataWithoutDates } = bill;
        await this.insertRecord('bills', {
          ...billDataWithoutDates,
          due_date: dueDate.toISOString(),
          paid_date: paidDate?.toISOString(),
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        });
      }
      console.log('✓ Bills created');

      // Create chores
      console.log('Creating chores...');
      const choreIds: string[] = [];
      for (let i = 0; i < sampleChores.length; i++) {
        const chore = sampleChores[i];
        const { createdAt, updatedAt, dueDate, completedDate, ...choreDataWithoutDates } = chore;
        const choreId = await this.insertRecord('chores', {
          ...choreDataWithoutDates,
          due_date: dueDate?.toISOString(),
          completed_date: completedDate?.toISOString(),
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        }, `chore${i + 1}`);
        choreIds.push(choreId);
      }
      console.log('✓ Chores created');

      // Create chore completions
      console.log('Creating chore completions...');
      for (const completion of sampleChoreCompletions) {
        await this.insertRecord('chore_completions', {
          ...completion,
          chore_id: this.documentIds.get(completion.choreId) || completion.choreId,
          completed_at: completion.completedAt.toISOString()
        });
      }
      console.log('✓ Chore completions created');

      // Create sensors
      console.log('Creating sensors...');
      const sensorIds: string[] = [];
      for (let i = 0; i < sampleSensors.length; i++) {
        const sensor = sampleSensors[i];
        const { createdAt, updatedAt, lastReading, ...sensorDataWithoutDates } = sensor;
        const sensorId = await this.insertRecord('sensors', {
          ...sensorDataWithoutDates,
          last_reading: lastReading,
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        }, `sensor${i + 1}`);
        sensorIds.push(sensorId);
      }
      console.log('✓ Sensors created');

      // Create sensor events
      console.log('Creating sensor events...');
      for (const event of sampleSensorEvents) {
                 await this.insertRecord('sensor_events', {
           ...event,
           sensor_id: this.documentIds.get(event.sensorId) || event.sensorId,
           timestamp: event.timestamp.toISOString()
         });
      }
      console.log('✓ Sensor events created');

      // Create nudges
      console.log('Creating nudges...');
      for (const nudge of sampleNudges) {
        const { createdAt, updatedAt, expiresAt, ...nudgeDataWithoutDates } = nudge;
        await this.insertRecord('nudges', {
          ...nudgeDataWithoutDates,
          expires_at: expiresAt?.toISOString(),
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        });
      }
      console.log('✓ Nudges created');

      // Create chat messages
      console.log('Creating chat messages...');
      for (const message of sampleChatMessages) {
                 await this.insertRecord('chat_messages', {
           ...message,
           household_id: householdId,
           timestamp: message.timestamp.toISOString()
         });
      }
      console.log('✓ Chat messages created');

      // Create notifications
      console.log('Creating notifications...');
      for (const notification of sampleNotifications) {
        const { createdAt, ...notificationDataWithoutDates } = notification;
        await this.insertRecord('notifications', {
          ...notificationDataWithoutDates,
          created_at: createdAt.toISOString()
        });
      }
      console.log('✓ Notifications created');

      // Create household settings
      console.log('Creating household settings...');
             await this.insertRecord('household_settings', {
         ...sampleHouseholdSettings,
         household_id: householdId
       });
      console.log('✓ Household settings created');

      console.log('✓ Database setup completed successfully!');
      console.log('Created IDs:', Object.fromEntries(this.documentIds));
    } catch (error) {
      console.error('Database setup failed:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      console.log('Clearing database...');
      
      // Use admin client to bypass RLS for setup operations
      const client = supabaseAdmin || supabase;
      
      const tables = [
        'notifications',
        'chat_messages',
        'nudges',
        'sensor_events',
        'sensors',
        'chore_completions',
        'chores',
        'bills',
        'rent_schedules',
        'rent_payments',
        'household_settings',
        'households'
      ];

      for (const table of tables) {
        const { error } = await client
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

        if (error) {
          console.error(`Error clearing ${table}:`, error);
        } else {
          console.log(`✓ Cleared ${table}`);
        }
      }

      this.documentIds.clear();
      console.log('✓ Database cleared successfully!');
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw error;
    }
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