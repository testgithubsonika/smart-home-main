import { supabase } from '@/lib/supabase';
import {
  Household,
  User,
  RentPayment,
  RentSchedule,
  Bill,
  Chore,
  ChoreCompletion,
  ChatMessage,
  ConflictAnalysis,
  ConflictCoachSession,
  Nudge,
  Notification,
  Sensor,
  SensorEvent
} from '@/types/harmony';

// Utility function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

// Utility function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

// ===== HOUSEHOLD MANAGEMENT =====

export const createHousehold = async (household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('households')
      .insert({
        name: household.name,
        address: household.address,
        members: household.members,
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Household created with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating household:', error);
    throw new Error('Failed to create household');
  }
};

export const getHousehold = async (householdId: string): Promise<Household | null> => {
  try {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', householdId)
      .single();

    if (error) return null;
    return toCamelCase(data) as Household;
  } catch (error) {
    console.error('Error getting household:', error);
    return null;
  }
};

export const updateHousehold = async (householdId: string, updates: Partial<Household>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('households')
      .update({
        ...toSnakeCase(updates),
        updated_at: new Date().toISOString(),
      })
      .eq('id', householdId);

    if (error) throw error;
    console.log('Household updated successfully');
  } catch (error) {
    console.error('Error updating household:', error);
    throw new Error('Failed to update household');
  }
};

// ===== USER MANAGEMENT =====

