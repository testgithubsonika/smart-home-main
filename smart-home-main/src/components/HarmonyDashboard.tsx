import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

import { DashboardStats, Nudge, Notification } from '@/types/harmony';
import { getDashboardStats, getUserNotifications, getHouseholdNudges } from '@/services/dashboardService';
import { sensorNudgeService } from '@/services/sensorNudgeService';
import { ConflictCoach } from './ConflictCoach';
import { ChoreManager } from './ChoreManager';
import { BillManager } from './BillManager';
import { RentManager } from './RentManager';
import { SensorInsights } from './SensorInsights';

interface HarmonyDashboardProps {
  householdId: string;
  userId: string;
  className?: string;
}

export const HarmonyDashboard: React.FC<HarmonyDashboardProps> = ({
  householdId,
  userId,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConflictCoach, setShowConflictCoach] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [householdId, userId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [statsData, nudgesData, notificationsData] = await Promise.all([
        getDashboardStats(householdId),
        getHouseholdNudges(householdId, userId),
        getUserNotifications(userId),
      ]);

      setStats(statsData);
      setNudges(nudgesData);
      setNotifications(notificationsData);

      // Initialize sensor service
      await sensorNudgeService.initializeSensors(householdId);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      
      // TODO: Call API to mark as read
      // await markNotificationAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.actionUrl) {
      // Navigate to specific page
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  const handleNudgeDismiss = async (nudgeId: string) => {
    // Update local state immediately for better UX
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
    
    // TODO: Call API to dismiss nudge
    // await dismissNudge(nudgeId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case 'chore_reminder': return <CheckSquare className="h-4 w-4" />;
      case 'bill_due': return <Receipt className="h-4 w-4" />;
      case 'rent_due': return <DollarSign className="h-4 w-4" />;
      case 'sensor_triggered': return <Zap className="h-4 w-4" />;
      case 'conflict_warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your harmony dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Harmony Dashboard</h1>
          <p className="text-muted-foreground">Manage your household with ease</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            Household Active
          </Badge>
          <Button
            variant="outline"
            onClick={() => setShowConflictCoach(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Conflict Coach
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rent Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.rent.totalPaid}</div>
              <p className="text-xs text-muted-foreground">
                of ${stats.rent.totalDue} paid
              </p>
              <Progress 
                value={(stats.rent.totalPaid / stats.rent.totalDue) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bills Due</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.bills.totalDue}</div>
              <p className="text-xs text-muted-foreground">
                {stats.bills.overdueCount} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chores</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.chores.pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.chores.completedThisWeek} completed this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sensors</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sensors.activeCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sensors.recentEvents} events today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nudges and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nudges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Smart Nudges
            </CardTitle>
            <CardDescription>
              AI-powered suggestions for household harmony
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nudges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No nudges right now! Great job!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nudges.slice(0, 5).map((nudge) => (
                  <div key={nudge.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {getNudgeIcon(nudge.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{nudge.title}</h4>
                        <Badge variant={getPriorityColor(nudge.priority)} className="text-xs">
                          {nudge.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{nudge.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNudgeDismiss(nudge.id)}
                        >
                          Dismiss
                        </Button>
                        {nudge.actionUrl && (
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Recent activity and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications right now!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-1">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chores">Chores</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="rent">Rent</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>What's happening in your household</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Chore completed</p>
                      <p className="text-xs text-muted-foreground">Kitchen cleaned by Alex</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Bill paid</p>
                      <p className="text-xs text-muted-foreground">Electricity bill paid by Sam</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Sensor alert</p>
                      <p className="text-xs text-muted-foreground">Motion detected in kitchen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Chore Leaderboard</CardTitle>
                <CardDescription>This week's top performers</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.chores.leaderboard.length ? (
                  <div className="space-y-3">
                    {stats.chores.leaderboard.map((user, index) => (
                      <div key={user.userId} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">User {user.userId}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.completedChores} chores completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{user.points} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No leaderboard data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chores">
          <ChoreManager householdId={householdId} userId={userId} />
        </TabsContent>

        <TabsContent value="bills">
          <BillManager householdId={householdId} userId={userId} />
        </TabsContent>

        <TabsContent value="rent">
          <RentManager householdId={householdId} userId={userId} />
        </TabsContent>

        <TabsContent value="sensors">
          <SensorInsights householdId={householdId} userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Conflict Coach Modal */}
      {showConflictCoach && (
        <ConflictCoach
          householdId={householdId}
          userId={userId}
          onClose={() => setShowConflictCoach(false)}
        />
      )}
    </div>
  );
}; 