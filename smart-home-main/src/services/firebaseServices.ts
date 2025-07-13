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
  writeBatch,
  runTransaction,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

// Firebase Services for data management
export class FirebaseServices {
  
  // ===== HOUSEHOLD MANAGEMENT =====
  static async createHousehold(household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'households'), {
        ...household,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Household created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating household:', error);
      throw new Error('Failed to create household');
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

  static async updateHousehold(householdId: string, updates: Partial<Household>): Promise<void> {
    try {
      const docRef = doc(db, 'households', householdId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('Household updated successfully');
    } catch (error) {
      console.error('Error updating household:', error);
      throw new Error('Failed to update household');
    }
  }

  // ===== USER MANAGEMENT =====
  static async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('User created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // ===== RENT PAYMENTS =====
  static async createRentPayment(payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'rentPayments'), {
        ...payment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Rent payment created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating rent payment:', error);
      throw new Error('Failed to create rent payment');
    }
  }

  static async getRentPayments(householdId: string): Promise<RentPayment[]> {
    try {
      const q = query(
        collection(db, 'rentPayments'),
        where('householdId', '==', householdId),
        orderBy('dueDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RentPayment);
    } catch (error) {
      console.error('Error getting rent payments:', error);
      return [];
    }
  }

  // ===== BILLS =====
  static async createBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'bills'), {
        ...bill,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Bill created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw new Error('Failed to create bill');
    }
  }

  static async getBills(householdId: string): Promise<Bill[]> {
    try {
      const q = query(
        collection(db, 'bills'),
        where('householdId', '==', householdId),
        orderBy('dueDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Bill);
    } catch (error) {
      console.error('Error getting bills:', error);
      return [];
    }
  }

  // ===== CHORES =====
  static async createChore(chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chores'), {
        ...chore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Chore created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chore:', error);
      throw new Error('Failed to create chore');
    }
  }

  static async getChores(householdId: string): Promise<Chore[]> {
    try {
      const q = query(
        collection(db, 'chores'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Chore);
    } catch (error) {
      console.error('Error getting chores:', error);
      return [];
    }
  }

  // ===== BATCH OPERATIONS =====
  static async uploadSampleData(householdId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Sample household data
      const householdRef = doc(db, 'households', householdId);
      batch.set(householdRef, {
        name: "Sarah & Leo's Home",
        address: "123 Harmony Street, City, State 12345",
        adminId: "user1",
        memberIds: ["user1", "user2", "user3"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Sample rent payments
      const rentPayments = [
        {
          householdId,
          userId: "user1",
          amount: 800,
          dueDate: new Date(2024, 0, 1), // January 1, 2024
          status: "paid" as const,
          method: "bank_transfer" as const,
          paidDate: new Date(2024, 0, 1),
          paidBy: "user1",
          notes: "January rent payment",
        },
        {
          householdId,
          userId: "user2",
          amount: 800,
          dueDate: new Date(2024, 0, 1),
          status: "paid" as const,
          method: "check" as const,
          paidDate: new Date(2024, 0, 2),
          paidBy: "user2",
          notes: "January rent payment",
        },
        {
          householdId,
          userId: "user3",
          amount: 800,
          dueDate: new Date(2024, 0, 1),
          status: "pending" as const,
          method: "pending" as const,
          notes: "January rent payment",
        }
      ];

      rentPayments.forEach((payment, index) => {
        const paymentRef = doc(collection(db, 'rentPayments'));
        batch.set(paymentRef, {
          ...payment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Sample bills
      const bills = [
        {
          householdId,
          name: "Electricity Bill",
          amount: 120,
          category: "electricity" as const,
          dueDate: new Date(2024, 0, 15),
          status: "paid" as const,
          paidBy: "user1",
          splitBetween: ["user1", "user2", "user3"],
          notes: "December electricity bill",
        },
        {
          householdId,
          name: "Internet Bill",
          amount: 80,
          category: "internet" as const,
          dueDate: new Date(2024, 0, 20),
          status: "pending" as const,
          splitBetween: ["user1", "user2", "user3"],
          notes: "January internet bill",
        }
      ];

      bills.forEach((bill, index) => {
        const billRef = doc(collection(db, 'bills'));
        batch.set(billRef, {
          ...bill,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Sample chores
      const chores = [
        {
          householdId,
          title: "Clean Kitchen",
          description: "Wash dishes, wipe counters, sweep floor",
          category: "cleaning" as const,
          priority: "high" as const,
          points: 15,
          assignedTo: "user1",
          assignedBy: "user1",
          dueDate: new Date(2024, 0, 5),
          status: "completed" as const,
        },
        {
          householdId,
          title: "Take Out Trash",
          description: "Empty all trash bins and take to curb",
          category: "cleaning" as const,
          priority: "medium" as const,
          points: 10,
          assignedTo: "user2",
          assignedBy: "user1",
          dueDate: new Date(2024, 0, 7),
          status: "pending" as const,
        },
        {
          householdId,
          title: "Pay Bills",
          description: "Pay electricity and internet bills",
          category: "finances" as const,
          priority: "high" as const,
          points: 20,
          assignedTo: "user1",
          assignedBy: "user1",
          dueDate: new Date(2024, 0, 10),
          status: "pending" as const,
        }
      ];

      chores.forEach((chore, index) => {
        const choreRef = doc(collection(db, 'chores'));
        batch.set(choreRef, {
          ...chore,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Sample chore completions
      const choreCompletions = [
        {
          householdId,
          choreId: "chore1", // This will be replaced with actual chore ID
          userId: "user1",
          completedAt: new Date(2024, 0, 5),
          pointsEarned: 15,
          notes: "Kitchen cleaned thoroughly",
        }
      ];

      choreCompletions.forEach((completion, index) => {
        const completionRef = doc(collection(db, 'choreCompletions'));
        batch.set(completionRef, {
          ...completion,
          createdAt: serverTimestamp(),
        });
      });

      // Sample notifications
      const notifications = [
        {
          userId: "user1",
          title: "Rent Due Soon",
          message: "Your rent payment of $800 is due in 3 days",
          type: "rent_due" as const,
          priority: "high" as const,
          isRead: false,
          actionUrl: "/rent",
        },
        {
          userId: "user2",
          title: "Chore Assigned",
          message: "You have been assigned to clean the kitchen",
          type: "chore_assigned" as const,
          priority: "medium" as const,
          isRead: false,
          actionUrl: "/chores",
        }
      ];

      notifications.forEach((notification, index) => {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
          ...notification,
          createdAt: serverTimestamp(),
        });
      });

      // Sample nudges
      const nudges = [
        {
          householdId,
          title: "Kitchen Cleanup Reminder",
          message: "The kitchen could use some attention. Consider cleaning up after meals.",
          type: "chore_reminder" as const,
          priority: "medium" as const,
          targetUsers: ["user1", "user2", "user3"],
          actionUrl: "/chores",
        },
        {
          householdId,
          title: "Bill Payment Due",
          message: "Electricity bill is due in 2 days. Don't forget to pay!",
          type: "bill_due" as const,
          priority: "high" as const,
          targetUsers: ["user1"],
          actionUrl: "/bills",
        }
      ];

      nudges.forEach((nudge, index) => {
        const nudgeRef = doc(collection(db, 'nudges'));
        batch.set(nudgeRef, {
          ...nudge,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log('Sample data uploaded successfully');
    } catch (error) {
      console.error('Error uploading sample data:', error);
      throw new Error('Failed to upload sample data');
    }
  }

  // ===== DATA EXPORT =====
  static async exportHouseholdData(householdId: string): Promise<any> {
    try {
      const [
        household,
        rentPayments,
        bills,
        chores,
        choreCompletions,
        notifications,
        nudges
      ] = await Promise.all([
        this.getHousehold(householdId),
        this.getRentPayments(householdId),
        this.getBills(householdId),
        this.getChores(householdId),
        this.getChoreCompletions(householdId),
        this.getNotifications(householdId),
        this.getNudges(householdId)
      ]);

      return {
        household,
        rentPayments,
        bills,
        chores,
        choreCompletions,
        notifications,
        nudges,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting household data:', error);
      throw new Error('Failed to export household data');
    }
  }

  // ===== UTILITY FUNCTIONS =====
  static async getChoreCompletions(householdId: string): Promise<ChoreCompletion[]> {
    try {
      const q = query(
        collection(db, 'choreCompletions'),
        where('householdId', '==', householdId),
        orderBy('completedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ChoreCompletion);
    } catch (error) {
      console.error('Error getting chore completions:', error);
      return [];
    }
  }

  static async getNotifications(householdId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async getNudges(householdId: string): Promise<Nudge[]> {
    try {
      const q = query(
        collection(db, 'nudges'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Nudge);
    } catch (error) {
      console.error('Error getting nudges:', error);
      return [];
    }
  }

  // ===== CLEANUP FUNCTIONS =====
  static async clearHouseholdData(householdId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get all documents for this household
      const collections = ['rentPayments', 'bills', 'chores', 'choreCompletions', 'nudges'];
      
      for (const collectionName of collections) {
        const q = query(
          collection(db, collectionName),
          where('householdId', '==', householdId)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      // Delete household
      const householdRef = doc(db, 'households', householdId);
      batch.delete(householdRef);
      
      await batch.commit();
      console.log('Household data cleared successfully');
    } catch (error) {
      console.error('Error clearing household data:', error);
      throw new Error('Failed to clear household data');
    }
  }

  // ===== HEALTH CHECK =====
  static async checkDatabaseConnection(): Promise<boolean> {
    try {
      const testDoc = doc(db, 'health_check', 'test');
      await setDoc(testDoc, { timestamp: serverTimestamp() });
      await deleteDoc(testDoc);
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}

// Export convenience functions
export const createHousehold = (household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>) => 
  FirebaseServices.createHousehold(household);

export const getHousehold = (householdId: string) => 
  FirebaseServices.getHousehold(householdId);

export const updateHousehold = (householdId: string, updates: Partial<Household>) => 
  FirebaseServices.updateHousehold(householdId, updates);

export const createUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => 
  FirebaseServices.createUser(user);

export const getUser = (userId: string) => 
  FirebaseServices.getUser(userId);

export const createRentPayment = (payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>) => 
  FirebaseServices.createRentPayment(payment);

export const getRentPayments = (householdId: string) => 
  FirebaseServices.getRentPayments(householdId);

export const createBill = (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => 
  FirebaseServices.createBill(bill);

export const getBills = (householdId: string) => 
  FirebaseServices.getBills(householdId);

export const createChore = (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => 
  FirebaseServices.createChore(chore);

export const getChores = (householdId: string) => 
  FirebaseServices.getChores(householdId);

export const uploadSampleData = (householdId: string) => 
  FirebaseServices.uploadSampleData(householdId);

export const exportHouseholdData = (householdId: string) => 
  FirebaseServices.exportHouseholdData(householdId);

export const clearHouseholdData = (householdId: string) => 
  FirebaseServices.clearHouseholdData(householdId);

export const checkDatabaseConnection = () => 
  FirebaseServices.checkDatabaseConnection(); 