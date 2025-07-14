import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Service role client for database setup operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Export types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          address: string;
          members: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          members: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          members?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      rent_payments: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          amount: number;
          due_date: string;
          paid_date?: string;
          status: 'pending' | 'paid' | 'overdue' | 'partial';
          method?: 'bank_transfer' | 'cash' | 'check' | 'digital';
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          amount: number;
          due_date: string;
          paid_date?: string;
          status?: 'pending' | 'paid' | 'overdue' | 'partial';
          method?: 'bank_transfer' | 'cash' | 'check' | 'digital';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          amount?: number;
          due_date?: string;
          paid_date?: string;
          status?: 'pending' | 'paid' | 'overdue' | 'partial';
          method?: 'bank_transfer' | 'cash' | 'check' | 'digital';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bills: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          amount: number;
          due_date: string;
          paid_date?: string;
          status: 'pending' | 'paid' | 'overdue';
          category: 'electricity' | 'water' | 'gas' | 'internet' | 'trash' | 'other';
          paid_by?: string;
          split_between: string[];
          receipt_url?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          amount: number;
          due_date: string;
          paid_date?: string;
          status?: 'pending' | 'paid' | 'overdue';
          category: 'electricity' | 'water' | 'gas' | 'internet' | 'trash' | 'other';
          paid_by?: string;
          split_between: string[];
          receipt_url?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          amount?: number;
          due_date?: string;
          paid_date?: string;
          status?: 'pending' | 'paid' | 'overdue';
          category?: 'electricity' | 'water' | 'gas' | 'internet' | 'trash' | 'other';
          paid_by?: string;
          split_between?: string[];
          receipt_url?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chores: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description?: string;
          assigned_to?: string;
          assigned_by?: string;
          due_date?: string;
          completed_date?: string;
          status: 'pending' | 'in_progress' | 'completed' | 'overdue';
          priority: 'low' | 'medium' | 'high';
          category: 'cleaning' | 'maintenance' | 'shopping' | 'cooking' | 'other';
          points: number;
          recurring?: {
            frequency: 'daily' | 'weekly' | 'monthly';
            interval: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description?: string;
          assigned_to?: string;
          assigned_by?: string;
          due_date?: string;
          completed_date?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
          priority?: 'low' | 'medium' | 'high';
          category?: 'cleaning' | 'maintenance' | 'shopping' | 'cooking' | 'other';
          points: number;
          recurring?: {
            frequency: 'daily' | 'weekly' | 'monthly';
            interval: number;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          description?: string;
          assigned_to?: string;
          assigned_by?: string;
          due_date?: string;
          completed_date?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
          priority?: 'low' | 'medium' | 'high';
          category?: 'cleaning' | 'maintenance' | 'shopping' | 'cooking' | 'other';
          points?: number;
          recurring?: {
            frequency: 'daily' | 'weekly' | 'monthly';
            interval: number;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      chore_completions: {
        Row: {
          id: string;
          chore_id: string;
          user_id: string;
          completed_at: string;
          verified_by?: string;
          points_earned: number;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chore_id: string;
          user_id: string;
          completed_at: string;
          verified_by?: string;
          points_earned: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chore_id?: string;
          user_id?: string;
          completed_at?: string;
          verified_by?: string;
          points_earned?: number;
          notes?: string;
          created_at?: string;
        };
      };
      sensors: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: 'motion' | 'door' | 'trash' | 'dishwasher' | 'washer' | 'dryer' | 'temperature' | 'humidity';
          location: string;
          is_active: boolean;
          last_reading?: {
            value: unknown;
            timestamp: string;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: 'motion' | 'door' | 'trash' | 'dishwasher' | 'washer' | 'dryer' | 'temperature' | 'humidity';
          location: string;
          is_active?: boolean;
          last_reading?: {
            value: unknown;
            timestamp: string;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          type?: 'motion' | 'door' | 'trash' | 'dishwasher' | 'washer' | 'dryer' | 'temperature' | 'humidity';
          location?: string;
          is_active?: boolean;
          last_reading?: {
            value: unknown;
            timestamp: string;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      sensor_events: {
        Row: {
          id: string;
          sensor_id: string;
          event_type: 'motion_detected' | 'door_opened' | 'trash_emptied' | 'appliance_completed' | 'threshold_exceeded';
          value?: unknown;
          timestamp: string;
          metadata?: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          sensor_id: string;
          event_type: 'motion_detected' | 'door_opened' | 'trash_emptied' | 'appliance_completed' | 'threshold_exceeded';
          value?: unknown;
          timestamp: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          sensor_id?: string;
          event_type?: 'motion_detected' | 'door_opened' | 'trash_emptied' | 'appliance_completed' | 'threshold_exceeded';
          value?: unknown;
          timestamp?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      nudges: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          message: string;
          type: 'chore_reminder' | 'bill_due' | 'rent_due' | 'sensor_triggered' | 'conflict_warning';
          priority: 'low' | 'medium' | 'high';
          target_users: string[];
          is_read: boolean;
          is_dismissed: boolean;
          expires_at?: string;
          action_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          message: string;
          type: 'chore_reminder' | 'bill_due' | 'rent_due' | 'sensor_triggered' | 'conflict_warning';
          priority?: 'low' | 'medium' | 'high';
          target_users: string[];
          is_read?: boolean;
          is_dismissed?: boolean;
          expires_at?: string;
          action_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          message?: string;
          type?: 'chore_reminder' | 'bill_due' | 'rent_due' | 'sensor_triggered' | 'conflict_warning';
          priority?: 'low' | 'medium' | 'high';
          target_users?: string[];
          is_read?: boolean;
          is_dismissed?: boolean;
          expires_at?: string;
          action_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          content: string;
          timestamp: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          is_edited: boolean;
          edited_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          content: string;
          timestamp: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          is_edited?: boolean;
          edited_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          content?: string;
          timestamp?: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          is_edited?: boolean;
          edited_at?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          type: 'rent_due' | 'bill_due' | 'chore_assigned' | 'chore_completed' | 'conflict_detected' | 'nudge_received';
          title: string;
          message: string;
          is_read: boolean;
          action_url?: string;
          metadata?: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          type: 'rent_due' | 'bill_due' | 'chore_assigned' | 'chore_completed' | 'conflict_detected' | 'nudge_received';
          title: string;
          message: string;
          is_read?: boolean;
          action_url?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          household_id?: string;
          type?: 'rent_due' | 'bill_due' | 'chore_assigned' | 'chore_completed' | 'conflict_detected' | 'nudge_received';
          title?: string;
          message?: string;
          is_read?: boolean;
          action_url?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
    };
  };
};

export default supabase; 