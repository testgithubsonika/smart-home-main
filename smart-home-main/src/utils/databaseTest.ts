import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface DatabaseTestResult {
  firestore: {
    connected: boolean;
    canRead: boolean;
    canWrite: boolean;
    error?: string;
  };
  storage: {
    connected: boolean;
    canUpload: boolean;
    canDownload: boolean;
    error?: string;
  };
  overall: 'working' | 'partial' | 'failed';
}

export class DatabaseTester {
  private static instance: DatabaseTester;

  private constructor() {}

  public static getInstance(): DatabaseTester {
    if (!DatabaseTester.instance) {
      DatabaseTester.instance = new DatabaseTester();
    }
    return DatabaseTester.instance;
  }

  public async testDatabase(): Promise<DatabaseTestResult> {
    const result: DatabaseTestResult = {
      firestore: { connected: false, canRead: false, canWrite: false },
      storage: { connected: false, canUpload: false, canDownload: false },
      overall: 'failed'
    };

    // Test Firestore
    try {
      // Test write
      const testDoc = await addDoc(collection(db, 'test'), {
        timestamp: new Date(),
        test: true,
        message: 'Database connectivity test'
      });
      result.firestore.canWrite = true;

      // Test read
      const querySnapshot = await getDocs(collection(db, 'test'));
      result.firestore.canRead = true;

      // Clean up test document
      await deleteDoc(doc(db, 'test', testDoc.id));
      result.firestore.connected = true;
    } catch (error) {
      result.firestore.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Firestore test failed:', error);
    }

    // Test Storage
    try {
      // Create test file
      const testBlob = new Blob(['Database connectivity test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      // Test upload
      const storageRef = ref(storage, 'test/test.txt');
      const uploadSnapshot = await uploadBytes(storageRef, testFile);
      result.storage.canUpload = true;

      // Test download
      const downloadURL = await getDownloadURL(uploadSnapshot.ref);
      const response = await fetch(downloadURL);
      if (response.ok) {
        result.storage.canDownload = true;
      }

      // Clean up test file
      await deleteObject(storageRef);
      result.storage.connected = true;
    } catch (error) {
      result.storage.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Storage test failed:', error);
    }

    // Determine overall status
    if (result.firestore.connected && result.storage.connected) {
      result.overall = 'working';
    } else if (result.firestore.connected || result.storage.connected) {
      result.overall = 'partial';
    } else {
      result.overall = 'failed';
    }

    return result;
  }

  public async testSpecificCollections(): Promise<{
    [collectionName: string]: { exists: boolean; canRead: boolean; canWrite: boolean; error?: string };
  }> {
    const collections = [
      'households',
      'floorPlans',
      'listings',
      'chores',
      'bills',
      'sensors',
      'notifications',
      'users'
    ];

    const results: { [key: string]: { exists: boolean; canRead: boolean; canWrite: boolean; error?: string } } = {};

    for (const collectionName of collections) {
      try {
        // Test if collection exists and can be read
        const querySnapshot = await getDocs(collection(db, collectionName));
        results[collectionName] = { exists: true, canRead: true, canWrite: false };

        // Test write permission (only for test collections)
        if (collectionName === 'test') {
          try {
            const testDoc = await addDoc(collection(db, collectionName), {
              test: true,
              timestamp: new Date()
            });
            await deleteDoc(doc(db, collectionName, testDoc.id));
            results[collectionName].canWrite = true;
          } catch (writeError) {
            results[collectionName].error = writeError instanceof Error ? writeError.message : 'Write failed';
          }
        }
      } catch (error) {
        results[collectionName] = {
          exists: false,
          canRead: false,
          canWrite: false,
          error: error instanceof Error ? error.message : 'Collection not accessible'
        };
      }
    }

    return results;
  }

  public async testFloorPlanOperations(): Promise<{
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    error?: string;
  }> {
    const result = {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false
    };

    try {
      // Test create
      const testFloorPlan = {
        householdId: 'test-household',
        userId: 'test-user',
        name: 'Test Floor Plan',
        fileUrl: 'https://example.com/test.json',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'floorPlans'), testFloorPlan);
      result.canCreate = true;

      // Test read
      const docSnap = await getDocs(collection(db, 'floorPlans'));
      result.canRead = true;

      // Test update
      await addDoc(collection(db, 'floorPlans'), {
        ...testFloorPlan,
        name: 'Updated Test Floor Plan'
      });
      result.canUpdate = true;

      // Test delete (clean up test documents)
      const testDocs = await getDocs(collection(db, 'floorPlans'));
      const deletePromises = testDocs.docs
        .filter(doc => doc.data().householdId === 'test-household')
        .map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      result.canDelete = true;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Floor plan operations failed';
      console.error('Floor plan test failed:', error);
    }

    return result;
  }

  public async testStorageOperations(): Promise<{
    canUpload: boolean;
    canDownload: boolean;
    canDelete: boolean;
    error?: string;
  }> {
    const result = {
      canUpload: false,
      canDownload: false,
      canDelete: false
    };

    try {
      // Test upload
      const testBlob = new Blob(['Test floor plan data'], { type: 'application/json' });
      const testFile = new File([testBlob], 'test-floorplan.json', { type: 'application/json' });
      
      const storageRef = ref(storage, 'test/test-floorplan.json');
      const uploadSnapshot = await uploadBytes(storageRef, testFile);
      result.canUpload = true;

      // Test download
      const downloadURL = await getDownloadURL(uploadSnapshot.ref);
      const response = await fetch(downloadURL);
      if (response.ok) {
        result.canDownload = true;
      }

      // Test delete
      await deleteObject(storageRef);
      result.canDelete = true;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Storage operations failed';
      console.error('Storage test failed:', error);
    }

    return result;
  }

  public getDatabaseStatus(): Promise<{
    connected: boolean;
    collections: string[];
    error?: string;
  }> {
    return new Promise(async (resolve) => {
      try {
        const collections = [
          'households',
          'floorPlans',
          'listings',
          'chores',
          'bills',
          'sensors',
          'notifications',
          'users'
        ];

        const accessibleCollections: string[] = [];

        for (const collectionName of collections) {
          try {
            await getDocs(collection(db, collectionName));
            accessibleCollections.push(collectionName);
          } catch (error) {
            console.warn(`Collection ${collectionName} not accessible:`, error);
          }
        }

        resolve({
          connected: accessibleCollections.length > 0,
          collections: accessibleCollections
        });
      } catch (error) {
        resolve({
          connected: false,
          collections: [],
          error: error instanceof Error ? error.message : 'Database connection failed'
        });
      }
    });
  }
}

// Export singleton instance
export const databaseTester = DatabaseTester.getInstance();

// Convenience functions
export const testDatabase = () => databaseTester.testDatabase();
export const testCollections = () => databaseTester.testSpecificCollections();
export const testFloorPlans = () => databaseTester.testFloorPlanOperations();
export const testStorage = () => databaseTester.testStorageOperations();
export const getDatabaseStatus = () => databaseTester.getDatabaseStatus(); 