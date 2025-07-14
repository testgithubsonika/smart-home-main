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
  DashboardStats,
  Notification,
  HouseholdSettings
} from '@/types/harmony';

// Household Management
export const createHousehold = async (household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('households')
    .insert({
      ...household,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getHousehold = async (householdId: string): Promise<Household | null> => {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  if (error) return null;
  return data;
};

export const updateHousehold = async (householdId: string, updates: Partial<Household>): Promise<void> => {
  const { error } = await supabase
    .from('households')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', householdId);

  if (error) throw error;
};

// Rent Management
export const createRentPayment = async (payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('rent_payments')
    .insert({
      ...payment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getRentPayments = async (householdId: string): Promise<RentPayment[]> => {
  const { data, error } = await supabase
    .from('rent_payments')
    .select('*')
    .eq('household_id', householdId)
    .order('due_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateRentPayment = async (paymentId: string, updates: Partial<RentPayment>): Promise<void> => {
  const { error } = await supabase
    .from('rent_payments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) throw error;
};

export const createRentSchedule = async (schedule: Omit<RentSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('rent_schedules')
    .insert({
      ...schedule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

// Bills Management
export const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('bills')
    .insert({
      ...bill,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getBills = async (householdId: string): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('household_id', householdId)
    .order('due_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateBill = async (billId: string, updates: Partial<Bill>): Promise<void> => {
  const { error } = await supabase
    .from('bills')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', billId);

  if (error) throw error;
};

export const deleteBill = async (billId: string): Promise<void> => {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', billId);

  if (error) throw error;
};

// Chores Management
export const createChore = async (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('chores')
    .insert({
      ...chore,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getChores = async (householdId: string): Promise<Chore[]> => {
  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateChore = async (choreId: string, updates: Partial<Chore>): Promise<void> => {
  const { error } = await supabase
    .from('chores')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', choreId);

  if (error) throw error;
};

export const completeChore = async (choreId: string, completion: Omit<ChoreCompletion, 'id'>): Promise<string> => {
  // Start a transaction
  const { data: completionData, error: completionError } = await supabase
    .from('chore_completions')
    .insert({
      ...completion,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (completionError) throw completionError;

  // Update chore status
  const { error: updateError } = await supabase
    .from('chores')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', choreId);

  if (updateError) throw updateError;

  return completionData.id;
};

export const getChoreCompletions = async (householdId: string, days: number = 30): Promise<ChoreCompletion[]> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('chore_completions')
    .select('*')
    .eq('household_id', householdId)
    .gte('completed_at', cutoffDate.toISOString())
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Sensor Management
export const createSensor = async (sensor: Omit<Sensor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('sensors')
    .insert({
      ...sensor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getSensors = async (householdId: string): Promise<Sensor[]> => {
  const { data, error } = await supabase
    .from('sensors')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
};

export const recordSensorEvent = async (event: Omit<SensorEvent, 'id'>): Promise<string> => {
  const { data, error } = await supabase
    .from('sensor_events')
    .insert({
      ...event,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getSensorEvents = async (sensorId: string, hours: number = 24): Promise<SensorEvent[]> => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);

  const { data, error } = await supabase
    .from('sensor_events')
    .select('*')
    .eq('sensor_id', sensorId)
    .gte('timestamp', cutoffDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Nudges Management
export const createNudge = async (nudge: Omit<Nudge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('nudges')
    .insert({
      ...nudge,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getNudges = async (householdId: string, userId?: string): Promise<Nudge[]> => {
  let query = supabase
    .from('nudges')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.contains('target_users', [userId]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const markNudgeAsRead = async (nudgeId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('nudges')
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', nudgeId);

  if (error) throw error;
};

export const dismissNudge = async (nudgeId: string): Promise<void> => {
  const { error } = await supabase
    .from('nudges')
    .update({
      is_dismissed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', nudgeId);

  if (error) throw error;
};

// Chat and Conflict Management
export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      ...message,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getChatMessages = async (householdId: string, limitCount: number = 50): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('household_id', householdId)
    .order('timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return data || [];
};

export const createConflictAnalysis = async (analysis: Omit<ConflictAnalysis, 'id' | 'createdAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('conflict_analyses')
    .insert({
      ...analysis,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const createConflictCoachSession = async (session: Omit<ConflictCoachSession, 'id' | 'startedAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('conflict_coach_sessions')
    .insert({
      ...session,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateConflictCoachSession = async (sessionId: string, updates: Partial<ConflictCoachSession>): Promise<void> => {
  const { error } = await supabase
    .from('conflict_coach_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) throw error;
};

export const getActiveConflictSessions = async (householdId: string): Promise<ConflictCoachSession[]> => {
  const { data, error } = await supabase
    .from('conflict_coach_sessions')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
};

// Notifications
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
    })
    .eq('id', notificationId);

  if (error) throw error;
};

// Settings
export const getHouseholdSettings = async (householdId: string): Promise<HouseholdSettings | null> => {
  const { data, error } = await supabase
    .from('household_settings')
    .select('*')
    .eq('household_id', householdId)
    .single();

  if (error) return null;
  return data;
};

export const updateHouseholdSettings = async (householdId: string, settings: Partial<HouseholdSettings>): Promise<void> => {
  const { error } = await supabase
    .from('household_settings')
    .update(settings)
    .eq('household_id', householdId);

  if (error) throw error;
};

// Real-time listeners
export const subscribeToHouseholdUpdates = (
  householdId: string,
  callback: (data: Record<string, unknown>) => void
) => {
  return supabase
    .channel('household-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'households',
        filter: `id=eq.${householdId}`,
      },
      (payload) => {
        callback(payload.new as Record<string, unknown>);
      }
    )
    .subscribe();
};

export const subscribeToNudges = (
  householdId: string,
  userId: string,
  callback: (nudges: Nudge[]) => void
) => {
  return supabase
    .channel('nudges')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'nudges',
        filter: `household_id=eq.${householdId}`,
      },
      async () => {
        // Refetch nudges when there are changes
        const nudges = await getNudges(householdId, userId);
        callback(nudges);
      }
    )
    .subscribe();
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch notifications when there are changes
        const notifications = await getUserNotifications(userId);
        callback(notifications);
      }
    )
    .subscribe();
}; 