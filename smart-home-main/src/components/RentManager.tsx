import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

import { RentPayment, RentSchedule } from '@/types/harmony';
import { 
  getRentStats, 
  getRentPayments, 
  createRentPayment, 
  markPaymentAsPaid,
  getRentSchedule 
} from '@/services/rentService';

interface RentManagerProps {
  householdId: string;
  userId: string;
}

export const RentManager: React.FC<RentManagerProps> = ({
  householdId,
  userId,
}) => {
  const [rentStats, setRentStats] = useState<{
    totalDue: number;
    totalPaid: number;
    overdueAmount: number;
    nextDueDate: Date;
    paymentHistory: RentPayment[];
  } | null>(null);
  const [schedule, setSchedule] = useState<RentSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  
  // Form state for recording payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<RentPayment['method']>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const householdMembers = [
    { id: 'user1', name: 'Alex' },
    { id: 'user2', name: 'Sam' },
    { id: 'user3', name: 'Jordan' },
  ];

  useEffect(() => {
    loadRentData();
  }, [householdId]);

  const loadRentData = async () => {
    setIsLoading(true);
    try {
      const [statsData, scheduleData] = await Promise.all([
        getRentStats(householdId),
        getRentSchedule(householdId)
      ]);
      
      setRentStats(statsData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error loading rent data:', error);
      toast.error('Failed to load rent data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentDate) {
      toast.error('Please enter payment amount and date');
      return;
    }

    try {
      const payment: Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'> = {
        householdId,
        userId,
        amount: parseFloat(paymentAmount),
        dueDate: new Date(paymentDate),
        status: 'paid',
        method: paymentMethod,
        paidDate: new Date(paymentDate),
        paidBy: userId,
        notes: paymentNotes.trim(),
      };

      await createRentPayment(payment);
      await loadRentData();
      resetPaymentForm();
      setShowRecordPayment(false);
      toast.success('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleMarkAsPaid = async (payment: RentPayment) => {
    try {
      await markPaymentAsPaid(payment.id, userId);
      await loadRentData();
      toast.success('Payment marked as paid');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('Failed to mark payment as paid');
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
  };

  const getStatusColor = (status: RentPayment['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: RentPayment['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getMethodIcon = (method: RentPayment['method']) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'check': return '📄';
      case 'cash': return '💵';
      case 'online': return '💻';
      default: return '💰';
    }
  };

  const getUserName = (userId: string) => {
    const member = householdMembers.find(m => m.id === userId);
    return member?.name || userId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <DollarSign className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading rent data...</p>
        </div>
      </div>
    );
  }

  if (!rentStats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No rent data available</p>
      </div>
    );
  }

  const remainingAmount = rentStats.totalDue - rentStats.totalPaid;
  const progressPercentage = rentStats.totalDue > 0 ? (rentStats.totalPaid / rentStats.totalDue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rent Management</h2>
          <p className="text-muted-foreground">Track rent payments and schedules</p>
        </div>
        <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Rent Payment</DialogTitle>
              <DialogDescription>
                Add a new rent payment to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: RentPayment['method']) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Payment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Payment notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRecordPayment} className="flex-1">
                  Record Payment
                </Button>
                <Button variant="outline" onClick={() => setShowRecordPayment(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${rentStats.totalDue}</div>
            <p className="text-xs text-muted-foreground">
              Total due this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${rentStats.totalPaid}</div>
            <p className="text-xs text-muted-foreground">
              ${remainingAmount} remaining
            </p>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rentStats.nextDueDate.toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.ceil((rentStats.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Splits */}
      {schedule && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Splits</CardTitle>
            <CardDescription>
              How rent is divided between household members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.splits.map((split) => (
                <div key={split.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{getUserName(split.userId)[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{getUserName(split.userId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((split.amount / schedule.totalAmount) * 100).toFixed(1)}% of total rent
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${split.amount}</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent rent payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rentStats.paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rentStats.paymentHistory.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getMethodIcon(payment.method)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {payment.notes || `Rent payment by ${getUserName(payment.userId)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">${payment.amount}</p>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </div>
                    {payment.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsPaid(payment)}
                        className="mt-1"
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Alerts */}
      {rentStats.overdueAmount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Overdue Payments:</strong> You have ${rentStats.overdueAmount} in overdue rent payments. 
            Please make arrangements to pay these as soon as possible.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 