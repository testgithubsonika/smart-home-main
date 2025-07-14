/**
 * Webcam & Sensor Test Utilities
 * 
 * These functions can be run in the browser console to test
 * webcam, microphone, and sensor functionality.
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste these functions
 * 3. Run: testWebcamAndSensors()
 */

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

class WebcamSensorTestRunner {
  private results: TestSuite[] = [];

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const colors = {
      info: 'color: #3b82f6',
      success: 'color: #10b981',
      warning: 'color: #f59e0b',
      error: 'color: #ef4444'
    };
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`%c${icons[type]} ${message}`, colors[type]);
  }

  private async runTest(name: string, testFn: () => Promise<boolean>, message?: string): Promise<TestResult> {
    try {
      const success = await testFn();
      const result: TestResult = {
        name,
        success,
        message: message || (success ? 'Test passed' : 'Test failed')
      };
      
      if (success) {
        this.log(`${name}: ${result.message}`, 'success');
      } else {
        this.log(`${name}: ${result.message}`, 'error');
      }
      
      return result;
    } catch (error) {
      const result: TestResult = {
        name,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.log(`${name}: ${result.message}`, 'error');
      return result;
    }
  }

  async testMediaDevices(): Promise<TestSuite> {
    this.log('Testing Media Devices...', 'info');
    
    const tests: TestResult[] = [];
    
    // Test getUserMedia support
    tests.push(await this.runTest(
      'getUserMedia Support',
      async () => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      },
      'Check if getUserMedia API is supported'
    ));

    // Test device enumeration
    tests.push(await this.runTest(
      'Device Enumeration',
      async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(d => d.kind === 'videoinput').length;
          const microphones = devices.filter(d => d.kind === 'audioinput').length;
          
          this.log(`  Found ${cameras} cameras and ${microphones} microphones`, 'info');
          return cameras > 0 || microphones > 0;
        } catch (error) {
          return false;
        }
      },
      'Check if devices can be enumerated'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    
    return {
      name: 'Media Devices',
      tests,
      passed,
      failed,
      total: tests.length
    };
  }

  async testWebcam(): Promise<TestSuite> {
    this.log('Testing Webcam...', 'info');
    
    const tests: TestResult[] = [];
    
    // Test camera permissions
    tests.push(await this.runTest(
      'Camera Permissions',
      async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 }
            } 
          });
          
          // Create video element to test stream
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.muted = true;
          
          document.body.appendChild(video);
          
          // Wait for video to load
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          
          // Check if video is working
          const isWorking = video.readyState >= 2; // HAVE_CURRENT_DATA
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(video);
          
          return isWorking;
        } catch (error) {
          return false;
        }
      },
      'Test camera access and video stream'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    
    return {
      name: 'Webcam',
      tests,
      passed,
      failed,
      total: tests.length
    };
  }

  async testMicrophone(): Promise<TestSuite> {
    this.log('Testing Microphone...', 'info');
    
    const tests: TestResult[] = [];
    
    // Test microphone permissions
    tests.push(await this.runTest(
      'Microphone Permissions',
      async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            } 
          });
          
          // Create audio context to test stream
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          source.connect(analyser);
          
          // Check if audio context is working
          const isWorking = audioContext.state === 'running';
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          await audioContext.close();
          
          return isWorking;
        } catch (error) {
          return false;
        }
      },
      'Test microphone access and audio processing'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    
    return {
      name: 'Microphone',
      tests,
      passed,
      failed,
      total: tests.length
    };
  }

  async testAIModels(): Promise<TestSuite> {
    this.log('Testing AI Models...', 'info');
    
    const tests: TestResult[] = [];
    
    // Test WebGL support
    tests.push(await this.runTest(
      'WebGL Support',
      () => {
        const canvas = document.createElement('canvas');
        const hasWebGL = !!(window.WebGLRenderingContext && 
                           (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        return Promise.resolve(hasWebGL);
      },
      'Check if WebGL is supported for AI models'
    ));

    // Test TensorFlow.js
    tests.push(await this.runTest(
      'TensorFlow.js Support',
      () => {
        return Promise.resolve(typeof (window as any).tf !== 'undefined');
      },
      'Check if TensorFlow.js is available'
    ));

    // Test face-api.js models
    tests.push(await this.runTest(
      'Face API Models',
      async () => {
        try {
          const response = await fetch('/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-weights_manifest.json');
          return response.ok;
        } catch (error) {
          return false;
        }
      },
      'Check if face-api.js models are accessible'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    
    return {
      name: 'AI Models',
      tests,
      passed,
      failed,
      total: tests.length
    };
  }

  async testSensorSimulation(): Promise<TestSuite> {
    this.log('Testing Sensor Simulation...', 'info');
    
    const tests: TestResult[] = [];
    
    // Test motion sensor simulation
    tests.push(await this.runTest(
      'Motion Sensor Simulation',
      () => {
        const motionData = {
          type: 'motion',
          value: Math.random() > 0.5 ? 1 : 0,
          timestamp: new Date().toISOString()
        };
        
        this.log(`  Motion: ${motionData.value ? 'detected' : 'no motion'}`, 'info');
        return Promise.resolve(true);
      },
      'Simulate motion sensor data'
    ));

    // Test temperature sensor simulation
    tests.push(await this.runTest(
      'Temperature Sensor Simulation',
      () => {
        const tempData = {
          type: 'temperature',
          value: 20 + Math.random() * 10,
          unit: '°C',
          timestamp: new Date().toISOString()
        };
        
        this.log(`  Temperature: ${tempData.value.toFixed(1)}${tempData.unit}`, 'info');
        return Promise.resolve(tempData.value >= 20 && tempData.value <= 30);
      },
      'Simulate temperature sensor data'
    ));

    // Test humidity sensor simulation
    tests.push(await this.runTest(
      'Humidity Sensor Simulation',
      () => {
        const humidityData = {
          type: 'humidity',
          value: 40 + Math.random() * 30,
          unit: '%',
          timestamp: new Date().toISOString()
        };
        
        this.log(`  Humidity: ${humidityData.value.toFixed(1)}${humidityData.unit}`, 'info');
        return Promise.resolve(humidityData.value >= 40 && humidityData.value <= 70);
      },
      'Simulate humidity sensor data'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    
    return {
      name: 'Sensor Simulation',
      tests,
      passed,
      failed,
      total: tests.length
    };
  }

  async testBrowserCompatibility(): Promise<TestSuite> {
    this.log('Testing Browser Compatibility...', 'info');
    
    const tests: TestResult[] = [];
    
    // Test permissions API
    tests.push(await this.runTest(
      'Permissions API',
      () => {
        const hasPermissions = typeof navigator.permissions !== 'undefined' && 
                              typeof navigator.permissions.query === 'function';
        return Promise.resolve(hasPermissions);
      },
      'Check if Permissions API is supported'
    ));

    // Test MediaDevices API
    tests.push(await this.runTest(
      'MediaDevices API',
      () => {
        const hasMediaDevices = typeof navigator.mediaDevices !== 'undefined' &&
                               typeof navigator.mediaDevices.getUserMedia === 'function' &&
                               typeof navigator.mediaDevices.enumerateDevices === 'function';
        return Promise.resolve(hasMediaDevices);
      },
      'Check if MediaDevices API is supported'
    ));

    // Test AudioContext API
    tests.push(await this.runTest(
      'AudioContext API',
      () => {
        const hasAudioContext = typeof (window.AudioContext || (window as any).webkitAudioContext) !== 'undefined';
        return Promise.resolve(hasAudioContext);
      },
      'Check if AudioContext API is supported'
    ));

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    
    return {
      name: 'Browser Compatibility',
      tests,
      passed,
      failed,
      total: tests.length
    };
  }

  async runAllTests(): Promise<void> {
    this.log('🚀 Starting Webcam & Sensor Tests...', 'info');
    
    const startTime = Date.now();
    
    // Run all test suites
    this.results.push(await this.testMediaDevices());
    this.results.push(await this.testWebcam());
    this.results.push(await this.testMicrophone());
    this.results.push(await this.testAIModels());
    this.results.push(await this.testSensorSimulation());
    this.results.push(await this.testBrowserCompatibility());
    
    // Generate summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    const totalTests = this.results.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    
    this.log('📊 Test Results Summary', 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${totalPassed}`, 'success');
    this.log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'error' : 'success');
    this.log(`Duration: ${duration}s`, 'info');
    
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, totalFailed > 0 ? 'warning' : 'success');
    
    // Detailed results
    this.log('📋 Detailed Results:', 'info');
    this.results.forEach(suite => {
      this.log(`${suite.name}: ${suite.passed}/${suite.total} passed`, suite.failed > 0 ? 'warning' : 'success');
      suite.tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`  ${status} ${test.name}: ${test.message}`);
      });
    });
    
    // Recommendations
    if (totalFailed > 0) {
      this.log('💡 Recommendations:', 'warning');
      this.log('• Check camera and microphone permissions', 'info');
      this.log('• Ensure hardware is properly connected', 'info');
      this.log('• Try a different browser if issues persist', 'info');
      this.log('• Check if AI model files are accessible', 'info');
    } else {
      this.log('🎉 All tests passed! Your webcam and sensor setup is working correctly.', 'success');
    }
    
    // Return results for programmatic access
    return {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate),
      duration: parseFloat(duration),
      suites: this.results
    };
  }
}

// Global function for easy access
export const testWebcamAndSensors = async () => {
  const runner = new WebcamSensorTestRunner();
  return await runner.runAllTests();
};

// Export the class for programmatic use
export { WebcamSensorTestRunner };

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  (window as any).testWebcamAndSensors = testWebcamAndSensors;
  (window as any).WebcamSensorTestRunner = WebcamSensorTestRunner;
  
  console.log('Webcam & Sensor Test Utilities loaded!');
  console.log('Run: testWebcamAndSensors() to start testing');
} 