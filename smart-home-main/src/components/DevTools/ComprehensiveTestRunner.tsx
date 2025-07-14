import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Database,
  HardDrive,
  Brain,
  Globe,
  Code,
  Clock
} from 'lucide-react';
import { 
  runComprehensiveTests, 
  ComprehensiveTestResults,
  TestResult 
} from '@/utils/comprehensiveTests';

export const ComprehensiveTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ComprehensiveTestResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      const testResults = await runComprehensiveTests();
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Passed
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const renderTestResults = (tests: TestResult[], title: string, icon: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="outline">
            {tests.filter(t => t.success).length}/{tests.length} passed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tests.map((test, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(test.success)}
              <div>
                <p className="font-medium">{test.name}</p>
                {test.details && (
                  <p className="text-sm text-muted-foreground">{test.details}</p>
                )}
                {test.error && (
                  <p className="text-sm text-red-600">{test.error}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(test.success)}
              <span className="text-xs text-muted-foreground">
                {test.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Comprehensive System Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Run comprehensive tests to verify all databases, models, APIs, and components are working correctly.
          </p>
          
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Overall Results */}
          <Card className={results.overall.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {results.overall.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Overall Test Results
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={results.overall.success ? "default" : "destructive"}>
                    {results.overall.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <Badge variant="outline">
                    {results.overall.passedTests}/{results.overall.totalTests} passed
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{results.overall.passedTests}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{results.overall.failedTests}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{results.overall.totalTests}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supabase Tests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderTestResults(
              results.supabase.database, 
              'Supabase Database', 
              <Database className="h-5 w-5" />
            )}
            {renderTestResults(
              results.supabase.storage, 
              'Supabase Storage', 
              <HardDrive className="h-5 w-5" />
            )}
          </div>

          {/* Models Tests */}
          {renderTestResults(
            results.models, 
            'AI Models', 
            <Brain className="h-5 w-5" />
          )}

          {/* APIs Tests */}
          {renderTestResults(
            results.apis, 
            'External APIs', 
            <Globe className="h-5 w-5" />
          )}

          {/* Components Tests */}
          {renderTestResults(
            results.components, 
            'Libraries & Components', 
            <Code className="h-5 w-5" />
          )}
        </div>
      )}
    </div>
  );
}; 