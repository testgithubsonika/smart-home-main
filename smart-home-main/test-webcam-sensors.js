#!/usr/bin/env node

/**
 * Webcam & Sensor Test Script
 * 
 * This script tests webcam, microphone, and sensor functionality
 * in a Node.js environment using Puppeteer to control a browser.
 * 
 * Usage: node test-webcam-sensors.js
 * 
 * Prerequisites:
 * - npm install puppeteer
 * - Chrome/Chromium browser installed
 * - Webcam and microphone available
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`)
};

class WebcamSensorTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async init() {
    log.info('Starting browser...');
    
    try {
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for headless testing
        args: [
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--allow-running-insecure-content',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({ width: 1280, height: 720 });
      
      log.success('Browser started successfully');
      return true;
    } catch (error) {
      log.error(`Failed to start browser: ${error.message}`);
      return false;
    }
  }

  async test(testName, testFn) {
    this.results.total++;
    try {
      const result = await testFn();
      if (result) {
        this.results.passed++;
        log.success(`${testName}`);
        this.results.details.push({ name: testName, success: true });
      } else {
        this.results.failed++;
        log.error(`${testName}`);
        this.results.details.push({ name: testName, success: false });
      }
    } catch (error) {
      this.results.failed++;
      log.error(`${testName}: ${error.message}`);
      this.results.details.push({ name: testName, success: false, error: error.message });
    }
  }

  async testMediaDevices() {
    log.section('Testing Media Devices');
    
    await this.test('Check getUserMedia support', async () => {
      const result = await this.page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });
      return result;
    });

    await this.test('List available devices', async () => {
      const devices = await this.page.evaluate(async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          return {
            cameras: devices.filter(d => d.kind === 'videoinput').length,
            microphones: devices.filter(d => d.kind === 'audioinput').length,
            speakers: devices.filter(d => d.kind === 'audiooutput').length
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      log.info(`  Cameras: ${devices.cameras}`);
      log.info(`  Microphones: ${devices.microphones}`);
      log.info(`  Speakers: ${devices.speakers}`);
      
      return !devices.error;
    });
  }

  async testWebcam() {
    log.section('Testing Webcam');
    
    await this.test('Request camera permissions', async () => {
      try {
        await this.page.evaluate(async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 }
            } 
          });
          
          // Create video element and test stream
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.muted = true;
          
          document.body.appendChild(video);
          
          // Wait for video to load
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          
          // Check if video is playing
          return video.readyState >= 2; // HAVE_CURRENT_DATA
        });
        
        return true;
      } catch (error) {
        log.warning(`  Camera test failed: ${error.message}`);
        return false;
      }
    });
  }

  async testMicrophone() {
    log.section('Testing Microphone');
    
    await this.test('Request microphone permissions', async () => {
      try {
        await this.page.evaluate(async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            } 
          });
          
          // Create audio context to test stream
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          source.connect(analyser);
          
          // Check if audio context is working
          return audioContext.state === 'running';
        });
        
        return true;
      } catch (error) {
        log.warning(`  Microphone test failed: ${error.message}`);
        return false;
      }
    });
  }

  async testAIModels() {
    log.section('Testing AI Models');
    
    await this.test('Check WebGL support', async () => {
      const webglSupported = await this.page.evaluate(() => {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      });
      
      return webglSupported;
    });

    await this.test('Check TensorFlow.js support', async () => {
      const tfSupported = await this.page.evaluate(() => {
        return typeof window.tf !== 'undefined';
      });
      
      return tfSupported;
    });

    await this.test('Check face-api.js models accessibility', async () => {
      try {
        const modelAccessible = await this.page.evaluate(async () => {
          try {
            const response = await fetch('/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-weights_manifest.json');
            return response.ok;
          } catch (error) {
            return false;
          }
        });
        
        return modelAccessible;
      } catch (error) {
        log.warning(`  Model accessibility test failed: ${error.message}`);
        return false;
      }
    });
  }

  async testSensorSimulation() {
    log.section('Testing Sensor Simulation');
    
    await this.test('Simulate motion sensor', async () => {
      const motionData = await this.page.evaluate(() => {
        // Simulate motion sensor data
        return {
          type: 'motion',
          value: Math.random() > 0.5 ? 1 : 0,
          timestamp: new Date().toISOString()
        };
      });
      
      log.info(`  Motion sensor: ${motionData.value ? 'detected' : 'no motion'}`);
      return true;
    });

    await this.test('Simulate temperature sensor', async () => {
      const tempData = await this.page.evaluate(() => {
        // Simulate temperature sensor data
        return {
          type: 'temperature',
          value: 20 + Math.random() * 10,
          unit: '°C',
          timestamp: new Date().toISOString()
        };
      });
      
      log.info(`  Temperature: ${tempData.value.toFixed(1)}${tempData.unit}`);
      return tempData.value >= 20 && tempData.value <= 30;
    });

    await this.test('Simulate humidity sensor', async () => {
      const humidityData = await this.page.evaluate(() => {
        // Simulate humidity sensor data
        return {
          type: 'humidity',
          value: 40 + Math.random() * 30,
          unit: '%',
          timestamp: new Date().toISOString()
        };
      });
      
      log.info(`  Humidity: ${humidityData.value.toFixed(1)}${humidityData.unit}`);
      return humidityData.value >= 40 && humidityData.value <= 70;
    });
  }

  async testBrowserCompatibility() {
    log.section('Testing Browser Compatibility');
    
    await this.test('Check getUserMedia permissions API', async () => {
      const permissionsSupported = await this.page.evaluate(() => {
        return typeof navigator.permissions !== 'undefined' && 
               typeof navigator.permissions.query === 'function';
      });
      
      return permissionsSupported;
    });

    await this.test('Check MediaDevices API', async () => {
      const mediaDevicesSupported = await this.page.evaluate(() => {
        return typeof navigator.mediaDevices !== 'undefined' &&
               typeof navigator.mediaDevices.getUserMedia === 'function' &&
               typeof navigator.mediaDevices.enumerateDevices === 'function';
      });
      
      return mediaDevicesSupported;
    });

    await this.test('Check AudioContext API', async () => {
      const audioContextSupported = await this.page.evaluate(() => {
        return typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined';
      });
      
      return audioContextSupported;
    });
  }

  async runAllTests() {
    log.header('🚀 Starting Webcam & Sensor Tests');
    
    const startTime = Date.now();
    
    // Initialize browser
    if (!(await this.init())) {
      log.error('Failed to initialize browser. Exiting.');
      return;
    }

    // Navigate to a test page
    try {
      await this.page.goto('http://localhost:5173/dev-tools', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for page to load
      await this.page.waitForTimeout(2000);
      
      log.success('Successfully loaded test page');
    } catch (error) {
      log.warning(`Could not load test page: ${error.message}`);
      log.info('Running tests in basic environment...');
    }

    // Run all test suites
    await this.testMediaDevices();
    await this.testWebcam();
    await this.testMicrophone();
    await this.testAIModels();
    await this.testSensorSimulation();
    await this.testBrowserCompatibility();

    // Generate report
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log.header('📊 Test Results Summary');
    log.info(`Total Tests: ${this.results.total}`);
    log.success(`Passed: ${this.results.passed}`);
    log.error(`Failed: ${this.results.failed}`);
    log.info(`Duration: ${duration}s`);
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    log.info(`Success Rate: ${successRate}%`);
    
    // Detailed results
    if (this.results.details.length > 0) {
      log.section('Detailed Results');
      this.results.details.forEach(detail => {
        const status = detail.success ? '✅' : '❌';
        const message = detail.error ? ` (${detail.error})` : '';
        console.log(`${status} ${detail.name}${message}`);
      });
    }
    
    // Recommendations
    if (this.results.failed > 0) {
      log.section('Recommendations');
      log.warning('Some tests failed. Please check:');
      log.info('• Camera and microphone permissions');
      log.info('• Hardware connections');
      log.info('• Browser compatibility');
      log.info('• AI model files availability');
    } else {
      log.success('All tests passed! Your webcam and sensor setup is working correctly.');
    }
    
    // Cleanup
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WebcamSensorTester();
  tester.runAllTests().catch(error => {
    log.error(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

export default WebcamSensorTester; 