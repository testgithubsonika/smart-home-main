import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Home,
  Receipt,
  Wrench,
  Bell,
  MessageSquare,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { seedService, seedDatabase, seedSpecificCollection, clearDatabase } from '@/services/seedService';

interface SeedDatabaseProps {
  className?: string;
}

const dataTypes = [
  { key: 'households', label: 'Households', icon: Home, description: 'Sample household data' },
  { key: 'chores', label: 'Chores', icon: Wrench, description: 'Sample chore assignments' },
  { key: 'bills', label: 'Bills', icon: Receipt, description: 'Sample utility bills' },
  { key: 'sensors', label: 'Sensors', icon: Bell, description: 'Sample sensor configurations' }
];

export const SeedDatabase: React.FC<SeedDatabaseProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [seededIds, setSeededIds] = useState<Map<string, string>>(new Map());
  const [isSeeded, setIsSeeded] = useState(false);

  const handleSeedAll = async () => {
    setIsLoading(true);
    try {
      await seedDatabase();
      const ids = seedService.getSeededIds();
      setSeededIds(ids);
      setIsSeeded(true);
      toast.success('Database seeded successfully!', {
        description: 'All sample data has been added to Firestore.'
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Failed to seed database', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedSpecific = async (dataType: string) => {
    setIsLoading(true);
    try {
      await seedSpecificCollection(dataType);
      const ids = seedService.getSeededIds();
      setSeededIds(ids);
      setIsSeeded(true);
      toast.success(`${dataType} seeded successfully!`, {
        description: `Sample ${dataType} data has been added to Firestore.`
      });
    } catch (error) {
      console.error(`Error seeding ${dataType}:`, error);
      toast.error(`Failed to seed ${dataType}`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      await clearDatabase();
      setSeededIds(new Map());
      setIsSeeded(false);
      toast.success('Database cleared successfully!', {
        description: 'All seeded data has been removed from Firestore.'
      });
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error('Failed to clear database', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Seeding Tool
        </CardTitle>
        <CardDescription>
          Seed your Firestore database with sample data for testing the harmony system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSeeded && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Database has been seeded with sample data. You can now test the harmony system features.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Seed All Data</h4>
            <Button 
              onClick={handleSeedAll} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Seed All
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Seed Specific Collections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dataTypes.map(({ key, label, icon: Icon, description }) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeedSpecific(key)}
                  disabled={isLoading}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Clear All Data</h4>
            <Button 
              onClick={handleClearAll} 
              disabled={isLoading}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Clear All
            </Button>
          </div>
        </div>

        {seededIds.size > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Seeded Document IDs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Array.from(seededIds.entries()).map(([key, id]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-xs font-mono">{key}</span>
                  <Badge variant="secondary" className="text-xs">
                    {id}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Only:</strong> This tool is for development and testing purposes. 
            Use with caution in production environments.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}; 