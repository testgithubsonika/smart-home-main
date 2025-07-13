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
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export interface FloorPlan {
  id: string;
  householdId: string;
  userId: string;
  name: string;
  fileUrl: string;
  thumbnailUrl?: string;
  description?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateFloorPlanData {
  householdId: string;
  userId: string;
  name: string;
  file: File;
  description?: string;
}

export interface UpdateFloorPlanData {
  name?: string;
  description?: string;
  file?: File;
}

// Create a new floor plan
export const createFloorPlan = async (data: CreateFloorPlanData): Promise<string> => {
  try {
    // Upload file to Firebase Storage
    const storageRef = ref(storage, `floorplans/${data.householdId}/${data.file.name}`);
    const snapshot = await uploadBytes(storageRef, data.file);
    const fileUrl = await getDownloadURL(snapshot.ref);

    // Create document in Firestore
    const floorPlanData: Omit<FloorPlan, 'id'> = {
      householdId: data.householdId,
      userId: data.userId,
      name: data.name,
      fileUrl,
      description: data.description,
      fileSize: data.file.size,
      fileType: data.file.type,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, 'floorPlans'), floorPlanData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating floor plan:', error);
    throw new Error('Failed to create floor plan');
  }
};

// Get floor plan by ID
export const getFloorPlan = async (floorPlanId: string): Promise<FloorPlan | null> => {
  try {
    const docRef = doc(db, 'floorPlans', floorPlanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FloorPlan;
    }
    return null;
  } catch (error) {
    console.error('Error getting floor plan:', error);
    throw new Error('Failed to get floor plan');
  }
};

// Get floor plans by household ID
export const getFloorPlansByHousehold = async (householdId: string): Promise<FloorPlan[]> => {
  try {
    const q = query(
      collection(db, 'floorPlans'),
      where('householdId', '==', householdId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const floorPlans: FloorPlan[] = [];
    
    querySnapshot.forEach((doc) => {
      floorPlans.push({ id: doc.id, ...doc.data() } as FloorPlan);
    });
    
    return floorPlans;
  } catch (error) {
    console.error('Error getting floor plans by household:', error);
    throw new Error('Failed to get floor plans');
  }
};

// Get floor plans by user ID
export const getFloorPlansByUser = async (userId: string): Promise<FloorPlan[]> => {
  try {
    const q = query(
      collection(db, 'floorPlans'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const floorPlans: FloorPlan[] = [];
    
    querySnapshot.forEach((doc) => {
      floorPlans.push({ id: doc.id, ...doc.data() } as FloorPlan);
    });
    
    return floorPlans;
  } catch (error) {
    console.error('Error getting floor plans by user:', error);
    throw new Error('Failed to get floor plans');
  }
};

// Update floor plan
export const updateFloorPlan = async (floorPlanId: string, data: UpdateFloorPlanData): Promise<void> => {
  try {
    const docRef = doc(db, 'floorPlans', floorPlanId);
    const updateData: Partial<FloorPlan> = {
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;

    // If a new file is provided, upload it and update the URL
    if (data.file) {
      const floorPlan = await getFloorPlan(floorPlanId);
      if (!floorPlan) throw new Error('Floor plan not found');

      // Delete old file from storage
      if (floorPlan.fileUrl) {
        try {
          const oldFileRef = ref(storage, floorPlan.fileUrl);
          await deleteObject(oldFileRef);
        } catch (error) {
          console.warn('Failed to delete old file:', error);
        }
      }

      // Upload new file
      const storageRef = ref(storage, `floorplans/${floorPlan.householdId}/${data.file.name}`);
      const snapshot = await uploadBytes(storageRef, data.file);
      const fileUrl = await getDownloadURL(snapshot.ref);

      updateData.fileUrl = fileUrl;
      updateData.fileSize = data.file.size;
      updateData.fileType = data.file.type;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating floor plan:', error);
    throw new Error('Failed to update floor plan');
  }
};

// Delete floor plan
export const deleteFloorPlan = async (floorPlanId: string): Promise<void> => {
  try {
    const floorPlan = await getFloorPlan(floorPlanId);
    if (!floorPlan) throw new Error('Floor plan not found');

    // Delete file from storage
    if (floorPlan.fileUrl) {
      try {
        const fileRef = ref(storage, floorPlan.fileUrl);
        await deleteObject(fileRef);
      } catch (error) {
        console.warn('Failed to delete file from storage:', error);
      }
    }

    // Delete document from Firestore
    await deleteDoc(doc(db, 'floorPlans', floorPlanId));
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    throw new Error('Failed to delete floor plan');
  }
};

// Subscribe to floor plans changes
export const subscribeToFloorPlans = (
  householdId: string,
  callback: (floorPlans: FloorPlan[]) => void
) => {
  const q = query(
    collection(db, 'floorPlans'),
    where('householdId', '==', householdId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const floorPlans: FloorPlan[] = [];
    querySnapshot.forEach((doc) => {
      floorPlans.push({ id: doc.id, ...doc.data() } as FloorPlan);
    });
    callback(floorPlans);
  });
};

// Upload floor plan file and get URL
export const uploadFloorPlanFile = async (file: File, householdId: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `floorplans/${householdId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading floor plan file:', error);
    throw new Error('Failed to upload floor plan file');
  }
};

// Generate thumbnail from floor plan
export const generateFloorPlanThumbnail = async (fileUrl: string, householdId: string): Promise<string> => {
  try {
    // This is a simplified version - in a real implementation, you might want to use a server-side service
    // to generate thumbnails from 3D models or images
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // Create a canvas to generate thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Set canvas size for thumbnail
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and upload
        canvas.toBlob(async (thumbnailBlob) => {
          if (thumbnailBlob) {
            const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
            const thumbnailUrl = await uploadFloorPlanFile(thumbnailFile, householdId);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}; 