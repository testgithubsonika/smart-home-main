import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Fingerprint, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { FingerprintAuth } from '@/components/FingerprintAuth';
import { isAuthenticated, getCurrentUser } from '@/api/auth';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface RegisterState {
  isLoading: boolean;
  error: string | null;
  showFingerprint: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [state, setState] = useState<RegisterState>({
    isLoading: false,
    error: null,
    showFingerprint: false,
    userId: null,
    userName: null,
    userEmail: null,
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user) {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (state.error) {
      setState(prev => ({ ...prev, error: null }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked,
    }));
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      return 'You must agree to the terms and conditions';
    }
    return null;
  };

  // Handle traditional registration
  const handleTraditionalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Implement traditional registration logic here
      // For now, we'll simulate a registration
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from your auth API
      const mockUser = {
        id: 'user_' + Date.now(),
        name: formData.name,
        email: formData.email,
      };

      // Show fingerprint registration
      setState(prev => ({
        ...prev,
        showFingerprint: true,
        userId: mockUser.id,
        userName: mockUser.name,
        userEmail: mockUser.email,
        isLoading: false,
      }));
      
      toast.success('Account created successfully! Now set up fingerprint authentication.');
    } catch (error) {
      console.error('Registration error:', error);
      setState(prev => ({
        ...prev,
        error: 'Registration failed. Please try again.',
        isLoading: false,
      }));
      toast.error('Registration failed. Please try again.');
    }
  };

  // Handle fingerprint registration success
  const handleFingerprintSuccess = (user: any) => {
    localStorage.setItem('authToken', 'mock_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(user));
    toast.success('Registration complete! Welcome to Smart Home.');
    navigate('/dashboard');
  };

  // Handle fingerprint registration error
  const handleFingerprintError = (error: string) => {
    setState(prev => ({
      ...prev,
      showFingerprint: false,
      error: error,
    }));
  };

  // Handle back to traditional registration
  const handleBackToRegister = () => {
    setState(prev => ({
      ...prev,
      showFingerprint: false,
      userId: null,
      userName: null,
      userEmail: null,
    }));
  };

  // Handle skip fingerprint registration
  const handleSkipFingerprint = () => {
    const mockUser = {
      id: state.userId || 'user_' + Date.now(),
      name: state.userName || formData.name,
      email: state.userEmail || formData.email,
    };
    
    localStorage.setItem('authToken', 'mock_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(mockUser));
    toast.success('Registration complete! You can set up fingerprint authentication later.');
    navigate('/dashboard');
  };

  // Handle sign in
  const handleSignIn = () => {
    navigate('/login');
  };

  if (state.showFingerprint && state.userId && state.userName && state.userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <Button
            onClick={handleBackToRegister}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registration
          </Button>
          
          <FingerprintAuth
            mode="register"
            userId={state.userId}
            userName={state.userName}
            userEmail={state.userEmail}
            onSuccess={handleFingerprintSuccess}
            onError={handleFingerprintError}
            onCancel={handleSkipFingerprint}
          />
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={handleSkipFingerprint}
              className="text-sm"
            >
              Skip fingerprint setup for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Join Smart Home and set up secure authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Account</TabsTrigger>
              <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traditional" className="space-y-4">
              <form onSubmit={handleTraditionalRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the{' '}
                    <Button variant="link" className="p-0 h-auto font-normal">
                      Terms of Service
                    </Button>{' '}
                    and{' '}
                    <Button variant="link" className="p-0 h-auto font-normal">
                      Privacy Policy
                    </Button>
                  </Label>
                </div>

                {state.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={state.isLoading}
                >
                  {state.isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <Separator />
              
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={handleSignIn}
                >
                  Sign in
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="fingerprint" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Fingerprint className="h-8 w-8 text-primary" />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold">Fingerprint Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up fingerprint authentication for quick and secure access
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to create an account first to enable fingerprint authentication.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Switch to traditional tab
                    const traditionalTab = document.querySelector('[data-value="traditional"]') as HTMLElement;
                    if (traditionalTab) {
                      traditionalTab.click();
                    }
                  }}
                >
                  Switch to Account Registration
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 