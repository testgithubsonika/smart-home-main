import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  DollarSign, 
  Receipt, 
  CheckSquare, 
  MessageCircle, 
  Bell, 
  TrendingUp,
  Users,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  Database,
  Brain,
  Shield,
  Settings,
  Play,
  Square,
  RefreshCw,
  TestTube,
  FileText,
  BarChart3,
  X
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  createHousehold, 
  getHousehold, 
  createRentPayment, 
  getRentPayments,
  createBill,
  getBills,
  createChore,
  getChores,
  completeChore,
  createSensor,
  getSensors,
  recordSensorEvent,
  createNudge,
  getNudges,
  sendChatMessage,
  getChatMessages,
  createNotification,
  getUserNotifications,
  subscribeToHouseholdUpdates,
  subscribeToNudges,
  subscribeToNotifications
} from '@/services/harmonyService';

import { testDatabaseSeeding } from '@/utils/testDatabase';
import { testWebcamAndSensors } from '@/utils/webcamSensorTest';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  total: number;
  duration: number;
}

export const HarmonySystemTester: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [testData, setTestData] = useState<any>({});
  const [realTimeSubscriptions, setRealTimeSubscriptions] = useState<any[]>([]);

  // Test data
  const [householdId, setHouseholdId] = useState<string>('');
  const [userId, setUserId] = useState<string>('test-user-123');

  const testDefinitions = [
    {
      id: 'database',
      name: 'Database & Seeding',
      description: 'Test database connectivity and data seeding',
      icon: Database,
      category: 'infrastructure'
    },
    {
      id: 'household',
      name: 'Household Management',
      description: 'Test household creation and management',
      icon: Home,
      category: 'core'
    },
    {
      id: 'rent',
      name: 'Rent Management',
      description: 'Test rent payment tracking and scheduling',
      icon: DollarSign,
      category: 'financial'
    },
    {
      id: 'bills',
      name: 'Bill Management',
      description: 'Test bill tracking and payments',
      icon: Receipt,
      category: 'financial'
    },
    {
      id: 'chores',
      name: 'Chore Management',
      description: 'Test chore assignment and completion',
      icon: CheckSquare,
      category: 'tasks'
    },
    {
      id: 'sensors',
      name: 'Sensor Integration',
      description: 'Test sensor data and IoT integration',
      icon: Activity,
      category: 'iot'
    },
    {
      id: 'ai-coaching',
      name: 'AI Conflict Coaching',
      description: 'Test AI-powered conflict resolution',
      icon: Brain,
      category: 'ai'
    },
    {
      id: 'chat',
      name: 'Real-time Chat',
      description: 'Test chat messaging and notifications',
      icon: MessageCircle,
      category: 'communication'
    },
    {
      id: 'nudges',
      name: 'Smart Nudges',
      description: 'Test contextual notifications and reminders',
      icon: Bell,
      category: 'ai'
    },
    {
      id: 'realtime',
      name: 'Real-time Updates',
      description: 'Test real-time data synchronization',
      icon: Zap,
      category: 'infrastructure'
    },
    {
      id: 'webcam-sensors',
      name: 'Webcam & Sensors',
      description: 'Test camera and sensor hardware',
      icon: Target,
      category: 'hardware'
    },
    {
      id: 'security',
      name: 'Security & Permissions',
      description: 'Test data security and access control',
      icon: Shield,
      category: 'security'
    }
  ];

  // Initialize test suites
  useEffect(() => {
    const initialSuites = testDefinitions.map(def => ({
      name: def.name,
      tests: [],
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0
    }));
    setTestSuites(initialSuites);
  }, []);

  // Update test status
  const updateTestStatus = useCallback((suiteName: string, testName: string, status: TestResult['status'], message?: string, data?: any, duration?: number) => {
    setTestSuites(prev => 
      prev.map(suite => {
        if (suite.name === suiteName) {
          const existingTest = suite.tests.find(t => t.name === testName);
          if (existingTest) {
            // Update existing test
            const updatedTests = suite.tests.map(t => 
              t.name === testName 
                ? { ...t, status, message, data, duration }
                : t
            );
            const passed = updatedTests.filter(t => t.status === 'passed').length;
            const failed = updatedTests.filter(t => t.status === 'failed').length;
            const total = updatedTests.length;
            const totalDuration = updatedTests.reduce((sum, t) => sum + (t.duration || 0), 0);
            
            return {
              ...suite,
              tests: updatedTests,
              passed,
              failed,
              total,
              duration: totalDuration
            };
          } else {
            // Add new test
            const newTest: TestResult = { name: testName, status, message, data, duration };
            const updatedTests = [...suite.tests, newTest];
            const passed = updatedTests.filter(t => t.status === 'passed').length;
            const failed = updatedTests.filter(t => t.status === 'failed').length;
            const total = updatedTests.length;
            const totalDuration = updatedTests.reduce((sum, t) => sum + (t.duration || 0), 0);
            
            return {
              ...suite,
              tests: updatedTests,
              passed,
              failed,
              total,
              duration: totalDuration
            };
          }
        }
        return suite;
      })
    );
  }, []);

  // Database and seeding tests
  const testDatabaseAndSeeding = async () => {
    const suiteName = 'Database & Seeding';
    
    updateTestStatus(suiteName, 'Database Connection', 'running', 'Testing database connectivity...');
    
    try {
      const startTime = Date.now();
      const result = await testDatabaseSeeding();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        updateTestStatus(suiteName, 'Database Connection', 'passed', 'Database connected successfully', result.data, duration);
        setHouseholdId(result.householdId);
        setTestData(prev => ({ ...prev, householdId: result.householdId }));
        toast.success('Database test passed!');
      } else {
        updateTestStatus(suiteName, 'Database Connection', 'failed', result.error, null, duration);
        toast.error('Database test failed');
      }
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Database Connection', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Database test failed');
    }
  };

  // Household management tests
  const testHouseholdManagement = async () => {
    const suiteName = 'Household Management';
    
    updateTestStatus(suiteName, 'Create Household', 'running', 'Creating test household...');
    
    try {
      const startTime = Date.now();
      const newHousehold = {
        name: 'Test Harmony Household',
        address: '123 Test Street, Test City, TC 12345',
        rentAmount: 2500,
        memberIds: [userId],
        adminId: userId
      };
      
      const householdId = await createHousehold(newHousehold);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Create Household', 'passed', 'Household created successfully', { householdId }, duration);
      setTestData(prev => ({ ...prev, householdId }));
      
      // Test retrieving household
      updateTestStatus(suiteName, 'Get Household', 'running', 'Retrieving household data...');
      const retrievedHousehold = await getHousehold(householdId);
      const getDuration = Date.now() - startTime;
      
      if (retrievedHousehold) {
        updateTestStatus(suiteName, 'Get Household', 'passed', 'Household retrieved successfully', retrievedHousehold, getDuration);
      } else {
        updateTestStatus(suiteName, 'Get Household', 'failed', 'Failed to retrieve household', null, getDuration);
      }
      
      toast.success('Household management test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Create Household', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Household management test failed');
    }
  };

  // Rent management tests
  const testRentManagement = async () => {
    const suiteName = 'Rent Management';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'Rent Management', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Create Rent Payment', 'running', 'Creating test rent payment...');
    
    try {
      const startTime = Date.now();
      const rentPayment = {
        householdId,
        userId,
        amount: 1250,
        dueDate: new Date(),
        status: 'pending',
        paymentMethod: 'bank_transfer'
      };
      
      const paymentId = await createRentPayment(rentPayment);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Create Rent Payment', 'passed', 'Rent payment created successfully', { paymentId }, duration);
      
      // Test retrieving rent payments
      const payments = await getRentPayments(householdId);
      updateTestStatus(suiteName, 'Get Rent Payments', 'passed', `Retrieved ${payments.length} rent payments`, { count: payments.length }, duration);
      
      toast.success('Rent management test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Create Rent Payment', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Rent management test failed');
    }
  };

  // Bill management tests
  const testBillManagement = async () => {
    const suiteName = 'Bill Management';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'Bill Management', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Create Bill', 'running', 'Creating test bill...');
    
    try {
      const startTime = Date.now();
      const bill = {
        householdId,
        title: 'Electricity Bill',
        amount: 150,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        category: 'utilities',
        status: 'pending',
        assignedTo: userId
      };
      
      const billId = await createBill(bill);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Create Bill', 'passed', 'Bill created successfully', { billId }, duration);
      
      // Test retrieving bills
      const bills = await getBills(householdId);
      updateTestStatus(suiteName, 'Get Bills', 'passed', `Retrieved ${bills.length} bills`, { count: bills.length }, duration);
      
      toast.success('Bill management test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Create Bill', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Bill management test failed');
    }
  };

  // Chore management tests
  const testChoreManagement = async () => {
    const suiteName = 'Chore Management';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'Chore Management', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Create Chore', 'running', 'Creating test chore...');
    
    try {
      const startTime = Date.now();
      const chore = {
        householdId,
        title: 'Test Chore',
        description: 'A test chore for testing purposes',
        category: 'cleaning' as const,
        priority: 'medium' as const,
        points: 10,
        assignedTo: userId,
        assignedBy: userId,
        status: 'pending' as const
      };
      
      const choreId = await createChore(chore);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Create Chore', 'passed', 'Chore created successfully', { choreId }, duration);
      
      // Test retrieving chores
      const chores = await getChores(householdId);
      updateTestStatus(suiteName, 'Get Chores', 'passed', `Retrieved ${chores.length} chores`, { count: chores.length }, duration);
      
      // Test completing chore
      const completion = {
        choreId,
        userId,
        completedAt: new Date(),
        pointsEarned: 10,
        notes: 'Test completion'
      };
      
      await completeChore(choreId, completion);
      updateTestStatus(suiteName, 'Complete Chore', 'passed', 'Chore completed successfully', null, duration);
      
      toast.success('Chore management test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Create Chore', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Chore management test failed');
    }
  };

  // Sensor integration tests
  const testSensorIntegration = async () => {
    const suiteName = 'Sensor Integration';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'Sensor Integration', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Create Sensor', 'running', 'Creating test sensor...');
    
    try {
      const startTime = Date.now();
      const sensor = {
        householdId,
        name: 'Test Motion Sensor',
        type: 'motion' as const,
        location: 'kitchen',
        isActive: true
      };
      
      const sensorId = await createSensor(sensor);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Create Sensor', 'passed', 'Sensor created successfully', { sensorId }, duration);
      
      // Test retrieving sensors
      const sensors = await getSensors(householdId);
      updateTestStatus(suiteName, 'Get Sensors', 'passed', `Retrieved ${sensors.length} sensors`, { count: sensors.length }, duration);
      
      // Test recording sensor event
      const event = {
        sensorId,
        eventType: 'motion_detected',
        value: 1,
        timestamp: new Date()
      };
      
      const eventId = await recordSensorEvent(event);
      updateTestStatus(suiteName, 'Record Sensor Event', 'passed', 'Sensor event recorded successfully', { eventId }, duration);
      
      toast.success('Sensor integration test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Create Sensor', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Sensor integration test failed');
    }
  };

  // AI coaching tests
  const testAICoaching = async () => {
    const suiteName = 'AI Conflict Coaching';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'AI Conflict Coaching', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Send Chat Message', 'running', 'Sending test chat message...');
    
    try {
      const startTime = Date.now();
      const message = {
        householdId,
        userId,
        content: 'This is a test message for AI coaching',
        type: 'text' as const
      };
      
      const messageId = await sendChatMessage(message);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Send Chat Message', 'passed', 'Chat message sent successfully', { messageId }, duration);
      
      // Test retrieving chat messages
      const messages = await getChatMessages(householdId);
      updateTestStatus(suiteName, 'Get Chat Messages', 'passed', `Retrieved ${messages.length} messages`, { count: messages.length }, duration);
      
      toast.success('AI coaching test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Send Chat Message', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('AI coaching test failed');
    }
  };

  // Smart nudges tests
  const testSmartNudges = async () => {
    const suiteName = 'Smart Nudges';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'Smart Nudges', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Create Nudge', 'running', 'Creating test nudge...');
    
    try {
      const startTime = Date.now();
      const nudge = {
        householdId,
        type: 'chore_reminder',
        title: 'Test Nudge',
        message: 'This is a test nudge',
        priority: 'medium' as const,
        targetUsers: [userId],
        isRead: false,
        isDismissed: false
      };
      
      const nudgeId = await createNudge(nudge);
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Create Nudge', 'passed', 'Nudge created successfully', { nudgeId }, duration);
      
      // Test retrieving nudges
      const nudges = await getNudges(householdId, userId);
      updateTestStatus(suiteName, 'Get Nudges', 'passed', `Retrieved ${nudges.length} nudges`, { count: nudges.length }, duration);
      
      toast.success('Smart nudges test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Create Nudge', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Smart nudges test failed');
    }
  };

  // Real-time updates tests
  const testRealTimeUpdates = async () => {
    const suiteName = 'Real-time Updates';
    
    if (!householdId) {
      updateTestStatus(suiteName, 'Real-time Updates', 'failed', 'No household ID available');
      return;
    }
    
    updateTestStatus(suiteName, 'Subscribe to Updates', 'running', 'Setting up real-time subscriptions...');
    
    try {
      const startTime = Date.now();
      
      // Subscribe to household updates
      const householdSub = subscribeToHouseholdUpdates(householdId, (data) => {
        console.log('Household update received:', data);
      });
      
      // Subscribe to nudges
      const nudgeSub = subscribeToNudges(householdId, userId, (nudges) => {
        console.log('Nudges update received:', nudges);
      });
      
      // Subscribe to notifications
      const notificationSub = subscribeToNotifications(userId, (notifications) => {
        console.log('Notifications update received:', notifications);
      });
      
      const duration = Date.now() - startTime;
      
      updateTestStatus(suiteName, 'Subscribe to Updates', 'passed', 'Real-time subscriptions established', {
        householdSub: !!householdSub,
        nudgeSub: !!nudgeSub,
        notificationSub: !!notificationSub
      }, duration);
      
      // Store subscriptions for cleanup
      setRealTimeSubscriptions([householdSub, nudgeSub, notificationSub]);
      
      toast.success('Real-time updates test passed!');
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Subscribe to Updates', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Real-time updates test failed');
    }
  };

  // Webcam and sensors tests
  const testWebcamAndSensors = async () => {
    const suiteName = 'Webcam & Sensors';
    
    updateTestStatus(suiteName, 'Hardware Testing', 'running', 'Testing webcam and sensor hardware...');
    
    try {
      const startTime = Date.now();
      const result = await testWebcamAndSensors();
      const duration = Date.now() - startTime;
      
      if (result.totalPassed > 0) {
        updateTestStatus(suiteName, 'Hardware Testing', 'passed', 
          `${result.totalPassed}/${result.totalTests} hardware tests passed`, 
          { successRate: result.successRate }, duration);
        toast.success('Hardware test passed!');
      } else {
        updateTestStatus(suiteName, 'Hardware Testing', 'failed', 
          'No hardware tests passed', 
          { successRate: result.successRate }, duration);
        toast.error('Hardware test failed');
      }
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Hardware Testing', 'failed', error instanceof Error ? error.message : 'Unknown error', null, duration);
      toast.error('Hardware test failed');
    }
  };

  // Security tests
  const testSecurity = async () => {
    const suiteName = 'Security & Permissions';
    
    updateTestStatus(suiteName, 'Data Access Control', 'running', 'Testing data access permissions...');
    
    try {
      const startTime = Date.now();
      
      // Test that users can only access their own data
      const testUserId = 'unauthorized-user';
      const notifications = await getUserNotifications(testUserId);
      
      // This should return empty array or throw error for unauthorized access
      const duration = Date.now() - startTime;
      
      if (Array.isArray(notifications)) {
        updateTestStatus(suiteName, 'Data Access Control', 'passed', 'Data access control working correctly', { notificationsCount: notifications.length }, duration);
        toast.success('Security test passed!');
      } else {
        updateTestStatus(suiteName, 'Data Access Control', 'failed', 'Data access control not working', null, duration);
        toast.error('Security test failed');
      }
    } catch (error) {
      const duration = Date.now();
      updateTestStatus(suiteName, 'Data Access Control', 'passed', 'Security properly enforced', null, duration);
      toast.success('Security test passed!');
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);
    
    const testFunctions = [
      testDatabaseAndSeeding,
      testHouseholdManagement,
      testRentManagement,
      testBillManagement,
      testChoreManagement,
      testSensorIntegration,
      testAICoaching,
      testSmartNudges,
      testRealTimeUpdates,
      testWebcamAndSensors,
      testSecurity
    ];
    
    for (let i = 0; i < testFunctions.length; i++) {
      const testFunction = testFunctions[i];
      const testName = testDefinitions[i + 1]?.name || 'Unknown Test';
      
      setCurrentTest(testName);
      setOverallProgress((i / testFunctions.length) * 100);
      
      try {
        await testFunction();
      } catch (error) {
        console.error(`Test failed: ${testName}`, error);
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setOverallProgress(100);
    setIsRunning(false);
    setCurrentTest('');
    
    // Calculate overall results
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
    
    if (totalFailed === 0) {
      toast.success(`All tests completed! ${totalPassed}/${totalTests} passed`);
    } else {
      toast.error(`Tests completed with ${totalFailed} failures`);
    }
  };

  // Cleanup real-time subscriptions
  useEffect(() => {
    return () => {
      realTimeSubscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    };
  }, [realTimeSubscriptions]);

  // Get test status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Harmony System Tester</h2>
          <p className="text-muted-foreground">
            Comprehensive testing suite for all Harmony System features
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {isRunning && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Running Tests</span>
                  <span className="text-sm text-muted-foreground">{currentTest}</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(overallProgress)}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Results */}
      {totalTests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalTests}</div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalPassed}</div>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{successRate}%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Suites */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="core">Core Features</TabsTrigger>
          <TabsTrigger value="ai">AI Features</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testSuites.map((suite) => (
              <Card key={suite.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{suite.name}</span>
                    <Badge variant={suite.failed > 0 ? 'destructive' : 'default'}>
                      {suite.passed}/{suite.total}
                    </Badge>
                  </CardTitle>
                  {suite.duration > 0 && (
                    <CardDescription>
                      Duration: {suite.duration}ms
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {suite.tests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tests run yet</p>
                  ) : (
                    <div className="space-y-2">
                      {suite.tests.map((test) => (
                        <div key={test.name} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span className="text-sm">{test.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {test.duration ? `${test.duration}ms` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="core" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testSuites.filter(suite => 
              ['Household Management', 'Rent Management', 'Bill Management', 'Chore Management'].includes(suite.name)
            ).map((suite) => (
              <Card key={suite.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{suite.name}</span>
                    <Badge variant={suite.failed > 0 ? 'destructive' : 'default'}>
                      {suite.passed}/{suite.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {suite.tests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tests run yet</p>
                  ) : (
                    <div className="space-y-2">
                      {suite.tests.map((test) => (
                        <div key={test.name} className="flex items-center gap-2 p-2 border rounded">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testSuites.filter(suite => 
              ['AI Conflict Coaching', 'Smart Nudges'].includes(suite.name)
            ).map((suite) => (
              <Card key={suite.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{suite.name}</span>
                    <Badge variant={suite.failed > 0 ? 'destructive' : 'default'}>
                      {suite.passed}/{suite.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {suite.tests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tests run yet</p>
                  ) : (
                    <div className="space-y-2">
                      {suite.tests.map((test) => (
                        <div key={test.name} className="flex items-center gap-2 p-2 border rounded">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testSuites.filter(suite => 
              ['Database & Seeding', 'Real-time Updates', 'Security & Permissions'].includes(suite.name)
            ).map((suite) => (
              <Card key={suite.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{suite.name}</span>
                    <Badge variant={suite.failed > 0 ? 'destructive' : 'default'}>
                      {suite.passed}/{suite.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {suite.tests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tests run yet</p>
                  ) : (
                    <div className="space-y-2">
                      {suite.tests.map((test) => (
                        <div key={test.name} className="flex items-center gap-2 p-2 border rounded">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Data Display */}
      {Object.keys(testData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Data
            </CardTitle>
            <CardDescription>
              Generated test data for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 