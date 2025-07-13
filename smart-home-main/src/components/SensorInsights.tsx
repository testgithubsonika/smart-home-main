import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  Clock, 
  Target,
  Thermometer,
  Droplets,
  Wifi,
  Home,
  Lightbulb,
  Smartphone,
  Plus
} from 'lucide-react';

import { sensorNudgeService } from '@/services/sensorNudgeService';

interface SensorInsightsProps {
  householdId: string;
}

export const SensorInsights: React.FC<SensorInsightsProps> = ({
  householdId,
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [patterns, setPatterns] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSensorInsights();
  }, [householdId]);

  const loadSensorInsights = async () => {
    setIsLoading(true);
    try {
      const [insightsData, patternsData] = await Promise.all([
        sensorNudgeService.getSensorInsights(householdId),
        sensorNudgeService.analyzeSensorPatterns(householdId),
      ]);
      setInsights(insightsData);
      setPatterns(patternsData);
    } catch (error) {
      console.error('Error loading sensor insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock sensor data for demonstration
  const mockSensors = [
    { id: '1', name: 'Kitchen Motion', type: 'motion', location: 'kitchen', status: 'active', lastEvent: '2 min ago' },
    { id: '2', name: 'Living Room Motion', type: 'motion', location: 'living_room', status: 'active', lastEvent: '5 min ago' },
    { id: '3', name: 'Front Door', type: 'door', location: 'front', status: 'active', lastEvent: '10 min ago' },
    { id: '4', name: 'Trash Bin', type: 'trash', location: 'kitchen', status: 'active', lastEvent: '1 hour ago' },
    { id: '5', name: 'Dishwasher', type: 'dishwasher', location: 'kitchen', status: 'active', lastEvent: '30 min ago' },
    { id: '6', name: 'Temperature Sensor', type: 'temperature', location: 'living_room', status: 'active', lastEvent: '1 min ago' },
  ];

  const mockEvents = [
    { id: '1', sensor: 'Kitchen Motion', event: 'Motion detected', time: '2 min ago', type: 'activity' },
    { id: '2', sensor: 'Dishwasher', event: 'Cycle completed', time: '30 min ago', type: 'appliance' },
    { id: '3', sensor: 'Front Door', event: 'Door opened', time: '10 min ago', type: 'access' },
    { id: '4', sensor: 'Trash Bin', event: 'Trash emptied', time: '1 hour ago', type: 'maintenance' },
    { id: '5', sensor: 'Temperature Sensor', event: 'Temperature: 72°F', time: '1 min ago', type: 'environment' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading sensor insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Smart Home Insights</h2>
        <p className="text-muted-foreground">Monitor your home's activity and efficiency</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.activeSensors || 6}</div>
            <p className="text-xs text-muted-foreground">
              Monitoring your home
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.recentActivity || '24'}</div>
            <p className="text-xs text-muted-foreground">
              Events recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.efficiencyScore || 85}%</div>
            <p className="text-xs text-muted-foreground">
              Home efficiency
            </p>
            <Progress value={insights?.efficiencyScore || 85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Nudges</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.triggeredNudges || 8}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Status */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Status</CardTitle>
          <CardDescription>
            Active sensors monitoring your home
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockSensors.map((sensor) => (
              <div key={sensor.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {sensor.type === 'motion' && <Activity className="h-5 w-5" />}
                    {sensor.type === 'door' && <Home className="h-5 w-5" />}
                    {sensor.type === 'trash' && <Target className="h-5 w-5" />}
                    {sensor.type === 'dishwasher' && <Zap className="h-5 w-5" />}
                    {sensor.type === 'temperature' && <Thermometer className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{sensor.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {sensor.location.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={sensor.status === 'active' ? 'default' : 'secondary'}>
                    {sensor.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sensor.lastEvent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Latest sensor activities and triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {event.type === 'activity' && <Activity className="h-4 w-4" />}
                    {event.type === 'appliance' && <Zap className="h-4 w-4" />}
                    {event.type === 'access' && <Home className="h-4 w-4" />}
                    {event.type === 'maintenance' && <Target className="h-4 w-4" />}
                    {event.type === 'environment' && <Thermometer className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{event.sensor}</p>
                    <p className="text-sm text-muted-foreground">{event.event}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patterns and Insights */}
      {patterns && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Patterns</CardTitle>
            <CardDescription>
              Insights about your household's daily patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Most Active Time</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{patterns.mostActiveTime}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Peak activity period
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-3">Most Active Area</h4>
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold capitalize">
                    {patterns.mostActiveArea.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Busiest room in the house
                </p>
              </div>
            </div>
            
            {patterns.suggestions && patterns.suggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Smart Suggestions</h4>
                <div className="space-y-2">
                  {patterns.suggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Smart Features */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Features</CardTitle>
          <CardDescription>
            Automated features powered by your sensors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Smart Nudges</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatic reminders based on sensor activity
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Efficiency Tracking</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitor household efficiency and patterns
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Mobile Alerts</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Get notified of important events
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Sensor */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Sensor</CardTitle>
          <CardDescription>
            Expand your smart home monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Motion Sensor
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Add Temperature Sensor
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Add Humidity Sensor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 