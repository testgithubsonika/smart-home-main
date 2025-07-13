import { checkDatabaseEmpty, setupDatabase } from './setupDatabase';

// Flag to prevent multiple executions
let hasRun = false;

/**
 * Automatically sets up the database if it's empty
 * This is useful for development and demo purposes
 */
export const autoSetupDatabase = async (): Promise<void> => {
  // Prevent multiple executions
  if (hasRun) {
    console.log('Auto-setup already completed. Skipping...');
    return;
  }
  
  try {
    console.log('Checking if database needs setup...');
    hasRun = true; // Set flag before checking to prevent race conditions
    
    const isEmpty = await checkDatabaseEmpty();
    
    if (isEmpty) {
      console.log('Database is empty. Setting up sample data...');
      await setupDatabase();
      console.log('Database auto-setup completed successfully!');
    } else {
      console.log('Database already has data. Skipping auto-setup.');
    }
  } catch (error) {
    console.error('Error during auto-setup:', error);
    // Reset flag on error so it can be retried
    hasRun = false;
    // Don't throw - this is just a convenience feature
  }
};

/**
 * Check if auto-setup should be enabled
 * Only enable in development mode
 */
export const shouldAutoSetup = (): boolean => {
  return import.meta.env.DEV === true;
}; 