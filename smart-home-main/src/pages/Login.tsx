import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Fingerprint, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { FingerprintAuth } from '@/components/FingerprintAuth';
import { isAuthenticated, getCurrentUser } from '@/api/auth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginState {
  isLoading: boolean;
  error: string | null;
  showFingerprint: boolean;
  userId: string | null;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [state, setState] = useState<LoginState>({
    isLoading: false,
    error: null,
    showFingerprint: false,
    userId: null,
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

  // Handle traditional login
  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setState(prev => ({ ...prev, error: 'Please fill in all fields' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Implement traditional login logic here
      // For now, we'll simulate a login and check if user has biometric credentials
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from your auth API
      const mockUser = {
        id: 'user_' + Date.now(),
        email: formData.email,
        name: formData.email.split('@')[0],
      };

      // Check if user has biometric credentials (mock for now)
      const hasBiometric = Math.random() > 0.5; // Random for demo
      
      if (hasBiometric) {
        setState(prev => ({
          ...prev,
          showFingerprint: true,
          userId: mockUser.id,
          isLoading: false,
        }));
        toast.info('Biometric authentication available. You can use fingerprint login.');
      } else {
        // Complete traditional login
        localStorage.setItem('authToken', 'mock_token_' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        error: 'Invalid email or password',
        isLoading: false,
      }));
      toast.error('Login failed. Please check your credentials.');
    }
  };

  // Handle fingerprint authentication success
  interface FingerprintUser {
    id: string;
    email: string;
    name: string;
    // Add other user properties as needed
  }

  const handleFingerprintSuccess = (user: FingerprintUser) => {
    localStorage.setItem('user', JSON.stringify(user));
    toast.success('Fingerprint authentication successful!');
    navigate('/dashboard');
  };

  // Handle fingerprint authentication error
  const handleFingerprintError = (error: string) => {
    setState(prev => ({
      ...prev,
      showFingerprint: false,
      error: error,
    }));
  };

  // Handle back to traditional login
  const handleBackToLogin = () => {
    setState(prev => ({
      ...prev,
      showFingerprint: false,
      userId: null,
    }));
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    toast.info('Password reset functionality would be implemented here');
  };

  // Handle sign up
  const handleSignUp = () => {
    navigate('/register');
  };

  if (state.showFingerprint && state.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <Button
            onClick={handleBackToLogin}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          
          <FingerprintAuth
            mode="authenticate"
            userId={state.userId}
            onSuccess={handleFingerprintSuccess}
            onError={handleFingerprintError}
            onCancel={handleBackToLogin}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your Smart Home account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Password</TabsTrigger>
              <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traditional" className="space-y-4">
              <form onSubmit={handleTraditionalLogin} className="space-y-4">
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
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
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
                  {state.isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="space-y-2">
                <Button
                  variant="link"
                  className="w-full text-sm"
                  onClick={handleForgotPassword}
                >
                  Forgot your password?
                </Button>
                
                <Separator />
                
                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={handleSignUp}
                  >
                    Sign up
                  </Button>
                </div>
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
                  <h3 className="font-semibold">Fingerprint Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Use your fingerprint to sign in quickly and securely
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to sign in with your password first to enable fingerprint authentication.
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
                  Switch to Password Login
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 