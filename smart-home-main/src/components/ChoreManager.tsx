import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Award, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

import { Chore, ChoreCompletion } from '@/types/harmony';
import { 
  getChores, 
  createChore, 
  updateChore, 
  completeChore, 
  getChoreCompletions 
} from '@/services/harmonyService';
import { sensorNudgeService } from '@/services/sensorNudgeService';

interface ChoreManagerProps {
  householdId: string;
  userId: string;
}

export const ChoreManager: React.FC<ChoreManagerProps> = ({
  householdId,
  userId,
}) => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Chore['category']>('cleaning');
  const [priority, setPriority] = useState<Chore['priority']>('medium');
  const [points, setPoints] = useState(10);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurringInterval, setRecurringInterval] = useState(1);

  const categories = [
    { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'shopping', label: 'Shopping', icon: '🛒' },
    { value: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
    { value: 'other', label: 'Other', icon: '📝' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  ];

  const householdMembers = [
    { id: 'user1', name: 'Alex' },
    { id: 'user2', name: 'Sam' },
    { id: 'user3', name: 'Jordan' },
  ];

  const loadChores = useCallback(async () => {
    setIsLoading(true);
    try {
      const [choresData, completionsData] = await Promise.all([
        getChores(householdId),
        getChoreCompletions(householdId, 7), // Last 7 days
      ]);
      setChores(choresData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error loading chores:', error);
      toast.error('Failed to load chores');
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadChores();
  }, [loadChores]);

  const handleCreateChore = async () => {
    if (!title.trim()) {
      toast.error('Please enter a chore title');
      return;
    }

    try {
      const newChore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'> = {
        householdId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        points,
        assignedTo: assignedTo || undefined,
        assignedBy: userId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: 'pending',
        recurring: isRecurring ? {
          frequency: recurringFrequency,
          interval: recurringInterval,
        } : undefined,
      };

      await createChore(newChore);
      await loadChores();
      resetForm();
      setShowCreateDialog(false);
      toast.success('Chore created successfully');
    } catch (error) {
      console.error('Error creating chore:', error);
      toast.error('Failed to create chore');
    }
  };

  const handleUpdateChore = async () => {
    if (!editingChore || !title.trim()) {
      toast.error('Please enter a chore title');
      return;
    }

    try {
      const updates: Partial<Chore> = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        points,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        recurring: isRecurring ? {
          frequency: recurringFrequency,
          interval: recurringInterval,
        } : undefined,
      };

      await updateChore(editingChore.id, updates);
      await loadChores();
      resetForm();
      setEditingChore(null);
      toast.success('Chore updated successfully');
    } catch (error) {
      console.error('Error updating chore:', error);
      toast.error('Failed to update chore');
    }
  };

  const handleCompleteChore = async (chore: Chore) => {
    try {
      const completion: Omit<ChoreCompletion, 'id'> = {
        choreId: chore.id,
        userId,
        completedAt: new Date(),
        pointsEarned: chore.points,
        notes: '',
      };

      await completeChore(chore.id, completion);
      
      // Trigger sensor nudge for chore completion
      await sensorNudgeService.processChoreCompletion(
        householdId,
        chore.id,
        userId,
        chore.title
      );

      await loadChores();
      toast.success(`Chore completed! You earned ${chore.points} points`);
    } catch (error) {
      console.error('Error completing chore:', error);
      toast.error('Failed to complete chore');
    }
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setTitle(chore.title);
    setDescription(chore.description || '');
    setCategory(chore.category);
    setPriority(chore.priority);
    setPoints(chore.points);
    setAssignedTo(chore.assignedTo || '');
    setDueDate(chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : '');
    setIsRecurring(!!chore.recurring);
    if (chore.recurring) {
      setRecurringFrequency(chore.recurring.frequency);
      setRecurringInterval(chore.recurring.interval);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('cleaning');
    setPriority('medium');
    setPoints(10);
    setAssignedTo('');
    setDueDate('');
    setIsRecurring(false);
    setRecurringFrequency('weekly');
    setRecurringInterval(1);
  };

  const getStatusColor = (status: Chore['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Chore['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: Chore['category']) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📝';
  };

  const getPriorityColor = (priority: Chore['priority']) => {
    const pri = priorities.find(p => p.value === priority);
    return pri?.color || 'bg-gray-100 text-gray-800';
  };

  const getUserName = (userId: string) => {
    const member = householdMembers.find(m => m.id === userId);
    return member?.name || userId;
  };

  const pendingChores = chores.filter(chore => chore.status !== 'completed');
  const completedChores = chores.filter(chore => chore.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <CheckSquare className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading chores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chore Management</h2>
          <p className="text-muted-foreground">Keep your household running smoothly</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Chore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Chore</DialogTitle>
              <DialogDescription>
                Add a new chore to your household's task list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Clean kitchen"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={(value: Chore['category']) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="mr-2">{cat.icon}</span>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={(value: Chore['priority']) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          {pri.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Points</label>
                  <Input
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {householdMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <label htmlFor="recurring" className="text-sm">Recurring chore</label>
              </div>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <Select value={recurringFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setRecurringFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Every</label>
                    <Input
                      type="number"
                      min="1"
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleCreateChore} className="flex-1">
                  Create Chore
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingChores.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{completedChores.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Points</p>
                <p className="text-2xl font-bold">{chores.reduce((sum, chore) => sum + chore.points, 0)}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold">{chores.filter(chore => chore.status === 'overdue').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Chores */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Chores</CardTitle>
          <CardDescription>
            Tasks that need to be completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingChores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending chores! Great job!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingChores.map((chore) => (
                <div key={chore.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getCategoryIcon(chore.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{chore.title}</h4>
                        <Badge className={getPriorityColor(chore.priority)}>
                          {chore.priority}
                        </Badge>
                        <Badge className={getStatusColor(chore.status)}>
                          {getStatusIcon(chore.status)}
                          {chore.status}
                        </Badge>
                      </div>
                      {chore.description && (
                        <p className="text-sm text-muted-foreground">{chore.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {chore.points} points
                        </span>
                        {chore.assignedTo && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {getUserName(chore.assignedTo)}
                          </span>
                        )}
                        {chore.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(chore.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {chore.recurring && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Every {chore.recurring.interval} {chore.recurring.frequency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCompleteChore(chore)}
                      disabled={chore.assignedTo && chore.assignedTo !== userId}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditChore(chore)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingChore && (
        <Dialog open={!!editingChore} onOpenChange={() => setEditingChore(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Chore</DialogTitle>
              <DialogDescription>
                Update the chore details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Clean kitchen"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={(value: Chore['category']) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="mr-2">{cat.icon}</span>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={(value: Chore['priority']) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          {pri.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Points</label>
                  <Input
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {householdMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <label htmlFor="edit-recurring" className="text-sm">Recurring chore</label>
              </div>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <Select value={recurringFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setRecurringFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Every</label>
                    <Input
                      type="number"
                      min="1"
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleUpdateChore} className="flex-1">
                  Update Chore
                </Button>
                <Button variant="outline" onClick={() => setEditingChore(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 