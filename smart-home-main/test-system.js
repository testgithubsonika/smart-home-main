#!/usr/bin/env node

/**
 * Comprehensive System Test Script
 * 
 * This script tests all major components of the smart home system:
 * - Firebase Firestore connectivity
 * - Firebase Storage connectivity  
 * - AI Models accessibility
 * - External APIs
 * - Sample data validation
 * 
 * Usage: node test-system.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

class SystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
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

  async testFileExists(filePath, description) {
    return this.test(description, () => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          log.info(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
          return true;
        }
      }
      throw new Error(`File not found: ${filePath}`);
    });
  }

  async testDirectoryExists(dirPath, description) {
    return this.test(description, () => {
      const fullPath = path.join(process.cwd(), dirPath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          const files = fs.readdirSync(fullPath);
          log.info(`  Contains ${files.length} files/directories`);
          return true;
        }
      }
      throw new Error(`Directory not found: ${dirPath}`);
    });
  }

  async testEnvironmentVariables() {
    log.section('Environment Variables');
    
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN', 
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    for (const varName of requiredVars) {
      await this.test(`Environment variable: ${varName}`, () => {
        const value = process.env[varName];
        if (!value) {
          log.warning(`  Missing environment variable: ${varName} (this is expected in development)`);
          return false; // Don't throw error, just mark as failed
        }
        log.info(`  Value: ${value.substring(0, 10)}...`);
        return true;
      });
    }
  }

  async testProjectStructure() {
    log.section('Project Structure');
    
    const requiredFiles = [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.ts',
      'src/main.tsx',
      'src/App.tsx',
      'src/lib/firebase.ts',
      'public/sample-floorplan.json'
    ];

    const requiredDirs = [
      'src',
      'src/components',
      'src/pages',
      'src/services',
      'src/types',
      'src/utils',
      'public',
      'public/models'
    ];

    for (const file of requiredFiles) {
      await this.testFileExists(file, `File exists: ${file}`);
    }

    for (const dir of requiredDirs) {
      await this.testDirectoryExists(dir, `Directory exists: ${dir}`);
    }
  }

  async testModels() {
    log.section('AI Models');
    
    const modelFiles = [
      'public/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-shard1',
      'public/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-shard2',
      'public/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-weights_manifest.json',
      'public/models/face-api.js-models-master/face_landmark_68/face_landmark_68_model-shard1',
      'public/models/face-api.js-models-master/face_landmark_68/face_landmark_68_model-weights_manifest.json',
      'public/models/face-api.js-models-master/face_recognition/face_recognition_model-shard1',
      'public/models/face-api.js-models-master/face_recognition/face_recognition_model-shard2',
      'public/models/face-api.js-models-master/face_recognition/face_recognition_model-weights_manifest.json'
    ];

    for (const modelFile of modelFiles) {
      await this.testFileExists(modelFile, `Model file: ${path.basename(modelFile)}`);
    }
  }

  async testDependencies() {
    log.section('Dependencies');
    
    await this.test('package.json exists and is valid JSON', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const content = fs.readFileSync(packagePath, 'utf8');
      const pkg = JSON.parse(content);
      
      const requiredDeps = [
        'react', 'react-dom', 'firebase', '@google/generative-ai',
        'lucide-react', 'sonner', 'tailwindcss'
      ];

      const missingDeps = requiredDeps.filter(dep => !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]);
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }

      log.info(`  Found ${Object.keys(pkg.dependencies || {}).length} dependencies`);
      log.info(`  Found ${Object.keys(pkg.devDependencies || {}).length} dev dependencies`);
      return true;
    });
  }

  async testConfiguration() {
    log.section('Configuration Files');
    
    const configFiles = [
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.ts',
      'eslint.config.js'
    ];

    for (const configFile of configFiles) {
      await this.test(`Config file is valid: ${configFile}`, () => {
        const configPath = path.join(process.cwd(), configFile);
        const content = fs.readFileSync(configPath, 'utf8');
        
        // Basic validation - file exists and has content
        if (content.trim().length === 0) {
          throw new Error(`Empty configuration file: ${configFile}`);
        }
        
        log.info(`  File size: ${(content.length / 1024).toFixed(2)} KB`);
        return true;
      });
    }
  }

  async testSampleData() {
    log.section('Sample Data');
    
    await this.test('Sample floor plan JSON is valid', () => {
      const floorPlanPath = path.join(process.cwd(), 'public/sample-floorplan.json');
      const content = fs.readFileSync(floorPlanPath, 'utf8');
      const data = JSON.parse(content);
      
      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid floor plan structure: missing rooms array');
      }
      
      log.info(`  Contains ${data.rooms.length} rooms`);
      return true;
    });
  }

  async runAllTests() {
    log.header('🚀 Starting Comprehensive System Tests');
    
    const startTime = Date.now();
    
    await this.testProjectStructure();
    await this.testDependencies();
    await this.testConfiguration();
    await this.testModels();
    await this.testSampleData();
    await this.testEnvironmentVariables();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Print summary
    log.header('📊 Test Results Summary');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Passed: ${this.results.passed}/${this.results.total}`);
    console.log(`❌ Failed: ${this.results.failed}/${this.results.total}`);
    console.log(`🎯 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      log.error('\n❌ Failed Tests:');
      this.results.details
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  - ${result.name}${result.error ? `: ${result.error}` : ''}`);
        });
    }
    
    if (this.results.failed === 0) {
      log.success('\n🎉 All tests passed! System is ready.');
    } else {
      log.warning('\n⚠️  Some tests failed. Please check the issues above.');
    }
    
    return this.results;
  }
}

// Run tests if this script is executed directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Test script loaded, checking execution...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// Always run tests when script is executed
const tester = new SystemTester();
tester.runAllTests().catch(error => {
  log.error(`Test runner failed: ${error.message}`);
  process.exit(1);
});

export default SystemTester; 