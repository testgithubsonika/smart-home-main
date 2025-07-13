import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Trash2,
  RefreshCw,
  Users,
  Home,
  Receipt,
  CheckSquare,
  Activity,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { setupDatabase, clearDatabase, checkDatabaseEmpty } from '@/utils/setupDatabase';

export const DatabaseSetupPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<'unknown' | 'empty' | 'populated'>('unknown');
  const [lastAction, setLastAction] = useState<string>('');

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const isEmpty = await checkDatabaseEmpty();
      setDatabaseStatus(isEmpty ? 'empty' : 'populated');
      toast.success(`Database is ${isEmpty ? 'empty' : 'populated'}`);
    } catch (error) {
      console.error('Error checking database status:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSetupDatabase = async () => {
    setIsLoading(true);
    setLastAction('setup');
    try {
      await setupDatabase();
      setDatabaseStatus('populated');
      toast.success('Database setup completed successfully!');
    } catch (error) {
      console.error('Error setting up database:', error);
      toast.error('Failed to setup database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setLastAction('clear');
    try {
      await clearDatabase();
      setDatabaseStatus('empty');
      toast.success('Database cleared successfully!');
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error('Failed to clear database');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (databaseStatus) {
      case 'populated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'empty':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (databaseStatus) {
      case 'populated':
        return 'Populated with sample data';
      case 'empty':
        return 'Empty - needs setup';
      default:
        return 'Unknown - check status';
    }
  };

  const getStatusColor = () => {
    switch (databaseStatus) {
      case 'populated':
        return 'bg-green-100 text-green-800';
      case 'empty':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>
          Initialize your Firestore database with sample data for testing and development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">Database Status</p>
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkDatabaseStatus}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check Status
          </Button>
        </div>

        <Separator />

        {/* Sample Data Overview */}
        <div>
          <h3 className="font-medium mb-3">Sample Data Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">3 Users</p>
                <p className="text-xs text-gray-600">Alex, Sam, Jordan</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Home className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">1 Household</p>
                <p className="text-xs text-gray-600">Sunset Apartments</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Receipt className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">3 Bills</p>
                <p className="text-xs text-gray-600">Electricity, Internet, Water</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <CheckSquare className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">4 Chores</p>
                <p className="text-xs text-gray-600">Kitchen, Living Room, etc.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <Activity className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">3 Sensors</p>
                <p className="text-xs text-gray-600">Motion, Door, Trash</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
              <MessageCircle className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-sm font-medium">3 Chat Messages</p>
                <p className="text-xs text-gray-600">Sample conversation</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-4">
          <h3 className="font-medium">Database Actions</h3>
          
          {databaseStatus === 'empty' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your database is empty. Click "Setup Database" to populate it with sample data for testing.
              </AlertDescription>
            </Alert>
          )}

          {databaseStatus === 'populated' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your database is already populated with sample data. You can clear it and start fresh if needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSetupDatabase}
              disabled={isLoading || databaseStatus === 'populated'}
              className="flex-1"
            >
              {isLoading && lastAction === 'setup' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Setup Database
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleClearDatabase}
              disabled={isLoading || databaseStatus === 'empty'}
              className="flex-1"
            >
              {isLoading && lastAction === 'clear' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Database
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Instructions</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Setup Database:</strong> Creates all necessary collections with sample data</li>
            <li>• <strong>Clear Database:</strong> Removes all data from Firestore collections</li>
            <li>• <strong>Check Status:</strong> Verifies if the database has data</li>
            <li>• Sample data includes users, households, bills, chores, sensors, and more</li>
            <li>• This is for development/testing purposes only</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 