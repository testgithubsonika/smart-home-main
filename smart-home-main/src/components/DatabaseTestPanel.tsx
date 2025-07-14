import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Camera, 
  Mic, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { testDatabase, testTables, testStorage, getDatabaseStatus } from '@/utils/databaseTest';
import { getPermissionState, requestCameraPermission, requestMicrophonePermission, requestBothPermissions } from '@/utils/permissionManager';
import { createFloorPlan, getFloorPlansByHousehold } from '@/services/floorPlanService';
import FloorPlanViewer from './FloorPlanViewer';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

export const DatabaseTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [permissionState, setPermissionState] = useState(getPermissionState());
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);

  useEffect(() => {
    // Initial database status check
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const status = await getDatabaseStatus();
      setDatabaseStatus(status);
    } catch (error) {
      console.error('Failed to check database status:', error);
    }
  };

  const addTestResult = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    setTestResults(prev => [
      ...prev.filter(r => r.name !== name),
      { name, status, message, details }
    ]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Database Connectivity
    addTestResult('Database Connectivity', 'running');
    try {
      const dbResult = await testDatabase();
      addTestResult('Database Connectivity', 'success', 
        `Overall: ${dbResult.overall}`, dbResult);
    } catch (error) {
      addTestResult('Database Connectivity', 'error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 2: Tables Access
    addTestResult('Tables Access', 'running');
    try {
      const tablesResult = await testTables();
      addTestResult('Tables Access', 'success', 
        `Tables tested successfully`, tablesResult);
    } catch (error) {
      addTestResult('Tables Access', 'error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 3: Storage Operations
    addTestResult('Storage Operations', 'running');
    try {
      const storageResult = await testStorage();
      const canUpload = storageResult.canUpload;
      const canDownload = storageResult.canDownload;
      const canDelete = storageResult.canDelete;
      
      addTestResult('Storage Operations', 'success', 
        `Upload: ${canUpload}, Download: ${canDownload}, Delete: ${canDelete}`, storageResult);
    } catch (error) {
      addTestResult('Storage Operations', 'error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 4: Floor Plan Operations
    addTestResult('Floor Plan Operations', 'running');
    try {
      // Since testFloorPlans doesn't exist, we'll test floor plan operations manually
      const testHouseholdId = 'test-household-id';
      const floorPlanData = {
        householdId: testHouseholdId,
        name: 'Test Floor Plan',
        data: { rooms: [] },
        imageUrl: null
      };
      
      // Test create operation
      const createdPlan = await createFloorPlan(floorPlanData);
      const canCreate = !!createdPlan;
      
      // Test read operation
      const plans = await getFloorPlansByHousehold(testHouseholdId);
      const canRead = Array.isArray(plans);
      
      const floorPlanResult = {
        canCreate,
        canRead,
        canUpdate: false, // Not implemented in this test
        canDelete: false  // Not implemented in this test
      };
      
      addTestResult('Floor Plan Operations', 'success', 
        `Create: ${canCreate}, Read: ${canRead}`, floorPlanResult);
    } catch (error) {
      addTestResult('Floor Plan Operations', 'error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 5: Camera Permission
    addTestResult('Camera Permission', 'running');
    try {
      const hasPermission = await requestCameraPermission();
      addTestResult('Camera Permission', hasPermission ? 'success' : 'error', 
        hasPermission ? 'Camera access granted' : 'Camera access denied');
    } catch (error) {
      addTestResult('Camera Permission', 'error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 6: Microphone Permission
    addTestResult('Microphone Permission', 'running');
    try {
      const hasPermission = await requestMicrophonePermission();
      addTestResult('Microphone Permission', hasPermission ? 'success' : 'error', 
        hasPermission ? 'Microphone access granted' : 'Microphone access denied');
    } catch (error) {
      addTestResult('Microphone Permission', 'error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    setIsRunning(false);
    toast.success('All tests completed');
  };

  const runSingleTest = async (testName: string) => {
    addTestResult(testName, 'running');
    
    try {
      switch (testName) {
        case 'Database Connectivity':
          const dbResult = await testDatabase();
          addTestResult(testName, 'success', `Overall: ${dbResult.overall}`, dbResult);
          break;
        case 'Tables Access':
          const tablesResult = await testTables();
          addTestResult(testName, 'success', `Tables tested successfully`, tablesResult);
          break;
        case 'Storage Operations':
          const storageResult = await testStorage();
          addTestResult(testName, 'success', 
            `Upload: ${storageResult.canUpload}, Download: ${storageResult.canDownload}, Delete: ${storageResult.canDelete}`, 
            storageResult);
          break;
        case 'Floor Plan Operations':
          // Since testFloorPlans doesn't exist, we'll test floor plan operations manually
          const testHouseholdId = 'test-household-id';
          const floorPlanData = {
            householdId: testHouseholdId,
            name: 'Test Floor Plan',
            data: { rooms: [] },
            imageUrl: null
          };
          
          // Test create operation
          const createdPlan = await createFloorPlan(floorPlanData);
          const canCreate = !!createdPlan;
          
          // Test read operation
          const plans = await getFloorPlansByHousehold(testHouseholdId);
          const canRead = Array.isArray(plans);
          
          const floorPlanResult = {
            canCreate,
            canRead,
            canUpdate: false, // Not implemented in this test
            canDelete: false  // Not implemented in this test
          };
          
          addTestResult(testName, 'success', 
            `Create: ${canCreate}, Read: ${canRead}`, floorPlanResult);
          break;
        case 'Camera Permission':
          const cameraPermission = await requestCameraPermission();
          addTestResult(testName, cameraPermission ? 'success' : 'error', 
            cameraPermission ? 'Camera access granted' : 'Camera access denied');
          break;
        case 'Microphone Permission':
          const micPermission = await requestMicrophonePermission();
          addTestResult(testName, micPermission ? 'success' : 'error', 
            micPermission ? 'Microphone access granted' : 'Microphone access denied');
          break;
      }
    } catch (error) {
      addTestResult(testName, 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database & System Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Database Status */}
          {databaseStatus && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Database Status:</strong> {databaseStatus.connected ? 'Connected' : 'Disconnected'}
                {databaseStatus.collections.length > 0 && (
                  <div className="mt-1">
                    <strong>Accessible Collections:</strong> {databaseStatus.collections.join(', ')}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Status */}
          <div className="flex gap-4">
            <div className={`flex items-center gap-2 ${permissionState.camera === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
              <Camera className="h-4 w-4" />
              Camera: {permissionState.camera}
            </div>
            <div className={`flex items-center gap-2 ${permissionState.microphone === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
              <Mic className="h-4 w-4" />
              Microphone: {permissionState.microphone}
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Run All Tests
            </Button>
            <Button 
              onClick={checkDatabaseStatus} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Check Status
            </Button>
          </div>

          {/* Test Results */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">No tests run yet. Click "Run All Tests" to start.</p>
            ) : (
              testResults.map((result) => (
                <div key={result.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.message && (
                        <div className="text-sm text-muted-foreground">{result.message}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    {result.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleTest(result.name)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Floor Plan Viewer Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Floor Plan Viewer Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FloorPlanViewer 
            householdId="test-household"
            userId="test-user"
            editable={true}
            onFloorPlanUpdate={(url) => {
              toast.success('Floor plan updated successfully');
              console.log('Floor plan URL:', url);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}; 