// Comprehensive testing utility for all project components
import { supabase } from '@/lib/supabase';
import { testModelsAccessibility } from './testModels';

export interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  details?: any;
  timestamp: Date;
}

export interface ComprehensiveTestResults {
  supabase: {
    database: TestResult[];
    storage: TestResult[];
  };
  models: TestResult[];
  apis: TestResult[];
  components: TestResult[];
  overall: {
    success: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
}

// Test Supabase Database
export const testSupabaseDatabase = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  
  // Test 1: Basic connection
  try {
    const { data, error } = await supabase
      .from('households')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    results.push({
      name: 'Supabase Database Connection',
      success: true,
      details: 'Successfully connected to Supabase Database',
      timestamp: new Date()
    });
  } catch (error) {
    results.push({
      name: 'Supabase Database Connection',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  // Test 2: Check tables
  const tablesToTest = [
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
  
  for (const tableName of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      results.push({
        name: `Supabase Table: ${tableName}`,
        success: true,
        details: 'Table accessible',
        timestamp: new Date()
      });
    } catch (error) {
      results.push({
        name: `Supabase Table: ${tableName}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  return results;
};

// Test Supabase Storage
export const testSupabaseStorage = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  
  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.storage
      .from('test')
      .list();
    
    if (error) {
      throw error;
    }
    
    results.push({
      name: 'Supabase Storage Connection',
      success: true,
      details: 'Successfully connected to Supabase Storage',
      timestamp: new Date()
    });
  } catch (error) {
    results.push({
      name: 'Supabase Storage Connection',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  // Test 2: Check storage buckets
  const bucketsToTest = ['floorplans', 'avatars', 'documents'];
  
  for (const bucket of bucketsToTest) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list();
      
      if (error) {
        throw error;
      }
      
      results.push({
        name: `Storage Bucket: ${bucket}`,
        success: true,
        details: `${data?.length || 0} items found`,
        timestamp: new Date()
      });
    } catch (error) {
      results.push({
        name: `Storage Bucket: ${bucket}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  return results;
};

// Test AI Models
export const testModels = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  
  // Test 1: Face-api.js models
  try {
    const faceApiTest = await testModelsAccessibility();
    results.push({
      name: 'Face-api.js Models',
      success: faceApiTest.success,
      error: faceApiTest.errors.length > 0 ? faceApiTest.errors.join(', ') : undefined,
      details: faceApiTest.details,
      timestamp: new Date()
    });
  } catch (error) {
    results.push({
      name: 'Face-api.js Models',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  // Test 2: Sample floor plan model
  try {
    const response = await fetch('/sample-floorplan.json');
    if (response.ok) {
      const data = await response.json();
      results.push({
        name: 'Sample Floor Plan Model',
        success: true,
        details: `Model loaded successfully with ${Object.keys(data).length} properties`,
        timestamp: new Date()
      });
    } else {
      results.push({
        name: 'Sample Floor Plan Model',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      name: 'Sample Floor Plan Model',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  return results;
};

// Test APIs
export const testAPIs = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  
  // Test 1: Gemini API (if API key is available)
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiApiKey}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, this is a test message.'
            }]
          }]
        })
      });
      
      if (response.ok) {
        results.push({
          name: 'Gemini API',
          success: true,
          details: 'API key valid and endpoint accessible',
          timestamp: new Date()
        });
      } else {
        results.push({
          name: 'Gemini API',
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      results.push({
        name: 'Gemini API',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  } else {
    results.push({
      name: 'Gemini API',
      success: false,
      error: 'API key not configured (VITE_GEMINI_API_KEY)',
      timestamp: new Date()
    });
  }

  // Test 2: Geolocation API
  try {
    if ('geolocation' in navigator) {
      results.push({
        name: 'Geolocation API',
        success: true,
        details: 'Geolocation API available in browser',
        timestamp: new Date()
      });
    } else {
      results.push({
        name: 'Geolocation API',
        success: false,
        error: 'Geolocation API not available in browser',
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      name: 'Geolocation API',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  // Test 3: Media Devices API
  try {
    if ('mediaDevices' in navigator) {
      results.push({
        name: 'Media Devices API',
        success: true,
        details: 'Media Devices API available in browser',
        timestamp: new Date()
      });
    } else {
      results.push({
        name: 'Media Devices API',
        success: false,
        error: 'Media Devices API not available in browser',
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      name: 'Media Devices API',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  return results;
};

// Test Components
export const testComponents = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  
  // Test 1: Check if required libraries are available
  try {
    // Test Three.js
    if (typeof window !== 'undefined' && 'THREE' in window) {
      results.push({
        name: 'Three.js Library',
        success: true,
        details: 'Three.js available for 3D rendering',
        timestamp: new Date()
      });
    } else {
      results.push({
        name: 'Three.js Library',
        success: false,
        error: 'Three.js not available',
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      name: 'Three.js Library',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  // Test 2: Check if face-api.js is available
  try {
    if (typeof window !== 'undefined' && 'faceapi' in window) {
      results.push({
        name: 'Face-api.js Library',
        success: true,
        details: 'Face-api.js available for face recognition',
        timestamp: new Date()
      });
    } else {
      results.push({
        name: 'Face-api.js Library',
        success: false,
        error: 'Face-api.js not available',
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      name: 'Face-api.js Library',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  // Test 3: Check if MediaPipe is available
  try {
    if (typeof window !== 'undefined' && 'FaceMesh' in window) {
      results.push({
        name: 'MediaPipe Library',
        success: true,
        details: 'MediaPipe available for face mesh',
        timestamp: new Date()
      });
    } else {
      results.push({
        name: 'MediaPipe Library',
        success: false,
        error: 'MediaPipe not available',
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      name: 'MediaPipe Library',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }

  return results;
};

// Run all tests
export const runComprehensiveTests = async (): Promise<ComprehensiveTestResults> => {
  console.log('🚀 Starting comprehensive tests...');
  
  const startTime = Date.now();
  
  // Run all test suites
  const [databaseResults, storageResults, modelResults, apiResults, componentResults] = await Promise.all([
    testSupabaseDatabase(),
    testSupabaseStorage(),
    testModels(),
    testAPIs(),
    testComponents()
  ]);

  // Calculate overall results
  const allResults = [
    ...databaseResults,
    ...storageResults,
    ...modelResults,
    ...apiResults,
    ...componentResults
  ];

  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const overallSuccess = failedTests === 0;

  const results: ComprehensiveTestResults = {
    supabase: {
      database: databaseResults,
      storage: storageResults
    },
    models: modelResults,
    apis: apiResults,
    components: componentResults,
    overall: {
      success: overallSuccess,
      totalTests,
      passedTests,
      failedTests
    }
  };

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Log results
  console.log(`\n📊 Test Results Summary:`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`🎯 Overall: ${overallSuccess ? 'SUCCESS' : 'FAILED'}`);

  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    allResults.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.name}: ${result.error}`);
    });
  }

  console.log('\n📋 Detailed Results:');
  console.log(JSON.stringify(results, null, 2));

  return results;
}; 