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
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp
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
  DashboardStats,
  Notification,
  HouseholdSettings
} from '@/types/harmony';

// Household Management
export const createHousehold = async (household: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'households'), {
    ...household,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getHousehold = async (householdId: string): Promise<Household | null> => {
  const docRef = doc(db, 'households', householdId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Household;
  }
  return null;
};

export const updateHousehold = async (householdId: string, updates: Partial<Household>): Promise<void> => {
  const docRef = doc(db, 'households', householdId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Rent Management
export const createRentPayment = async (payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'rentPayments'), {
    ...payment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRentPayments = async (householdId: string): Promise<RentPayment[]> => {
  const q = query(
    collection(db, 'rentPayments'),
    where('householdId', '==', householdId),
    orderBy('dueDate', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RentPayment);
};

export const updateRentPayment = async (paymentId: string, updates: Partial<RentPayment>): Promise<void> => {
  const docRef = doc(db, 'rentPayments', paymentId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const createRentSchedule = async (schedule: Omit<RentSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'rentSchedules'), {
    ...schedule,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Bills Management
export const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'bills'), {
    ...bill,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getBills = async (householdId: string): Promise<Bill[]> => {
  const q = query(
    collection(db, 'bills'),
    where('householdId', '==', householdId),
    orderBy('dueDate', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Bill);
};

export const updateBill = async (billId: string, updates: Partial<Bill>): Promise<void> => {
  const docRef = doc(db, 'bills', billId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBill = async (billId: string): Promise<void> => {
  const docRef = doc(db, 'bills', billId);
  await deleteDoc(docRef);
};

// Chores Management
export const createChore = async (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'chores'), {
    ...chore,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getChores = async (householdId: string): Promise<Chore[]> => {
  const q = query(
    collection(db, 'chores'),
    where('householdId', '==', householdId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Chore);
};

export const updateChore = async (choreId: string, updates: Partial<Chore>): Promise<void> => {
  const docRef = doc(db, 'chores', choreId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const completeChore = async (choreId: string, completion: Omit<ChoreCompletion, 'id'>): Promise<string> => {
  const batch = writeBatch(db);
  
  // Add completion record
  const completionRef = doc(collection(db, 'choreCompletions'));
  batch.set(completionRef, {
    ...completion,
    createdAt: serverTimestamp(),
  });
  
  // Update chore status
  const choreRef = doc(db, 'chores', choreId);
  batch.update(choreRef, {
    status: 'completed',
    completedDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  await batch.commit();
  return completionRef.id;
};

export const getChoreCompletions = async (householdId: string, days: number = 30): Promise<ChoreCompletion[]> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const q = query(
    collection(db, 'choreCompletions'),
    where('householdId', '==', householdId),
    where('completedAt', '>=', cutoffDate),
    orderBy('completedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ChoreCompletion);
};

// Sensor Management
export const createSensor = async (sensor: Omit<Sensor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'sensors'), {
    ...sensor,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getSensors = async (householdId: string): Promise<Sensor[]> => {
  const q = query(
    collection(db, 'sensors'),
    where('householdId', '==', householdId),
    where('isActive', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Sensor);
};

export const recordSensorEvent = async (event: Omit<SensorEvent, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'sensorEvents'), {
    ...event,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getSensorEvents = async (sensorId: string, hours: number = 24): Promise<SensorEvent[]> => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  
  const q = query(
    collection(db, 'sensorEvents'),
    where('sensorId', '==', sensorId),
    where('timestamp', '>=', cutoffDate),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SensorEvent);
};

// Nudges Management
export const createNudge = async (nudge: Omit<Nudge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'nudges'), {
    ...nudge,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getNudges = async (householdId: string, userId?: string): Promise<Nudge[]> => {
  let q = query(
    collection(db, 'nudges'),
    where('householdId', '==', householdId),
    where('isDismissed', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  if (userId) {
    q = query(q, where('targetUsers', 'array-contains', userId));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Nudge);
};

export const markNudgeAsRead = async (nudgeId: string, userId: string): Promise<void> => {
  const docRef = doc(db, 'nudges', nudgeId);
  await updateDoc(docRef, {
    isRead: true,
    updatedAt: serverTimestamp(),
  });
};

export const dismissNudge = async (nudgeId: string): Promise<void> => {
  const docRef = doc(db, 'nudges', nudgeId);
  await updateDoc(docRef, {
    isDismissed: true,
    updatedAt: serverTimestamp(),
  });
};

// Chat and Conflict Management
export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'chatMessages'), {
    ...message,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
};

export const getChatMessages = async (householdId: string, limit: number = 50): Promise<ChatMessage[]> => {
  const q = query(
    collection(db, 'chatMessages'),
    where('householdId', '==', householdId),
    orderBy('timestamp', 'desc'),
    limit(limit)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ChatMessage);
};

export const createConflictAnalysis = async (analysis: Omit<ConflictAnalysis, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'conflictAnalyses'), {
    ...analysis,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const createConflictCoachSession = async (session: Omit<ConflictCoachSession, 'id' | 'startedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'conflictCoachSessions'), {
    ...session,
    startedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateConflictCoachSession = async (sessionId: string, updates: Partial<ConflictCoachSession>): Promise<void> => {
  const docRef = doc(db, 'conflictCoachSessions', sessionId);
  await updateDoc(docRef, updates);
};

export const getActiveConflictSessions = async (householdId: string): Promise<ConflictCoachSession[]> => {
  const q = query(
    collection(db, 'conflictCoachSessions'),
    where('householdId', '==', householdId),
    where('status', '==', 'active')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ConflictCoachSession);
};

// Notifications
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...notification,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    isRead: true,
  });
};

// Settings
export const getHouseholdSettings = async (householdId: string): Promise<HouseholdSettings | null> => {
  const docRef = doc(db, 'householdSettings', householdId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as HouseholdSettings;
  }
  return null;
};

export const updateHouseholdSettings = async (householdId: string, settings: Partial<HouseholdSettings>): Promise<void> => {
  const docRef = doc(db, 'householdSettings', householdId);
  await updateDoc(docRef, settings);
};

// Real-time listeners
export const subscribeToHouseholdUpdates = (
  householdId: string,
  callback: (data: Record<string, unknown>) => void
) => {
  return onSnapshot(
    query(collection(db, 'households'), where('id', '==', householdId)),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          callback({ id: change.doc.id, ...change.doc.data() });
        }
      });
    }
  );
};

export const subscribeToNudges = (
  householdId: string,
  userId: string,
  callback: (nudges: Nudge[]) => void
) => {
  const q = query(
    collection(db, 'nudges'),
    where('householdId', '==', householdId),
    where('targetUsers', 'array-contains', userId),
    where('isDismissed', '==', false)
  );
  
  return onSnapshot(q, (snapshot) => {
    const nudges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Nudge);
    callback(nudges);
  });
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
    callback(notifications);
  });
}; 