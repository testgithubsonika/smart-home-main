import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Trash2, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Users,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  createHousehold,
  getHousehold
} from '@/services/harmonyService';
import { 
  checkDatabaseConnection,
  uploadSampleData, 
  exportHouseholdData, 
  clearHouseholdData
} from '@/services/supabaseServices';

export const FirebaseDataManager: React.FC = () => {
  const [householdId, setHouseholdId] = useState('household-123');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [exportedData, setExportedData] = useState<Record<string, unknown> | null>(null);

  // Check database connection on component mount
  React.useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await checkDatabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
    } catch (error) {
      setConnectionStatus('failed');
    }
  };

  const handleUploadSampleData = async () => {
    if (!householdId.trim()) {
      toast.error('Please enter a household ID');
      return;
    }

    setIsLoading(true);
    try {
      // First check if household exists, if not create it
      const existingHousehold = await getHousehold(householdId);
      if (!existingHousehold) {
        await createHousehold({
          name: "Sample Household",
          address: "123 Sample Street",
          adminId: "user1",
          memberIds: ["user1", "user2", "user3"],
        });
        toast.success('Created new household');
      }

      await uploadSampleData(householdId);
      toast.success('Sample data uploaded successfully!');
    } catch (error) {
      console.error('Error uploading sample data:', error);
      toast.error('Failed to upload sample data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!householdId.trim()) {
      toast.error('Please enter a household ID');
      return;
    }

    setIsLoading(true);
    try {
      const data = await exportHouseholdData(householdId);
      setExportedData(data);
      
      // Create downloadable JSON file
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `household-${householdId}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!householdId.trim()) {
      toast.error('Please enter a household ID');
      return;
    }

    if (!confirm('Are you sure you want to clear all data for this household? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await clearHouseholdData(householdId);
      setExportedData(null);
      toast.success('Household data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Supabase Data Manager</h2>
        <p className="text-muted-foreground">
          Upload, export, and manage Supabase data for development and testing
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getConnectionStatusColor()}>
                {getConnectionStatusIcon()}
                {connectionStatus === 'checking' ? 'Checking...' : 
                 connectionStatus === 'connected' ? 'Connected' : 'Failed'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={connectionStatus === 'checking'}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Household ID Input */}
      <Card>
        <CardHeader>
          <CardTitle>Household Configuration</CardTitle>
          <CardDescription>
            Enter the household ID for data operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="householdId">Household ID</Label>
              <Input
                id="householdId"
                value={householdId}
                onChange={(e) => setHouseholdId(e.target.value)}
                placeholder="Enter household ID"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Sample Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Sample Data
            </CardTitle>
            <CardDescription>
              Upload sample household data for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleUploadSampleData}
              disabled={isLoading || connectionStatus !== 'connected'}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Sample Data
                </>
              )}
            </Button>
            <div className="mt-2 text-xs text-muted-foreground">
              Creates sample rent payments, bills, chores, and notifications
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export household data as JSON file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportData}
              disabled={isLoading || connectionStatus !== 'connected'}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
            <div className="mt-2 text-xs text-muted-foreground">
              Downloads all household data as JSON
            </div>
          </CardContent>
        </Card>

        {/* Clear Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear Data
            </CardTitle>
            <CardDescription>
              Remove all household data (irreversible)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleClearData}
              disabled={isLoading || connectionStatus !== 'connected'}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </>
              )}
            </Button>
            <div className="mt-2 text-xs text-muted-foreground">
              ⚠️ This action cannot be undone
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sample Data Structure
          </CardTitle>
          <CardDescription>
            Preview of what data will be uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Home className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-medium">Household</div>
              <div className="text-sm text-muted-foreground">1 record</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">Rent Payments</div>
              <div className="text-sm text-muted-foreground">3 records</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="font-medium">Bills</div>
              <div className="text-sm text-muted-foreground">2 records</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="font-medium">Chores</div>
              <div className="text-sm text-muted-foreground">3 records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exported Data Preview */}
      {exportedData && (
        <Card>
          <CardHeader>
            <CardTitle>Exported Data Preview</CardTitle>
            <CardDescription>
              Summary of exported data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Household:</span>
                <span>{exportedData.household ? '✓' : '✗'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rent Payments:</span>
                <span>{exportedData.rentPayments?.length || 0} records</span>
              </div>
              <div className="flex justify-between">
                <span>Bills:</span>
                <span>{exportedData.bills?.length || 0} records</span>
              </div>
              <div className="flex justify-between">
                <span>Chores:</span>
                <span>{exportedData.chores?.length || 0} records</span>
              </div>
              <div className="flex justify-between">
                <span>Notifications:</span>
                <span>{exportedData.notifications?.length || 0} records</span>
              </div>
              <div className="flex justify-between">
                <span>Nudges:</span>
                <span>{exportedData.nudges?.length || 0} records</span>
              </div>
              <div className="flex justify-between">
                <span>Export Date:</span>
                <span>{new Date(exportedData.exportDate).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Make sure your Firebase configuration is set up correctly</li>
            <li>• Enter a household ID to manage data for that household</li>
            <li>• Use "Upload Sample Data" to create test data for development</li>
            <li>• Use "Export Data" to download current data as JSON</li>
            <li>• Use "Clear Data" to remove all data (use with caution)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}; 