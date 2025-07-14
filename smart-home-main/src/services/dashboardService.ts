import { supabase } from '@/lib/supabase';
import {
  DashboardStats,
  Household,
  RentPayment,
  Bill,
  Chore,
  ChoreCompletion,
  Nudge,
  Notification,
  ConflictCoachSession
} from '@/types/harmony';

// Dashboard data service with comprehensive error handling
export class DashboardService {
  static async getDashboardStats(householdId: string): Promise<DashboardStats> {
    try {
      // Get household info
      const household = await this.getHousehold(householdId);
      if (!household) {
        throw new Error('Household not found');
      }

      // Get all data in parallel
      const [
        rentPayments,
        bills,
        chores,
        choreCompletions,
        conflictSessions,
        nudges
      ] = await Promise.all([
        this.getRentPayments(householdId),
        this.getBills(householdId),
        this.getChores(householdId),
        this.getChoreCompletions(householdId),
        this.getConflictSessions(householdId),
        this.getNudges(householdId)
      ]);

      // Calculate rent stats
      const currentMonth = new Date();
      const currentMonthPayments = rentPayments.filter(payment => {
        const paymentDate = new Date(payment.dueDate);
        return paymentDate.getMonth() === currentMonth.getMonth() && 
               paymentDate.getFullYear() === currentMonth.getFullYear();
      });

      const totalRentDue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalRentPaid = currentMonthPayments
        .filter(payment => payment.status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const overdueAmount = currentMonthPayments
        .filter(payment => payment.status === 'overdue')
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate next due date (assuming 1st of each month)
      const nextDueDate = new Date();
      nextDueDate.setDate(1);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      // Calculate bill stats
      const pendingBills = bills.filter(bill => bill.status === 'pending');
      const paidBills = bills.filter(bill => bill.status === 'paid');
      const overdueBills = bills.filter(bill => bill.status === 'overdue');

      const totalBillsDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
      const totalBillsPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
      const upcomingDue = bills
        .filter(bill => bill.status === 'pending')
        .map(bill => new Date(bill.dueDate))
        .sort((a, b) => a.getTime() - b.getTime())
        .slice(0, 3);

      // Calculate chore stats
      const pendingChores = chores.filter(chore => chore.status !== 'completed');
      const completedThisWeek = choreCompletions.filter(completion => {
        const completionDate = new Date(completion.completedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completionDate >= weekAgo;
      });

      const totalPoints = chores.reduce((sum, chore) => sum + chore.points, 0);

      // Calculate leaderboard
      const userPoints = new Map<string, { points: number; completedChores: number }>();
      
      choreCompletions.forEach(completion => {
        const current = userPoints.get(completion.userId) || { points: 0, completedChores: 0 };
        userPoints.set(completion.userId, {
          points: current.points + completion.pointsEarned,
          completedChores: current.completedChores + 1
        });
      });

      const leaderboard = Array.from(userPoints.entries())
        .map(([userId, data]) => ({
          userId,
          points: data.points,
          completedChores: data.completedChores
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);

      // Calculate conflict stats
      const activeSessions = conflictSessions.filter(session => session.status === 'active').length;
      const resolvedThisWeek = conflictSessions.filter(session => {
        if (session.status !== 'completed' || !session.endedAt) return false;
        const endDate = new Date(session.endedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return endDate >= weekAgo;
      }).length;

      // Mock sensor data (replace with actual sensor service)
      const sensorStats = {
        activeCount: 6,
        recentEvents: 24,
        triggeredNudges: nudges.filter(nudge => nudge.type === 'sensor_triggered').length
      };

      return {
        householdId,
        rent: {
          totalDue: totalRentDue,
          totalPaid: totalRentPaid,
          overdueAmount,
          nextDueDate
        },
        bills: {
          totalDue: totalBillsDue,
          totalPaid: totalBillsPaid,
          overdueCount: overdueBills.length,
          upcomingDue
        },
        chores: {
          pendingCount: pendingChores.length,
          completedThisWeek: completedThisWeek.length,
          totalPoints,
          leaderboard
        },
        conflicts: {
          activeSessions,
          resolvedThisWeek,
          averageSentiment: 'positive' as const // Mock data
        },
        sensors: sensorStats
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Return fallback data
      return this.getFallbackStats(householdId);
    }
  }

  private static async getHousehold(householdId: string): Promise<Household | null> {
    try {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting household:', error);
      return null;
    }
  }

  private static async getRentPayments(householdId: string): Promise<RentPayment[]> {
    try {
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('household_id', householdId)
        .order('due_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting rent payments:', error);
      return [];
    }
  }

  private static async getBills(householdId: string): Promise<Bill[]> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('household_id', householdId)
        .order('due_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bills:', error);
      return [];
    }
  }

  private static async getChores(householdId: string): Promise<Chore[]> {
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting chores:', error);
      return [];
    }
  }

  private static async getChoreCompletions(householdId: string): Promise<ChoreCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('chore_completions')
        .select('*')
        .eq('household_id', householdId)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting chore completions:', error);
      return [];
    }
  }

  private static async getConflictSessions(householdId: string): Promise<ConflictCoachSession[]> {
    try {
      const { data, error } = await supabase
        .from('conflict_coach_sessions')
        .select('*')
        .eq('household_id', householdId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting conflict sessions:', error);
      return [];
    }
  }

  private static async getNudges(householdId: string): Promise<Nudge[]> {
    try {
      const { data, error } = await supabase
        .from('nudges')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting nudges:', error);
      return [];
    }
  }

  private static getFallbackStats(householdId: string): DashboardStats {
    const nextDueDate = new Date();
    nextDueDate.setDate(1);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    return {
      householdId,
      rent: {
        totalDue: 2400,
        totalPaid: 1800,
        overdueAmount: 0,
        nextDueDate
      },
      bills: {
        totalDue: 450,
        totalPaid: 200,
        overdueCount: 1,
        upcomingDue: [new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)]
      },
      chores: {
        pendingCount: 8,
        completedThisWeek: 12,
        totalPoints: 340,
        leaderboard: [
          { userId: 'user1', points: 120, completedChores: 4 },
          { userId: 'user2', points: 95, completedChores: 3 },
          { userId: 'user3', points: 125, completedChores: 5 }
        ]
      },
      conflicts: {
        activeSessions: 0,
        resolvedThisWeek: 2,
        averageSentiment: 'positive'
      },
      sensors: {
        activeCount: 6,
        recentEvents: 24,
        triggeredNudges: 8
      }
    };
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  static async getHouseholdNudges(householdId: string, userId?: string): Promise<Nudge[]> {
    try {
      let query = supabase
        .from('nudges')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (userId) {
        query = query.contains('target_users', [userId]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting household nudges:', error);
      return [];
    }
  }
}

// Export convenience functions
export const getDashboardStats = (householdId: string) => DashboardService.getDashboardStats(householdId);
export const getUserNotifications = (userId: string) => DashboardService.getUserNotifications(userId);
export const getHouseholdNudges = (householdId: string, userId?: string) => DashboardService.getHouseholdNudges(householdId, userId); 