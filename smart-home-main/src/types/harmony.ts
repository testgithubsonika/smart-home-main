// Core types for the post-move-in harmony system

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  joinedAt: Date;
}

export interface Household {
  id: string;
  name: string;
  address: string;
  members: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
}

// Rent Management
export interface RentPayment {
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

export interface RentSchedule {
  id: string;
  householdId: string;
  monthlyAmount: number;
  dueDay: number; // Day of month (1-31)
  splitType: 'equal' | 'percentage' | 'fixed_amounts';
  splits: {
    userId: string;
    amount: number;
    percentage?: number;
  }[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

// Bills Management
export interface Bill {
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

// Chores Management
export interface Chore {
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

export interface ChoreCompletion {
  id: string;
  choreId: string;
  userId: string;
  completedAt: Date;
  verifiedBy?: string; // User ID who verified
  pointsEarned: number;
  notes?: string;
}

// Sensor-based Nudges
export interface Sensor {
  id: string;
  householdId: string;
  name: string;
  type: 'motion' | 'door' | 'trash' | 'dishwasher' | 'washer' | 'dryer' | 'temperature' | 'humidity';
  location: string;
  isActive: boolean;
  lastReading?: {
    value: unknown;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorEvent {
  id: string;
  sensorId: string;
  eventType: 'motion_detected' | 'door_opened' | 'trash_emptied' | 'appliance_completed' | 'threshold_exceeded';
  value?: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Nudge {
  id: string;
  householdId: string;
  title: string;
  message: string;
  type: 'chore_reminder' | 'bill_due' | 'rent_due' | 'sensor_triggered' | 'conflict_warning';
  priority: 'low' | 'medium' | 'high';
  targetUsers: string[]; // User IDs
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: Date;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Conflict Management
export interface ChatMessage {
  id: string;
  householdId: string;
  userId: string;
  content: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  isEdited: boolean;
  editedAt?: Date;
}

export interface ConflictAnalysis {
  id: string;
  householdId: string;
  triggerMessageId: string;
  analysis: {
    sentiment: 'positive' | 'neutral' | 'negative';
    severity: 'low' | 'medium' | 'high';
    topics: string[];
    suggestions: string[];
  };
  isResolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ConflictCoachSession {
  id: string;
  householdId: string;
  participants: string[]; // User IDs
  topic: string;
  status: 'active' | 'completed' | 'cancelled';
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  suggestions: string[];
  startedAt: Date;
  endedAt?: Date;
}

// Dashboard Data
export interface DashboardStats {
  householdId: string;
  rent: {
    totalDue: number;
    totalPaid: number;
    overdueAmount: number;
    nextDueDate: Date;
  };
  bills: {
    totalDue: number;
    totalPaid: number;
    overdueCount: number;
    upcomingDue: Date[];
  };
  chores: {
    pendingCount: number;
    completedThisWeek: number;
    totalPoints: number;
    leaderboard: {
      userId: string;
      points: number;
      completedChores: number;
    }[];
  };
  conflicts: {
    activeSessions: number;
    resolvedThisWeek: number;
    averageSentiment: 'positive' | 'neutral' | 'negative';
  };
  sensors: {
    activeCount: number;
    recentEvents: number;
    triggeredNudges: number;
  };
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  householdId: string;
  type: 'rent_due' | 'bill_due' | 'chore_assigned' | 'chore_completed' | 'conflict_detected' | 'nudge_received';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Settings
export interface HouseholdSettings {
  householdId: string;
  rentReminders: {
    enabled: boolean;
    daysBeforeDue: number;
  };
  billReminders: {
    enabled: boolean;
    daysBeforeDue: number;
  };
  choreReminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
  };
  sensorNudges: {
    enabled: boolean;
    types: string[];
  };
  conflictCoaching: {
    enabled: boolean;
    autoTrigger: boolean;
    sentimentThreshold: 'low' | 'medium' | 'high';
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
} 