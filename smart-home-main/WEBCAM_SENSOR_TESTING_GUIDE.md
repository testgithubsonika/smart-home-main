# Webcam & Sensor Testing Guide

This guide provides comprehensive instructions for testing webcam, microphone, and sensor functionality in the Smart Home application.

## 🚀 Quick Start

### 1. Access the Testing Interface

Navigate to the testing interface in your application:
- **Development**: Use the `WebcamSensorTester` component
- **Production**: Access via `/dev-tools` or create a dedicated testing route

### 2. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📹 Webcam Testing

### Basic Webcam Test

1. **Start Webcam Test**
   - Click "Test Webcam" button
   - Allow camera permissions when prompted
   - Verify video stream appears in the preview window

2. **Expected Results**
   - ✅ Video stream displays correctly
   - ✅ Camera permissions granted
   - ✅ No error messages
   - ✅ "Active" badge appears

3. **Troubleshooting**
   - **Permission Denied**: Check browser settings and allow camera access
   - **No Video**: Ensure camera is not in use by other applications
   - **Poor Quality**: Check camera settings and lighting conditions

### Advanced Webcam Features

#### Face Detection Testing
1. **Prerequisites**
   - Webcam must be active
   - AI models must be loaded (check "AI Models" tab)

2. **Test Steps**
   - Position face in camera view
   - Click "Test Face Detection"
   - Wait for processing (may take 2-3 seconds)

3. **Expected Results**
   - ✅ "Face Detected" badge appears
   - ✅ Face descriptor vector generated
   - ✅ Vector length displayed (typically 128 dimensions)

#### Depth Camera Testing
1. **Hardware Requirements**
   - Compatible depth camera (Intel RealSense, etc.)
   - USB connection

2. **Test Steps**
   - Click "Test Depth Camera"
   - Wait for connection attempt

3. **Expected Results**
   - ✅ "Connected" badge (if hardware available)
   - ✅ "Simulation Mode" badge (fallback)
   - ✅ Depth map data available

## 🎤 Microphone Testing

### Basic Microphone Test

1. **Start Microphone Test**
   - Click "Test Microphone" button
   - Allow microphone permissions when prompted
   - Speak or make noise to test audio levels

2. **Expected Results**
   - ✅ Audio level meter shows activity
   - ✅ "Audio detected" message appears
   - ✅ No error messages
   - ✅ "Active" badge appears

3. **Audio Level Interpretation**
   - **0-25**: Very quiet or no audio
   - **26-50**: Low audio levels
   - **51-100**: Normal speaking volume
   - **101-255**: Loud audio

### Troubleshooting Microphone Issues

#### Common Problems
- **Permission Denied**: Check browser microphone settings
- **No Audio Detected**: Ensure microphone is not muted
- **Low Audio Levels**: Check microphone volume and positioning
- **Echo/Feedback**: Disable echo cancellation in browser settings

#### Browser-Specific Settings

**Chrome/Edge:**
1. Click the lock icon in address bar
2. Set "Microphone" to "Allow"
3. Refresh the page

**Firefox:**
1. Click the microphone icon in address bar
2. Select "Allow" for microphone access
3. Refresh the page

**Safari:**
1. Go to Safari > Preferences > Websites > Microphone
2. Set permission to "Allow"
3. Refresh the page

## 🔍 Sensor Testing

### Motion Sensor Simulation

1. **Test Motion Detection**
   - Click "Motion" sensor button
   - Watch for simulated motion events
   - Check sensor data display

2. **Expected Results**
   - ✅ Motion events generated
   - ✅ Data shows "detected" or "0" values
   - ✅ Timestamps recorded

### Environmental Sensors

#### Temperature Sensor
- **Range**: 20-30°C (simulated)
- **Unit**: °C
- **Update Frequency**: Every 5 seconds during test

#### Humidity Sensor
- **Range**: 40-70% (simulated)
- **Unit**: %
- **Update Frequency**: Every 5 seconds during test

#### Light Sensor
- **Range**: 0-1000 lux (simulated)
- **Unit**: lux
- **Update Frequency**: Every 5 seconds during test

### Sensor Data Validation

1. **Check Data Format**
   ```json
   {
     "type": "temperature-sensor",
     "value": 24.5,
     "unit": "°C",
     "timestamp": "2024-01-15T10:30:00.000Z"
   }
   ```

2. **Verify Data Consistency**
   - Values within expected ranges
   - Proper units displayed
   - Timestamps are recent and accurate

## 🤖 AI Models Testing

### Model Loading Status

1. **Check Model Status**
   - Navigate to "AI Models" tab
   - Verify all models show "Loaded" status

2. **Required Models**
   - Face Detection Models
   - Face Recognition Models
   - Landmark Detection Models

### Model Performance Testing

1. **Face Detection Accuracy**
   - Test with different face angles
   - Test with multiple faces
   - Test with varying lighting conditions

2. **Processing Speed**
   - Measure time from detection to descriptor extraction
   - Expected: 1-3 seconds for first detection
   - Subsequent detections should be faster

## 🧪 Comprehensive Testing

### Run All Tests

1. **Automated Testing**
   - Click "Run All Tests" button
   - Tests run sequentially
   - Progress indicator shows current test

2. **Test Sequence**
   1. Webcam Access
   2. Microphone Access
   3. Face Detection
   4. Depth Camera
   5. Motion Sensor
   6. Temperature Sensor
   7. Humidity Sensor
   8. Light Sensor