export const createUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        is_active: user.isActive,
        joined_at: user.joinedAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    console.log('User created with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return toCamelCase(data) as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// ===== RENT PAYMENTS =====

export const createRentPayment = async (payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('rent_payments')
      .insert({
        household_id: payment.householdId,
        user_id: payment.userId,
        amount: payment.amount,
        due_date: payment.dueDate.toISOString(),
        paid_date: payment.paidDate?.toISOString(),
        status: payment.status,
        method: payment.method,
        notes: payment.notes,
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Rent payment created with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating rent payment:', error);
    throw new Error('Failed to create rent payment');
  }
};

export const getRentPayments = async (householdId: string): Promise<RentPayment[]> => {
  try {
    const { data, error } = await supabase
      .from('rent_payments')
      .select('*')
      .eq('household_id', householdId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data.map(toCamelCase) as RentPayment[];
  } catch (error) {
    console.error('Error getting rent payments:', error);
    return [];
  }
};

// ===== BILLS =====

export const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .insert({
        household_id: bill.householdId,
        name: bill.name,
        amount: bill.amount,
        due_date: bill.dueDate.toISOString(),
        paid_date: bill.paidDate?.toISOString(),
        status: bill.status,
        category: bill.category,
        paid_by: bill.paidBy,
        split_between: bill.splitBetween,
        receipt_url: bill.receiptUrl,
        notes: bill.notes,
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Bill created with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating bill:', error);
    throw new Error('Failed to create bill');
  }
};

export const getBills = async (householdId: string): Promise<Bill[]> => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('household_id', householdId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data.map(toCamelCase) as Bill[];
  } catch (error) {
    console.error('Error getting bills:', error);
    return [];
  }
};

// ===== CHORES =====

export const createChore = async (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('chores')
      .insert({
        household_id: chore.householdId,
        title: chore.title,
        description: chore.description,
        assigned_to: chore.assignedTo,
        assigned_by: chore.assignedBy,
        due_date: chore.dueDate?.toISOString(),
        completed_date: chore.completedDate?.toISOString(),
        status: chore.status,
        priority: chore.priority,
        category: chore.category,
        points: chore.points,
        recurring: chore.recurring,
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Chore created with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating chore:', error);
    throw new Error('Failed to create chore');
  }
};

export const getChores = async (householdId: string): Promise<Chore[]> => {
  try {
    const { data, error } = await supabase
      .from('chores')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toCamelCase) as Chore[];
  } catch (error) {
    console.error('Error getting chores:', error);
    return [];
  }
};

// ===== BATCH OPERATIONS =====

export const uploadSampleData = async (householdId: string): Promise<void> => {
  try {
    await updateHousehold(householdId, {
      name: "Sarah & Leo's Home",
      address: "123 Harmony Street, City, State 12345",
    });

    const rentPayments = [
      // ... (sample data remains the same)
    ];
    for (const payment of rentPayments) {
      await createRentPayment(payment);
    }

    const bills = [
      // ... (sample data remains the same)
    ];
    for (const bill of bills) {
      await createBill(bill);
    }

    const chores = [
      // ... (sample data remains the same)
    ];
    for (const chore of chores) {
      await createChore(chore);
    }

    console.log('Sample data uploaded successfully');
  } catch (error) {
    console.error('Error uploading sample data:', error);
    throw new Error('Failed to upload sample data');
  }
};

export const exportHouseholdData = async (householdId: string): Promise<any> => {
  try {
    const [household, rentPayments, bills, chores] = await Promise.all([
      getHousehold(householdId),
      getRentPayments(householdId),
      getBills(householdId),
      getChores(householdId),
    ]);

    return {
      household,
      rentPayments,
      bills,
      chores,
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting household data:', error);
    throw new Error('Failed to export household data');
  }
};

export const getChoreCompletions = async (householdId: string): Promise<ChoreCompletion[]> => {
  try {
    const { data, error } = await supabase
      .from('chore_completions')
      .select('*')
      .eq('household_id', householdId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data.map(toCamelCase) as ChoreCompletion[];
  } catch (error) {
    console.error('Error getting chore completions:', error);
    return [];
  }
};

export const getNotifications = async (householdId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toCamelCase) as Notification[];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const getNudges = async (householdId: string): Promise<Nudge[]> => {
  try {
    const { data, error } = await supabase
      .from('nudges')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(toCamelCase) as Nudge[];
  } catch (error) {
    console.error('Error getting nudges:', error);
    return [];
  }
};

export const clearHouseholdData = async (householdId: string): Promise<void> => {
  try {
    await Promise.all([
      supabase.from('rent_payments').delete().eq('household_id', householdId),
      supabase.from('bills').delete().eq('household_id', householdId),
      supabase.from('chores').delete().eq('household_id', householdId),
      supabase.from('chore_completions').delete().eq('household_id', householdId),
      supabase.from('notifications').delete().eq('household_id', householdId),
      supabase.from('nudges').delete().eq('household_id', householdId),
      supabase.from('chat_messages').delete().eq('household_id', householdId), // Assuming chat_messages also linked to household
      supabase.from('conflict_analyses').delete().eq('household_id', householdId), // Assuming conflict_analyses also linked to household
      supabase.from('conflict_coach_sessions').delete().eq('household_id', householdId), // Assuming conflict_coach_sessions also linked to household
      supabase.from('sensors').delete().eq('household_id', householdId), // Assuming sensors also linked to household
      supabase.from('sensor_events').delete().eq('household_id', householdId), // Assuming sensor_events also linked to household
    ]);

    await supabase.from('households').delete().eq('id', householdId);

    console.log('Household data cleared successfully');
  } catch (error) {
    console.error('Error clearing household data:', error);
    throw new Error('Failed to clear household data');
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('households')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

/**
 * Checks if a user's identity is verified.
 * @param userId The ID of the user to check.
 * @returns {Promise<boolean>} True if the user is verified, false otherwise.
 */
export const checkVerificationStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles') // Assumes you have a 'profiles' table
      .select('is_verified') // Selects the verification status column
      .eq('id', userId)
      .single();

    // If an error occurs (e.g., user not found), log it and return false
    if (error) {
      console.error('Error checking verification status:', error.message);
      return false;
    }

    // Return the verification status from the database
    return data?.is_verified || false;
  } catch (err) {
    console.error('An unexpected error occurred:', err);
    return false;
  }
};

/**
 * Checks if a user profile exists in the database.
 * @param userId The ID of the user to check.
 * @returns {Promise<boolean>} True if the user profile exists, false otherwise.
 */
export const checkUserProfileExists = async (userId: string): Promise<boolean> => {
  try {
    // First check if user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.log('User not found in users table:', userError.message);
      return false;
    }

    // Also check if user has a household (indicating they've completed onboarding)
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('id')
      .contains('members', [userId])
      .single();

    if (householdError) {
      console.log('User not found in any household:', householdError.message);
      return false;
    }

    // User exists and has a household, so they have a complete profile
    return true;
  } catch (err) {
    console.error('Error checking user profile existence:', err);
    return false;
  }
};