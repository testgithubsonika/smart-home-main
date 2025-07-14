import { supabase } from '@/lib/supabase';

export interface DatabaseTestResult {
  supabase: {
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
      supabase: { connected: false, canRead: false, canWrite: false },
      storage: { connected: false, canUpload: false, canDownload: false },
      overall: 'failed'
    };

    // Test Supabase Database
    try {
      // Test write
      const { data: insertData, error: insertError } = await supabase
        .from('test_table')
        .insert({
          timestamp: new Date().toISOString(),
          test: true,
          message: 'Database connectivity test'
        })
        .select()
        .single();

      if (insertError) {
        // If test_table doesn't exist, try with households table
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('count')
          .limit(1);

        if (householdError) {
          throw householdError;
        }
        result.supabase.canRead = true;
        result.supabase.connected = true;
      } else {
        result.supabase.canWrite = true;
        result.supabase.canRead = true;

        // Clean up test data
        await supabase
          .from('test_table')
          .delete()
          .eq('id', insertData.id);

        result.supabase.connected = true;
      }
    } catch (error) {
      result.supabase.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Supabase test failed:', error);
    }

    // Test Supabase Storage
    try {
      // Create test file
      const testBlob = new Blob(['Database connectivity test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      // Test upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test')
        .upload('test.txt', testFile);

      if (uploadError) {
        throw uploadError;
      }
      result.storage.canUpload = true;

      // Test download
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('test')
        .download('test.txt');

      if (downloadError) {
        throw downloadError;
      }
      result.storage.canDownload = true;

      // Clean up test file
      await supabase.storage
        .from('test')
        .remove(['test.txt']);

      result.storage.connected = true;
    } catch (error) {
      result.storage.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Storage test failed:', error);
    }

    // Determine overall status
    if (result.supabase.connected && result.storage.connected) {
      result.overall = 'working';
    } else if (result.supabase.connected || result.storage.connected) {
      result.overall = 'partial';
    } else {
      result.overall = 'failed';
    }

    return result;
  }

  public async testSpecificTables(): Promise<{
    [tableName: string]: { exists: boolean; canRead: boolean; canWrite: boolean; error?: string };
  }> {
    const tables = [
      'households',
      'rent_payments',
      'rent_schedules',
      'bills',
      'chores',
      'chore_completions',
      'sensors',
      'sensor_events',
      'nudges',
      'chat_messages',
      'conflict_analyses',
      'conflict_coach_sessions',
      'notifications',
      'household_settings',
      'location_verifications',
      'webauthn_credentials'
    ];

    const results: { [key: string]: { exists: boolean; canRead: boolean; canWrite: boolean; error?: string } } = {};

    for (const tableName of tables) {
      try {
        // Test if table exists and can be read
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          results[tableName] = {
            exists: false,
            canRead: false,
            canWrite: false,
            error: error.message
          };
        } else {
          results[tableName] = { exists: true, canRead: true, canWrite: false };

          // Test write permission (only for test tables)
          if (tableName === 'test_table') {
            try {
              const { data: insertData, error: insertError } = await supabase
                .from(tableName)
                .insert({
                  test: true,
                  timestamp: new Date().toISOString()
                })
                .select()
                .single();

              if (!insertError && insertData) {
                await supabase
                  .from(tableName)
                  .delete()
                  .eq('id', insertData.id);
                results[tableName].canWrite = true;
              }
            } catch (writeError) {
              results[tableName].error = writeError instanceof Error ? writeError.message : 'Write failed';
            }
          }
        }
      } catch (error) {
        results[tableName] = {
          exists: false,
          canRead: false,
          canWrite: false,
          error: error instanceof Error ? error.message : 'Table not accessible'
        };
      }
    }

    return results;
  }

  public async testHouseholdOperations(): Promise<{
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
      const testHousehold = {
        name: 'Test Harmony Household',
        address: '123 Test Street, Test City, TC 12345',
        rentAmount: 2500,
        memberIds: ['test-user-123'],
        adminId: 'test-user-123'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('households')
        .insert(testHousehold)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      result.canCreate = true;

      // Test read
      const { data: readData, error: readError } = await supabase
        .from('households')
        .select('*')
        .eq('id', insertData.id)
        .single();

      if (readError) {
        throw readError;
      }
      result.canRead = true;

      // Test update
      const { data: updateData, error: updateError } = await supabase
        .from('households')
        .update({ name: 'Updated Test Household' })
        .eq('id', insertData.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      result.canUpdate = true;

      // Test delete (clean up test data)
      const { error: deleteError } = await supabase
        .from('households')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        throw deleteError;
      }
      result.canDelete = true;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Household operations failed';
      console.error('Household test failed:', error);
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
      const testBlob = new Blob(['Test household data'], { type: 'application/json' });
      const testFile = new File([testBlob], 'test-household.json', { type: 'application/json' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test')
        .upload('test-household.json', testFile);

      if (uploadError) {
        throw uploadError;
      }
      result.canUpload = true;

      // Test download
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('test')
        .download('test-household.json');

      if (downloadError) {
        throw downloadError;
      }
      result.canDownload = true;

      // Test delete
      await supabase.storage
        .from('test')
        .remove(['test-household.json']);

      result.canDelete = true;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Storage operations failed';
      console.error('Storage test failed:', error);
    }

    return result;
  }

  public getDatabaseStatus(): Promise<{
    connected: boolean;
    tables: string[];
    error?: string;
  }> {
    return new Promise(async (resolve) => {
      try {
        const tables = [
          'households',
          'rent_payments',
          'rent_schedules',
          'bills',
          'chores',
          'chore_completions',
          'sensors',
          'sensor_events',
          'nudges',
          'chat_messages',
          'conflict_analyses',
          'conflict_coach_sessions',
          'notifications',
          'household_settings',
          'location_verifications',
          'webauthn_credentials'
        ];

        const accessibleTables: string[] = [];

        for (const tableName of tables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .select('count')
              .limit(1);
            
            if (!error) {
              accessibleTables.push(tableName);
            }
          } catch (error) {
            console.warn(`Table ${tableName} not accessible:`, error);
          }
        }

        resolve({
          connected: accessibleTables.length > 0,
          tables: accessibleTables
        });
      } catch (error) {
        resolve({
          connected: false,
          tables: [],
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
export const testTables = () => databaseTester.testSpecificTables();
export const testHouseholds = () => databaseTester.testHouseholdOperations();
export const testStorage = () => databaseTester.testStorageOperations();
export const getDatabaseStatus = () => databaseTester.getDatabaseStatus(); 