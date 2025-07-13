import { seedDatabase, seedService } from '@/services/seedService';
import { getHousehold, getChores, getBills, getSensors } from '@/services/harmonyService';

export const testDatabaseSeeding = async () => {
  try {
    console.log('🧪 Testing database seeding...');
    
    // Seed the database
    await seedDatabase();
    console.log('✅ Database seeded successfully');
    
    // Get the seeded household ID
    const seededIds = seedService.getSeededIds();
    const householdId = seededIds.get('household1');
    
    if (!householdId) {
      throw new Error('Household ID not found in seeded data');
    }
    
    console.log('📊 Testing data retrieval...');
    
    // Test retrieving seeded data
    const household = await getHousehold(householdId);
    if (!household) {
      throw new Error('Failed to retrieve seeded household');
    }
    console.log('✅ Household retrieved:', household.name);
    
    const chores = await getChores(householdId);
    console.log('✅ Chores retrieved:', chores.length, 'chores');
    
    const bills = await getBills(householdId);
    console.log('✅ Bills retrieved:', bills.length, 'bills');
    
    const sensors = await getSensors(householdId);
    console.log('✅ Sensors retrieved:', sensors.length, 'sensors');
    
    console.log('🎉 All database tests passed!');
    
    return {
      success: true,
      householdId,
      data: {
        household,
        chores: chores.length,
        bills: bills.length,
        sensors: sensors.length
      }
    };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testDatabaseSeeding = testDatabaseSeeding;
} 