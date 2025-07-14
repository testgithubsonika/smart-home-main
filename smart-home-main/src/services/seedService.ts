import { supabase } from '@/lib/supabase';
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const sampleChores = [
  {
    household_id: 'household1',
    title: 'Clean Kitchen',
    description: 'Wipe counters, clean sink, take out trash',
    assigned_to: 'user1',
    assigned_by: 'user1',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'medium',
    category: 'cleaning',
    points: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    household_id: 'household1',
    title: 'Take out Trash',
    description: 'Empty all trash bins and recycling',
    assigned_to: 'user2',
    assigned_by: 'user1',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'high',
    category: 'cleaning',
    points: 5,
    recurring: {
      frequency: 'weekly',
      interval: 1
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    household_id: 'household1',
    title: 'Vacuum Living Room',
    description: 'Vacuum carpets and clean surfaces',
    assigned_to: 'user3',
    assigned_by: 'user1',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'low',
    category: 'cleaning',
    points: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const sampleBills = [
  {
    household_id: 'household1',
    name: 'Electricity Bill',
    amount: 120.50,
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    category: 'electricity',
    paid_by: null,
    split_between: ['user1', 'user2', 'user3'],
    notes: 'Monthly electricity bill',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    household_id: 'household1',
    name: 'Internet Bill',
    amount: 89.99,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    category: 'internet',
    paid_by: null,
    split_between: ['user1', 'user2', 'user3'],
    notes: 'Monthly internet service',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const sampleSensors = [
  {
    household_id: 'household1',
    name: 'Kitchen Motion Sensor',
    type: 'motion',
    location: 'kitchen',
    is_active: true,
    last_reading: {
      value: { motion: true, timestamp: Date.now() },
      timestamp: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    household_id: 'household1',
    name: 'Living Room Temperature',
    type: 'temperature',
    location: 'living_room',
    is_active: true,
    last_reading: {
      value: { temperature: 72, humidity: 45 },
      timestamp: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    household_id: 'household1',
    name: 'Front Door Sensor',
    type: 'door',
    location: 'front_door',
    is_active: true,
    last_reading: {
      value: { open: false, timestamp: Date.now() },
      timestamp: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const sampleNudges = [
  {
    household_id: 'household1',
    title: 'Kitchen Cleanup Reminder',
    message: 'The kitchen motion sensor detected activity. Consider cleaning up after cooking!',
    type: 'chore_reminder',
    priority: 'medium',
    target_users: ['user1', 'user2', 'user3'],
    is_read: false,
    is_dismissed: false,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    action_url: '/harmony-hub?tab=chores',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const sampleChatMessages = [
  {
    household_id: 'household1',
    user_id: 'user1',
    content: 'Hey everyone! I just cleaned the kitchen. All done! 🧹',
    timestamp: new Date().toISOString(),
    sentiment: 'positive',
    is_edited: false,
    created_at: new Date().toISOString()
  },
  {
    household_id: 'household1',
    user_id: 'user2',
    content: 'Thanks Alex! Looks great 👍',
    timestamp: new Date().toISOString(),
    sentiment: 'positive',
    is_edited: false,
    created_at: new Date().toISOString()
  }
];

const sampleNotifications = [
  {
    user_id: 'user1',
    household_id: 'household1',
    type: 'chore_completed',
    title: 'Chore Completed',
    message: 'Kitchen cleaning task has been completed by Alex',
    is_read: false,
    action_url: '/harmony-hub?tab=chores',
    metadata: { choreId: 'chore1', completedBy: 'user1' },
    created_at: new Date().toISOString()
  }
];

const sampleHouseholdSettings = {
  household_id: 'household1',
  rent_settings: {
    split_method: 'equal',
    grace_period: 3,
    late_fees: 25
  },
  chore_settings: {
    point_system: true,
    auto_assign: false,
    reminder_frequency: 'daily'
  },
  notification_settings: {
    email_notifications: true,
    push_notifications: true,
    quiet_hours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    }
  },
  conflict_resolution: {
    auto_coach_enabled: true,
    sentiment_threshold: 0.3,
    escalation_delay: 24
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export class SeedService {
  private documentIds: Map<string, string> = new Map();

  constructor() {
    // Initialize with empty map
  }

  async seedHouseholds(): Promise<void> {
    console.log('Seeding households...');
    
    for (const household of sampleHouseholds) {
      const { data, error } = await supabase
        .from('households')
        .insert(household)
        .select()
        .single();

      if (error) {
        console.error('Error seeding household:', error);
        throw error;
      }

      this.documentIds.set('household1', data.id);
      console.log('Household seeded:', data.id);
    }
  }

  async seedChores(): Promise<void> {
    console.log('Seeding chores...');
    
    for (const chore of sampleChores) {
      const { data, error } = await supabase
        .from('chores')
        .insert(chore)
        .select()
        .single();

      if (error) {
        console.error('Error seeding chore:', error);
        throw error;
      }

      console.log('Chore seeded:', data.id);
    }
  }

  async seedBills(): Promise<void> {
    console.log('Seeding bills...');
    
    for (const bill of sampleBills) {
      const { data, error } = await supabase
        .from('bills')
        .insert(bill)
        .select()
        .single();

      if (error) {
        console.error('Error seeding bill:', error);
        throw error;
      }

      console.log('Bill seeded:', data.id);
    }
  }

  async seedSensors(): Promise<void> {
    console.log('Seeding sensors...');
    
    for (const sensor of sampleSensors) {
      const { data, error } = await supabase
        .from('sensors')
        .insert(sensor)
        .select()
        .single();

      if (error) {
        console.error('Error seeding sensor:', error);
        throw error;
      }

      console.log('Sensor seeded:', data.id);
    }
  }

  async seedNudges(): Promise<void> {
    console.log('Seeding nudges...');
    
    for (const nudge of sampleNudges) {
      const { data, error } = await supabase
        .from('nudges')
        .insert(nudge)
        .select()
        .single();

      if (error) {
        console.error('Error seeding nudge:', error);
        throw error;
      }

      console.log('Nudge seeded:', data.id);
    }
  }

  async seedChatMessages(): Promise<void> {
    console.log('Seeding chat messages...');
    
    for (const message of sampleChatMessages) {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('Error seeding chat message:', error);
        throw error;
      }

      console.log('Chat message seeded:', data.id);
    }
  }

  async seedNotifications(): Promise<void> {
    console.log('Seeding notifications...');
    
    for (const notification of sampleNotifications) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) {
        console.error('Error seeding notification:', error);
        throw error;
      }

      console.log('Notification seeded:', data.id);
    }
  }

  async seedHouseholdSettings(): Promise<void> {
    console.log('Seeding household settings...');
    
    const { data, error } = await supabase
      .from('household_settings')
      .insert(sampleHouseholdSettings)
      .select()
      .single();

    if (error) {
      console.error('Error seeding household settings:', error);
      throw error;
    }

    console.log('Household settings seeded:', data.id);
  }

  async seedAll(): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
      // Seed in order to maintain referential integrity
      await this.seedHouseholds();
      await this.seedChores();
      await this.seedBills();
      await this.seedSensors();
      await this.seedNudges();
      await this.seedChatMessages();
      await this.seedNotifications();
      await this.seedHouseholdSettings();
      
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }

  async seedSpecificCollection(collectionName: string): Promise<void> {
    console.log(`Seeding ${collectionName}...`);
    
    switch (collectionName) {
      case 'households':
        await this.seedHouseholds();
        break;
      case 'chores':
        await this.seedChores();
        break;
      case 'bills':
        await this.seedBills();
        break;
      case 'sensors':
        await this.seedSensors();
        break;
      case 'nudges':
        await this.seedNudges();
        break;
      case 'chat_messages':
        await this.seedChatMessages();
        break;
      case 'notifications':
        await this.seedNotifications();
        break;
      case 'household_settings':
        await this.seedHouseholdSettings();
        break;
      default:
        throw new Error(`Unknown collection: ${collectionName}`);
    }
  }

  async clearAllData(): Promise<void> {
    console.log('Clearing all data...');
    
    const collections = [
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

    for (const collection of collections) {
      const { error } = await supabase
        .from(collection)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

      if (error) {
        console.error(`Error clearing ${collection}:`, error);
      } else {
        console.log(`Cleared ${collection}`);
      }
    }

    this.documentIds.clear();
    console.log('All data cleared successfully!');
  }

  getSeededIds(): Map<string, string> {
    return new Map(this.documentIds);
  }
}

// Export singleton instance
export const seedService = new SeedService();

// Export convenience functions
export const seedDatabase = () => seedService.seedAll();
export const seedSpecificCollection = (collectionName: string) => seedService.seedSpecificCollection(collectionName);
export const clearAllData = () => seedService.clearAllData(); 