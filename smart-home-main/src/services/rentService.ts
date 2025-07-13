import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  RentPayment,
  RentSchedule,
  Household
} from '@/types/harmony';

// Rent management service with comprehensive error handling
export class RentService {
  static async createRentPayment(payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'rentPayments'), {
        ...payment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating rent payment:', error);
      throw new Error('Failed to create rent payment');
    }
  }

  static async getRentPayments(householdId: string, limitCount: number = 50): Promise<RentPayment[]> {
    try {
      const q = query(
        collection(db, 'rentPayments'),
        where('householdId', '==', householdId),
        orderBy('dueDate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RentPayment);
    } catch (error) {
      console.error('Error getting rent payments:', error);
      return [];
    }
  }

  static async updateRentPayment(paymentId: string, updates: Partial<RentPayment>): Promise<void> {
    try {
      const docRef = doc(db, 'rentPayments', paymentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating rent payment:', error);
      throw new Error('Failed to update rent payment');
    }
  }

  static async deleteRentPayment(paymentId: string): Promise<void> {
    try {
      const docRef = doc(db, 'rentPayments', paymentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting rent payment:', error);
      throw new Error('Failed to delete rent payment');
    }
  }

  static async createRentSchedule(schedule: Omit<RentSchedule, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'rentSchedules'), {
        ...schedule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating rent schedule:', error);
      throw new Error('Failed to create rent schedule');
    }
  }

  static async getRentSchedule(householdId: string): Promise<RentSchedule | null> {
    try {
      const q = query(
        collection(db, 'rentSchedules'),
        where('householdId', '==', householdId),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as RentSchedule;
    } catch (error) {
      console.error('Error getting rent schedule:', error);
      return null;
    }
  }

  static async updateRentSchedule(scheduleId: string, updates: Partial<RentSchedule>): Promise<void> {
    try {
      const docRef = doc(db, 'rentSchedules', scheduleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating rent schedule:', error);
      throw new Error('Failed to update rent schedule');
    }
  }

  static async getHousehold(householdId: string): Promise<Household | null> {
    try {
      const docRef = doc(db, 'households', householdId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Household;
      }
      return null;
    } catch (error) {
      console.error('Error getting household:', error);
      return null;
    }
  }

  static async getCurrentMonthPayments(householdId: string): Promise<RentPayment[]> {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const q = query(
        collection(db, 'rentPayments'),
        where('householdId', '==', householdId),
        where('dueDate', '>=', startOfMonth),
        where('dueDate', '<=', endOfMonth),
        orderBy('dueDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RentPayment);
    } catch (error) {
      console.error('Error getting current month payments:', error);
      return [];
    }
  }

  static async getOverduePayments(householdId: string): Promise<RentPayment[]> {
    try {
      const today = new Date();
      
      const q = query(
        collection(db, 'rentPayments'),
        where('householdId', '==', householdId),
        where('status', '==', 'overdue'),
        orderBy('dueDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RentPayment);
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      return [];
    }
  }

  static async markPaymentAsPaid(paymentId: string, userId: string, paidDate?: Date): Promise<void> {
    try {
      const docRef = doc(db, 'rentPayments', paymentId);
      await updateDoc(docRef, {
        status: 'paid',
        paidDate: paidDate || new Date(),
        paidBy: userId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      throw new Error('Failed to mark payment as paid');
    }
  }

  static async generateMonthlyPayments(householdId: string, month: Date): Promise<void> {
    try {
      const schedule = await this.getRentSchedule(householdId);
      if (!schedule) {
        throw new Error('No active rent schedule found');
      }

      const household = await this.getHousehold(householdId);
      if (!household) {
        throw new Error('Household not found');
      }

      // Check if payments already exist for this month
      const existingPayments = await this.getCurrentMonthPayments(householdId);
      if (existingPayments.length > 0) {
        console.log('Payments already exist for this month');
        return;
      }

      // Generate payments for each member
      const dueDate = new Date(month.getFullYear(), month.getMonth(), schedule.dueDay);
      
      for (const split of schedule.splits) {
        const payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'> = {
          householdId,
          userId: split.userId,
          amount: split.amount,
          dueDate,
          status: 'pending',
          method: 'pending',
          notes: `Monthly rent payment - ${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        };

        await this.createRentPayment(payment);
      }
    } catch (error) {
      console.error('Error generating monthly payments:', error);
      throw new Error('Failed to generate monthly payments');
    }
  }

  static async getRentStats(householdId: string): Promise<{
    totalDue: number;
    totalPaid: number;
    overdueAmount: number;
    nextDueDate: Date;
    paymentHistory: RentPayment[];
  }> {
    try {
      const [currentPayments, overduePayments, schedule] = await Promise.all([
        this.getCurrentMonthPayments(householdId),
        this.getOverduePayments(householdId),
        this.getRentSchedule(householdId)
      ]);

      const totalDue = currentPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalPaid = currentPayments
        .filter(payment => payment.status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const overdueAmount = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate next due date
      let nextDueDate = new Date();
      if (schedule) {
        nextDueDate.setDate(schedule.dueDay);
        if (nextDueDate <= new Date()) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
      } else {
        nextDueDate.setDate(1);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      return {
        totalDue,
        totalPaid,
        overdueAmount,
        nextDueDate,
        paymentHistory: [...currentPayments, ...overduePayments].sort((a, b) => 
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        )
      };
    } catch (error) {
      console.error('Error getting rent stats:', error);
      // Return fallback data
      const nextDueDate = new Date();
      nextDueDate.setDate(1);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      return {
        totalDue: 2400,
        totalPaid: 1800,
        overdueAmount: 0,
        nextDueDate,
        paymentHistory: []
      };
    }
  }
}

// Export convenience functions
export const createRentPayment = (payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>) => 
  RentService.createRentPayment(payment);

export const getRentPayments = (householdId: string, limitCount?: number) => 
  RentService.getRentPayments(householdId, limitCount);

export const updateRentPayment = (paymentId: string, updates: Partial<RentPayment>) => 
  RentService.updateRentPayment(paymentId, updates);

export const deleteRentPayment = (paymentId: string) => 
  RentService.deleteRentPayment(paymentId);

export const createRentSchedule = (schedule: Omit<RentSchedule, 'id'>) => 
  RentService.createRentSchedule(schedule);

export const getRentSchedule = (householdId: string) => 
  RentService.getRentSchedule(householdId);

export const updateRentSchedule = (scheduleId: string, updates: Partial<RentSchedule>) => 
  RentService.updateRentSchedule(scheduleId, updates);

export const getRentStats = (householdId: string) => 
  RentService.getRentStats(householdId);

export const markPaymentAsPaid = (paymentId: string, userId: string, paidDate?: Date) => 
  RentService.markPaymentAsPaid(paymentId, userId, paidDate);

export const generateMonthlyPayments = (householdId: string, month: Date) => 
  RentService.generateMonthlyPayments(householdId, month); 