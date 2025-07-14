#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and basic functionality
 * 
 * Usage:
 * 1. Set up your environment variables
 * 2. Run: node scripts/test-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('households')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function testTables() {
  console.log('\n📋 Testing table access...');
  
  const tables = [
    'households',
    'chores',
    'bills',
    'rent_payments',
    'sensors',
    'nudges',
    'chat_messages',
    'notifications',
    'household_settings',
    'conflict_analyses',
    'conflict_coach_sessions'
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results.push({ table, status: 'error', message: error.message });
      } else {
        console.log(`✅ ${table}: Accessible`);
        results.push({ table, status: 'success' });
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      results.push({ table, status: 'error', message: error.message });
    }
  }

  return results;
}

async function testCRUD() {
  console.log('\n🔄 Testing CRUD operations...');
  
  try {
    // Test creating a household
    const testHousehold = {
      name: 'Test Household',
      address: '123 Test Street',
      members: ['test-user-1', 'test-user-2']
    };

    console.log('📝 Creating test household...');
    const { data: createData, error: createError } = await supabase
      .from('households')
      .insert(testHousehold)
      .select()
      .single();

    if (createError) {
      console.error('❌ Create failed:', createError.message);
      return false;
    }

    console.log('✅ Created household:', createData.id);

    // Test reading the household
    console.log('📖 Reading household...');
    const { data: readData, error: readError } = await supabase
      .from('households')
      .select('*')
      .eq('id', createData.id)
      .single();

    if (readError) {
      console.error('❌ Read failed:', readError.message);
      return false;
    }

    console.log('✅ Read household:', readData.name);

    // Test updating the household
    console.log('✏️  Updating household...');
    const { error: updateError } = await supabase
      .from('households')
      .update({ name: 'Updated Test Household' })
      .eq('id', createData.id);

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      return false;
    }

    console.log('✅ Updated household');

    // Test deleting the household
    console.log('🗑️  Deleting test household...');
    const { error: deleteError } = await supabase
      .from('households')
      .delete()
      .eq('id', createData.id);

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message);
      return false;
    }

    console.log('✅ Deleted test household');
    return true;

  } catch (error) {
    console.error('❌ CRUD test failed:', error.message);
    return false;
  }
}

async function testRealTime() {
  console.log('\n📡 Testing real-time subscriptions...');
  
  return new Promise((resolve) => {
    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'households'
        },
        (payload) => {
          console.log('✅ Real-time event received:', payload.eventType);
          channel.unsubscribe();
          resolve(true);
        }
      )
      .subscribe();

    // Create a test household to trigger the subscription
    setTimeout(async () => {
      try {
        await supabase
          .from('households')
          .insert({
            name: 'Real-time Test',
            address: '456 Test Ave',
            members: ['test-user']
          });

        // Clean up after 2 seconds
        setTimeout(async () => {
          await supabase
            .from('households')
            .delete()
            .eq('name', 'Real-time Test');
          
          if (!channel.subscribed) {
            console.log('⚠️  No real-time events received');
            resolve(false);
          }
        }, 2000);

      } catch (error) {
        console.error('❌ Real-time test failed:', error.message);
        resolve(false);
      }
    }, 1000);

    // Timeout after 5 seconds
    setTimeout(() => {
      if (channel.subscribed) {
        console.log('⚠️  Real-time test timed out');
        channel.unsubscribe();
        resolve(false);
      }
    }, 5000);
  });
}

async function runTests() {
  console.log('🧪 Starting Supabase tests...\n');

  const tests = [
    { name: 'Connection Test', fn: testConnection },
    { name: 'Table Access Test', fn: testTables },
    { name: 'CRUD Operations Test', fn: testCRUD },
    { name: 'Real-time Test', fn: testRealTime }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
      failedTests++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Supabase is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }

  return failedTests === 0;
}

// Run the tests
runTests().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
}); 