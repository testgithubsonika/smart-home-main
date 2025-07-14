import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Settings, 
  Code, 
  TestTube, 
  Bug, 
  Info,
  AlertTriangle,
  Camera,
  Home // Added Home icon for clarity
} from 'lucide-react';
import { SeedDatabase } from '@/components/DevTools/SeedDatabase';
import { DatabaseTestPanel } from '@/components/DatabaseTestPanel';
import { DatabaseSetupPanel } from '@/components/DatabaseSetupPanel';
// FIX: Using FirebaseDataManager which has been migrated to Supabase
import { FirebaseDataManager } from '@/components/DevTools/FirebaseDataManager';
import { ComprehensiveTestRunner } from '@/components/DevTools/ComprehensiveTestRunner';
import { WebcamSensorTester } from '@/components/WebcamSensorTester';
import { HarmonySystemTester } from '@/components/HarmonySystemTester';

export const DevToolsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Development Tools</h1>
          <p className="text-muted-foreground">
            Tools and utilities for development and testing
          </p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Development Only
        </Badge>
      </div>

      <Tabs defaultValue="database" className="space-y-4">
        {/* FIX: Updated grid columns to account for new tab structure */}
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          {/* FIX: Changed Firebase Manager to Supabase Manager */}
          <TabsTrigger value="supabase-manager" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Supabase Manager
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="database-setup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Setup
          </TabsTrigger>
          <TabsTrigger value="debugging" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debugging
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Info
          </TabsTrigger>
          <TabsTrigger value="comprehensive-tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            System Tests
          </TabsTrigger>
          <TabsTrigger value="webcam-sensor" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Webcam & Sensors
          </TabsTrigger>
          {/* Note: This tab was missing from the original grid-cols-8 but is present in the code */}
          {/* <TabsTrigger value="harmony-system" className="flex items-center gap-2">
             <Home className="h-4 w-4" />
             Harmony System
           </TabsTrigger> */}
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <SeedDatabase />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              {/* FIX: Updated description from Firestore to Supabase */}
              <CardDescription>
                Current Supabase configuration and connection status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {/* FIX: Updated from Firebase to Supabase */}
                  <h4 className="text-sm font-medium">Supabase Project</h4>
                  {/* FIX: Using a placeholder for Supabase project ID */}
                  <p className="text-sm text-muted-foreground">your-project-ref-id</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Environment</h4>
                  <Badge variant="outline">Development</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                {/* FIX: Updated from Collections to Tables */}
                <h4 className="text-sm font-medium">Available Tables</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    'households', 'rent_payments', 'rent_schedules', 'bills',
                    'chores', 'chore_completions', 'sensors', 'sensor_events',
                    'nudges', 'chat_messages', 'notifications', 'household_settings'
                  ].map((table) => (
                    <Badge key={table} variant="secondary" className="text-xs">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FIX: Updated tab value and component for Supabase */}
        <TabsContent value="supabase-manager" className="space-y-4">
          <FirebaseDataManager />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <DatabaseTestPanel />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Additional Testing Utilities
              </CardTitle>
              <CardDescription>
                Additional tools for testing the harmony system functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Mock Data Generator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate realistic test data for different scenarios
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API Testing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* FIX: Updated from Firestore to Supabase */}
                    <p className="text-sm text-muted-foreground mb-3">
                      Test Supabase operations and API endpoints
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database-setup" className="space-y-4">
          <DatabaseSetupPanel />
        </TabsContent>

        <TabsContent value="debugging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debugging Tools
              </CardTitle>
              <CardDescription>
                Tools for debugging and monitoring the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">State Inspector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Inspect component state and props
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Performance Monitor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Monitor application performance metrics
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Information about the harmony system and development environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Application Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span>1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environment:</span>
                      <Badge variant="outline">Development</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Build Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Harmony System Features</h4>
                  <div className="space-y-2">
                    {[
                      'Rent Management',
                      'Bill Tracking',
                      'Chore Assignment',
                      'Sensor Integration',
                      'Smart Nudges',
                      'Conflict Coaching',
                      'Real-time Chat',
                      'Notifications'
                    ].map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Development Notes</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    • This is a development environment with sample data for testing
                  </p>
                  {/* FIX: Updated from Firestore to Supabase */}
                  <p>
                    • All data is stored in Supabase and can be cleared/reset
                  </p>
                  <p>
                    • The harmony system includes AI-powered conflict coaching using Gemini
                  </p>
                  <p>
                    • Sensor integration provides contextual nudges and reminders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehensive-tests" className="space-y-4">
          <ComprehensiveTestRunner />
        </TabsContent>

        <TabsContent value="webcam-sensor" className="space-y-4">
          <WebcamSensorTester />
        </TabsContent>

        <TabsContent value="harmony-system" className="space-y-4">
          <HarmonySystemTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};