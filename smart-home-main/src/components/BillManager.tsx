import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Receipt, 
  Plus, 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

import { Bill } from '@/types/harmony';
import { getBills, createBill, updateBill, deleteBill } from '@/services/harmonyService';

interface BillManagerProps {
  householdId: string;
  userId: string;
}

export const BillManager: React.FC<BillManagerProps> = ({
  householdId,
  userId,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Bill['category']>('electricity');
  const [dueDate, setDueDate] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [notes, setNotes] = useState('');

  const categories = [
    { value: 'electricity', label: 'Electricity', icon: '⚡' },
    { value: 'water', label: 'Water', icon: '💧' },
    { value: 'gas', label: 'Gas', icon: '🔥' },
    { value: 'internet', label: 'Internet', icon: '🌐' },
    { value: 'trash', label: 'Trash', icon: '🗑️' },
    { value: 'other', label: 'Other', icon: '📄' },
  ];

  const householdMembers = [
    { id: 'user1', name: 'Alex' },
    { id: 'user2', name: 'Sam' },
    { id: 'user3', name: 'Jordan' },
  ];

  useEffect(() => {
    loadBills();
  }, [householdId]);

  const loadBills = async () => {
    setIsLoading(true);
    try {
      const billsData = await getBills(householdId);
      setBills(billsData);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBill = async () => {
    if (!name.trim() || !amount) {
      toast.error('Please enter bill name and amount');
      return;
    }

    try {
      const newBill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> = {
        householdId,
        name: name.trim(),
        amount: parseFloat(amount),
        category,
        dueDate: new Date(dueDate),
        status: 'pending',
        paidBy: paidBy || undefined,
        splitBetween: householdMembers.map(m => m.id), // Default split between all members
        notes: notes.trim(),
      };

      await createBill(newBill);
      await loadBills();
      resetForm();
      setShowCreateDialog(false);
      toast.success('Bill created successfully');
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    }
  };

  const handleUpdateBill = async () => {
    if (!editingBill || !name.trim() || !amount) {
      toast.error('Please enter bill name and amount');
      return;
    }

    try {
      const updates: Partial<Bill> = {
        name: name.trim(),
        amount: parseFloat(amount),
        category,
        dueDate: new Date(dueDate),
        paidBy: paidBy || undefined,
        notes: notes.trim(),
      };

      await updateBill(editingBill.id, updates);
      await loadBills();
      resetForm();
      setEditingBill(null);
      toast.success('Bill updated successfully');
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill');
    }
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    try {
      await updateBill(bill.id, {
        status: 'paid',
        paidDate: new Date(),
        paidBy: userId,
      });
      await loadBills();
      toast.success('Bill marked as paid');
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast.error('Failed to mark bill as paid');
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteBill(billId);
      await loadBills();
      toast.success('Bill deleted successfully');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCategory('electricity');
    setDueDate('');
    setPaidBy('');
    setNotes('');
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: Bill['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: Bill['category']) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📄';
  };

  const getUserName = (userId: string) => {
    const member = householdMembers.find(m => m.id === userId);
    return member?.name || userId;
  };

  const pendingBills = bills.filter(bill => bill.status !== 'paid');
  const paidBills = bills.filter(bill => bill.status === 'paid');
  const overdueBills = bills.filter(bill => bill.status === 'overdue');

  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Receipt className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill Management</h2>
          <p className="text-muted-foreground">Track and manage household expenses</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Bill</DialogTitle>
              <DialogDescription>
                Add a new bill to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Bill Name</label>
                <Input
                  placeholder="e.g., Electricity Bill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={(value: Bill['category']) => setCategory(value)}>
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
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Paid By</label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not paid yet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Not paid yet</SelectItem>
                    {householdMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateBill} className="flex-1">
                  Add Bill
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
                <p className="text-sm font-medium">Total Due</p>
                <p className="text-2xl font-bold">${totalDue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Paid</p>
                <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingBills.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold">{overdueBills.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Bills Alert */}
      {overdueBills.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> You have {overdueBills.length} overdue bill{overdueBills.length > 1 ? 's' : ''} 
            totaling ${overdueBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}. 
            Please pay these as soon as possible to avoid late fees.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Bills</CardTitle>
          <CardDescription>
            Bills that need to be paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending bills! Great job staying on top of expenses!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getCategoryIcon(bill.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{bill.name}</h4>
                        <Badge className={getStatusColor(bill.status)}>
                          {getStatusIcon(bill.status)}
                          {bill.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${bill.amount.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Split between {bill.splitBetween.length} people
                        </span>
                      </div>
                      {bill.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{bill.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(bill)}
                    >
                      Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBill(bill);
                        setName(bill.name);
                        setAmount(bill.amount.toString());
                        setCategory(bill.category);
                        setDueDate(new Date(bill.dueDate).toISOString().split('T')[0]);
                        setPaidBy(bill.paidBy || '');
                        setNotes(bill.notes || '');
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Paid Bills */}
      {paidBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Paid</CardTitle>
            <CardDescription>
              Bills that have been paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidBills.slice(0, 5).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getCategoryIcon(bill.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{bill.name}</h4>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          Paid
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${bill.amount.toFixed(2)}
                        </span>
                        {bill.paidBy && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Paid by {getUserName(bill.paidBy)}
                          </span>
                        )}
                        {bill.paidDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Paid on {new Date(bill.paidDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingBill && (
        <Dialog open={!!editingBill} onOpenChange={() => setEditingBill(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Bill</DialogTitle>
              <DialogDescription>
                Update the bill details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Bill Name</label>
                <Input
                  placeholder="e.g., Electricity Bill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={(value: Bill['category']) => setCategory(value)}>
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
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Paid By</label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not paid yet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Not paid yet</SelectItem>
                    {householdMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateBill} className="flex-1">
                  Update Bill
                </Button>
                <Button variant="outline" onClick={() => setEditingBill(null)}>
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