3. **Results Summary**
   - All tests show "passed" status
   - No error messages
   - All functionality working

### Manual Testing Checklist

#### Camera Features
- [ ] Webcam starts successfully
- [ ] Video stream displays correctly
- [ ] Camera permissions work
- [ ] Face detection functions
- [ ] Face descriptors generated
- [ ] Depth camera connects (if available)

#### Audio Features
- [ ] Microphone permissions granted
- [ ] Audio levels detected
- [ ] Audio visualization works
- [ ] No audio errors

#### Sensor Features
- [ ] Motion sensor simulation works
- [ ] Temperature sensor generates data
- [ ] Humidity sensor generates data
- [ ] Light sensor generates data
- [ ] Sensor data format is correct

#### AI Features
- [ ] Models load successfully
- [ ] Face detection is accurate
- [ ] Processing speed is acceptable
- [ ] No model errors

## 🐛 Troubleshooting

### Common Issues

#### Camera Issues
```javascript
// Check camera permissions
navigator.permissions.query({ name: 'camera' })
  .then(result => console.log('Camera permission:', result.state));

// List available cameras
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const cameras = devices.filter(device => device.kind === 'videoinput');
    console.log('Available cameras:', cameras);
  });
```

#### Microphone Issues
```javascript
// Check microphone permissions
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Microphone permission:', result.state));

// List available microphones
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const mics = devices.filter(device => device.kind === 'audioinput');
    console.log('Available microphones:', mics);
  });
```

#### AI Model Issues
```javascript
// Check model loading status
console.log('Models loaded:', modelsLoaded);

// Test model accessibility
fetch('/models/face-api.js-models-master/ssd_mobilenetv1/ssd_mobilenetv1_model-weights_manifest.json')
  .then(response => console.log('Model accessible:', response.ok));
```

### Error Messages

#### "Camera not found"
- Check camera connection
- Ensure camera is not in use by other applications
- Try refreshing the page

#### "Microphone not found"
- Check microphone connection
- Ensure microphone is not muted
- Check system audio settings

#### "Models not loaded"
- Wait for models to load (first time may take longer)
- Check internet connection
- Verify model files are accessible

#### "Permission denied"
- Check browser permissions
- Allow camera/microphone access
- Refresh the page after granting permissions

## 📊 Performance Testing

### Load Testing

1. **Multiple Streams**
   - Test with multiple camera streams
   - Test with multiple audio streams
   - Monitor system performance

2. **Continuous Operation**
   - Run tests for extended periods
   - Monitor memory usage
   - Check for memory leaks

### Stress Testing

1. **High Resolution**
   - Test with maximum camera resolution
   - Monitor frame rate
   - Check processing performance

2. **Multiple AI Operations**
   - Run multiple face detections simultaneously
   - Monitor processing queue
   - Check for conflicts

## 🔒 Security Testing

### Permission Testing

1. **Permission Denial**
   - Test behavior when permissions are denied
   - Verify graceful error handling
   - Check user feedback

2. **Permission Revocation**
   - Test behavior when permissions are revoked during operation
   - Verify stream cleanup
   - Check error recovery

### Data Privacy

1. **Stream Security**
   - Verify streams are not accessible to other applications
   - Check for data leakage
   - Monitor network usage

2. **AI Model Security**
   - Verify model data is not exposed
   - Check for unauthorized access
   - Monitor model usage

## 📱 Browser Compatibility

### Supported Browsers

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (macOS)
- **Edge**: Full support

### Mobile Testing

- **iOS Safari**: Limited support (no getUserMedia)
- **Android Chrome**: Full support
- **Android Firefox**: Full support

### Feature Detection

```javascript
// Check for getUserMedia support
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported');
} else {
  console.log('getUserMedia not supported');
}

// Check for WebGL support (for AI models)
if (window.WebGLRenderingContext) {
  console.log('WebGL supported');
} else {
  console.log('WebGL not supported');
}
```

## 📈 Monitoring and Logging

### Console Logging

Enable detailed logging for debugging:

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check logs in browser console
console.log('Camera stream:', webcamStream);
console.log('Audio stream:', audioStream);
console.log('Sensor data:', sensorData);
```

### Performance Monitoring

```javascript
// Monitor frame rate
let frameCount = 0;
let lastTime = performance.now();

function monitorPerformance() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    console.log('FPS:', fps);
    frameCount = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(monitorPerformance);
}
```

## 🎯 Best Practices

### Testing Environment

1. **Consistent Setup**
   - Use same hardware for testing
   - Maintain consistent lighting
   - Use stable internet connection

2. **Test Data**
   - Use consistent test images/audio
   - Document test conditions
   - Maintain test history

### Documentation

1. **Test Results**
   - Record all test results
   - Document any issues found
   - Track performance metrics

2. **Bug Reports**
   - Include browser and version
   - Include hardware specifications
   - Include error messages and logs

### Continuous Testing

1. **Automated Tests**
   - Set up automated testing pipeline
   - Run tests on multiple browsers
   - Monitor for regressions

2. **Performance Monitoring**
   - Track performance over time
   - Set up alerts for degradation
   - Monitor user feedback

---

*This guide should help you thoroughly test all webcam and sensor functionality in your Smart Home application. For additional support, refer to the browser documentation or contact the development team.* 