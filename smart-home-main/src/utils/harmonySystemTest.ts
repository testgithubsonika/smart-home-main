/**
 * Harmony System Test Utilities
 * 
 * These functions can be run in the browser console to test
 * all Harmony System features including database, AI, and real-time functionality.
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste these functions
 * 3. Run: testHarmonySystem()
 */

interface HarmonyTestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
  duration?: number;
}

interface HarmonyTestSuite {
  name: string;
  tests: HarmonyTestResult[];
  passed: number;
  failed: number;
  total: number;
  duration: number;
}

class HarmonySystemTestRunner {
  private results: HarmonyTestSuite[] = [];
  private testData: any = {};

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const colors = {
      info: 'color: #3b82f6',
      success: 'color: #10b981',
      warning: 'color: #f59e0b',
      error: 'color: #ef4444'
    };
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`%c${icons[type]} ${message}`, colors[type]);
  }

  private async runTest(name: string, testFn: () => Promise<boolean>, message?: string): Promise<HarmonyTestResult> {
    const startTime = Date.now();
    try {
      const success = await testFn();
      const duration = Date.now() - startTime;
      const result: HarmonyTestResult = {
        name,
        success,
        message: message || (success ? 'Test passed' : 'Test failed'),
        duration
      };
      
      if (success) {
        this.log(`${name}: ${result.message}`, 'success');
      } else {
        this.log(`${name}: ${result.message}`, 'error');
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: HarmonyTestResult = {
        name,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
      
      this.log(`${name}: ${result.message}`, 'error');
      return result;
    }
  }

  async testDatabaseConnection(): Promise<HarmonyTestSuite> {
    this.log('Testing Database Connection...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    
    // Test Supabase connection
    tests.push(await this.runTest(
      'Supabase Connection',
      async () => {
        // Import Supabase client
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase.from('households').select('count').limit(1);
        return !error;
      },
      'Check if Supabase connection is working'
    ));

    // Test database seeding
    tests.push(await this.runTest(
      'Database Seeding',
      async () => {
        const { testDatabaseSeeding } = await import('@/utils/testDatabase');
        const result = await testDatabaseSeeding();
        if (result.success) {
          this.testData.householdId = result.householdId;
          this.testData.databaseData = result.data;
        }
        return result.success;
      },
      'Test database seeding functionality'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'Database Connection',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async testHouseholdManagement(): Promise<HarmonyTestSuite> {
    this.log('Testing Household Management...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    
    if (!this.testData.householdId) {
      tests.push({
        name: 'Household Management',
        success: false,
        message: 'No household ID available from database test',
        duration: 0
      });
    } else {
      // Test household retrieval
      tests.push(await this.runTest(
        'Get Household',
        async () => {
          const { getHousehold } = await import('@/services/harmonyService');
          const household = await getHousehold(this.testData.householdId);
          return !!household;
        },
        'Test household retrieval functionality'
      ));

      // Test household creation
      tests.push(await this.runTest(
        'Create Household',
        async () => {
          const { createHousehold } = await import('@/services/harmonyService');
          const newHousehold = {
            name: 'Test Harmony Household',
            address: '123 Test Street, Test City, TC 12345',
            rentAmount: 2500,
            memberIds: ['test-user-123'],
            adminId: 'test-user-123'
          };
          
          const householdId = await createHousehold(newHousehold);
          this.testData.newHouseholdId = householdId;
          return !!householdId;
        },
        'Test household creation functionality'
      ));
    }

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'Household Management',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async testFinancialManagement(): Promise<HarmonyTestSuite> {
    this.log('Testing Financial Management...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    const householdId = this.testData.householdId || this.testData.newHouseholdId;
    
    if (!householdId) {
      tests.push({
        name: 'Financial Management',
        success: false,
        message: 'No household ID available',
        duration: 0
      });
    } else {
      // Test rent payment creation
      tests.push(await this.runTest(
        'Create Rent Payment',
        async () => {
          const { createRentPayment } = await import('@/services/harmonyService');
          const rentPayment = {
            householdId,
            userId: 'test-user-123',
            amount: 1250,
            dueDate: new Date(),
            status: 'pending',
            paymentMethod: 'bank_transfer'
          };
          
          const paymentId = await createRentPayment(rentPayment);
          this.testData.rentPaymentId = paymentId;
          return !!paymentId;
        },
        'Test rent payment creation'
      ));

      // Test bill creation
      tests.push(await this.runTest(
        'Create Bill',
        async () => {
          const { createBill } = await import('@/services/harmonyService');
          const bill = {
            householdId,
            title: 'Electricity Bill',
            amount: 150,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'utilities',
            status: 'pending',
            assignedTo: 'test-user-123'
          };
          
          const billId = await createBill(bill);
          this.testData.billId = billId;
          return !!billId;
        },
        'Test bill creation'
      ));

      // Test data retrieval
      tests.push(await this.runTest(
        'Get Financial Data',
        async () => {
          const { getRentPayments, getBills } = await import('@/services/harmonyService');
          const [payments, bills] = await Promise.all([
            getRentPayments(householdId),
            getBills(householdId)
          ]);
          
          return payments.length > 0 || bills.length > 0;
        },
        'Test financial data retrieval'
      ));
    }

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'Financial Management',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async testChoreManagement(): Promise<HarmonyTestSuite> {
    this.log('Testing Chore Management...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    const householdId = this.testData.householdId || this.testData.newHouseholdId;
    
    if (!householdId) {
      tests.push({
        name: 'Chore Management',
        success: false,
        message: 'No household ID available',
        duration: 0
      });
    } else {
      // Test chore creation
      tests.push(await this.runTest(
        'Create Chore',
        async () => {
          const { createChore } = await import('@/services/harmonyService');
          const chore = {
            householdId,
            title: 'Test Chore',
            description: 'A test chore for testing purposes',
            category: 'cleaning' as const,
            priority: 'medium' as const,
            points: 10,
            assignedTo: 'test-user-123',
            assignedBy: 'test-user-123',
            status: 'pending' as const
          };
          
          const choreId = await createChore(chore);
          this.testData.choreId = choreId;
          return !!choreId;
        },
        'Test chore creation'
      ));

      // Test chore completion
      tests.push(await this.runTest(
        'Complete Chore',
        async () => {
          const { completeChore } = await import('@/services/harmonyService');
          if (!this.testData.choreId) return false;
          
          const completion = {
            choreId: this.testData.choreId,
            userId: 'test-user-123',
            completedAt: new Date(),
            pointsEarned: 10,
            notes: 'Test completion'
          };
          
          const completionId = await completeChore(this.testData.choreId, completion);
          return !!completionId;
        },
        'Test chore completion'
      ));

      // Test chore retrieval
      tests.push(await this.runTest(
        'Get Chores',
        async () => {
          const { getChores } = await import('@/services/harmonyService');
          const chores = await getChores(householdId);
          return chores.length > 0;
        },
        'Test chore retrieval'
      ));
    }

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'Chore Management',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async testSensorIntegration(): Promise<HarmonyTestSuite> {
    this.log('Testing Sensor Integration...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    const householdId = this.testData.householdId || this.testData.newHouseholdId;
    
    if (!householdId) {
      tests.push({
        name: 'Sensor Integration',
        success: false,
        message: 'No household ID available',
        duration: 0
      });
    } else {
      // Test sensor creation
      tests.push(await this.runTest(
        'Create Sensor',
        async () => {
          const { createSensor } = await import('@/services/harmonyService');
          const sensor = {
            householdId,
            name: 'Test Motion Sensor',
            type: 'motion' as const,
            location: 'kitchen',
            isActive: true
          };
          
          const sensorId = await createSensor(sensor);
          this.testData.sensorId = sensorId;
          return !!sensorId;
        },
        'Test sensor creation'
      ));

      // Test sensor event recording
      tests.push(await this.runTest(
        'Record Sensor Event',
        async () => {
          const { recordSensorEvent } = await import('@/services/harmonyService');
          if (!this.testData.sensorId) return false;
          
          const event = {
            sensorId: this.testData.sensorId,
            eventType: 'motion_detected',
            value: 1,
            timestamp: new Date()
          };
          
          const eventId = await recordSensorEvent(event);
          return !!eventId;
        },
        'Test sensor event recording'
      ));

      // Test sensor retrieval
      tests.push(await this.runTest(
        'Get Sensors',
        async () => {
          const { getSensors } = await import('@/services/harmonyService');
          const sensors = await getSensors(householdId);
          return sensors.length > 0;
        },
        'Test sensor retrieval'
      ));
    }

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'Sensor Integration',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async testAIFeatures(): Promise<HarmonyTestSuite> {
    this.log('Testing AI Features...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    const householdId = this.testData.householdId || this.testData.newHouseholdId;
    
    if (!householdId) {
      tests.push({
        name: 'AI Features',
        success: false,
        message: 'No household ID available',
        duration: 0
      });
    } else {
      // Test chat message sending
      tests.push(await this.runTest(
        'Send Chat Message',
        async () => {
          const { sendChatMessage } = await import('@/services/harmonyService');
          const message = {
            householdId,
            userId: 'test-user-123',
            content: 'This is a test message for AI coaching',
            type: 'text' as const
          };
          
          const messageId = await sendChatMessage(message);
          this.testData.messageId = messageId;
          return !!messageId;
        },
        'Test chat message sending'
      ));

      // Test nudge creation
      tests.push(await this.runTest(
        'Create Smart Nudge',
        async () => {
          const { createNudge } = await import('@/services/harmonyService');
          const nudge = {
            householdId,
            type: 'chore_reminder',
            title: 'Test Nudge',
            message: 'This is a test nudge',
            priority: 'medium' as const,
            targetUsers: ['test-user-123'],
            isRead: false,
            isDismissed: false
          };
          
          const nudgeId = await createNudge(nudge);
          this.testData.nudgeId = nudgeId;
          return !!nudgeId;
        },
        'Test smart nudge creation'
      ));

      // Test AI model accessibility
      tests.push(await this.runTest(
        'AI Models Accessible',
        async () => {
          try {
            const response = await fetch('/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-weights_manifest.json');
            return response.ok;
          } catch (error) {
            return false;
          }
        },
        'Check if AI models are accessible'
      ));
    }

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'AI Features',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async testRealTimeFeatures(): Promise<HarmonyTestSuite> {
    this.log('Testing Real-time Features...', 'info');
    
    const tests: HarmonyTestResult[] = [];
    const householdId = this.testData.householdId || this.testData.newHouseholdId;
    
    if (!householdId) {
      tests.push({
        name: 'Real-time Features',
        success: false,
        message: 'No household ID available',
        duration: 0
      });
    } else {
      // Test real-time subscriptions
      tests.push(await this.runTest(
        'Real-time Subscriptions',
        async () => {
          const { subscribeToHouseholdUpdates } = await import('@/services/harmonyService');
          const subscription = subscribeToHouseholdUpdates(householdId, (data) => {
            console.log('Real-time update received:', data);
          });
          
          // Store subscription for cleanup
          this.testData.subscriptions = this.testData.subscriptions || [];
          this.testData.subscriptions.push(subscription);
          
          return !!subscription;
        },
        'Test real-time subscription setup'
      ));

      // Test notification creation
      tests.push(await this.runTest(
        'Create Notification',
        async () => {
          const { createNotification } = await import('@/services/harmonyService');
          const notification = {
            userId: 'test-user-123',
            title: 'Test Notification',
            message: 'This is a test notification',
            type: 'info' as const,
            isRead: false
          };
          
          const notificationId = await createNotification(notification);
          this.testData.notificationId = notificationId;
          return !!notificationId;
        },
        'Test notification creation'
      ));
    }

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const duration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      name: 'Real-time Features',
      tests,
      passed,
      failed,
      total: tests.length,
      duration
    };
  }

  async runAllTests(): Promise<any> {
    this.log('🚀 Starting Harmony System Tests...', 'info');
    
    const startTime = Date.now();
    
    // Run all test suites
    this.results.push(await this.testDatabaseConnection());
    this.results.push(await this.testHouseholdManagement());
    this.results.push(await this.testFinancialManagement());
    this.results.push(await this.testChoreManagement());
    this.results.push(await this.testSensorIntegration());
    this.results.push(await this.testAIFeatures());
    this.results.push(await this.testRealTimeFeatures());
    
    // Generate summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    const totalTests = this.results.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    
    this.log('📊 Harmony System Test Results Summary', 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${totalPassed}`, 'success');
    this.log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'error' : 'success');
    this.log(`Duration: ${duration}s`, 'info');
    
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, totalFailed > 0 ? 'warning' : 'success');
    
    // Detailed results
    this.log('📋 Detailed Results:', 'info');
    this.results.forEach(suite => {
      this.log(`${suite.name}: ${suite.passed}/${suite.total} passed`, suite.failed > 0 ? 'warning' : 'success');
      suite.tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`  ${status} ${test.name}: ${test.message} (${test.duration}ms)`);
      });
    });
    
    // Recommendations
    if (totalFailed > 0) {
      this.log('💡 Recommendations:', 'warning');
      this.log('• Check Supabase configuration', 'info');
      this.log('• Verify database connectivity', 'info');
      this.log('• Ensure all services are running', 'info');
      this.log('• Check AI model accessibility', 'info');
    } else {
      this.log('🎉 All Harmony System tests passed!', 'success');
    }
    
    // Cleanup subscriptions
    if (this.testData.subscriptions) {
      this.testData.subscriptions.forEach((sub: any) => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    }
    
    // Return results for programmatic access
    return {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate),
      duration: parseFloat(duration),
      suites: this.results,
      testData: this.testData
    };
  }
}

// Global function for easy access
export const testHarmonySystem = async () => {
  const runner = new HarmonySystemTestRunner();
  return await runner.runAllTests();
};

// Export the class for programmatic use
export { HarmonySystemTestRunner };

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  (window as any).testHarmonySystem = testHarmonySystem;
  (window as any).HarmonySystemTestRunner = HarmonySystemTestRunner;
  
  console.log('Harmony System Test Utilities loaded!');
  console.log('Run: testHarmonySystem() to start testing');
} 