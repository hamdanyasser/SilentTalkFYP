# Performance Testing Infrastructure

## Overview

This directory contains comprehensive performance testing infrastructure for the SilentTalk FYP project, implementing **NFR-001** (Performance Requirements) and **Success Metrics** (pp. 27-28).

### Performance Targets (NFR-001)

- **API Performance**: p95 ≤ 200ms
- **WebRTC Connection**: p95 ≤ 1000ms
- **ML Inference**: p95 ≤ 100ms
- **Page Load**: p95 ≤ 3000ms
- **Error Rate**: < 1%
- **Success Rate**: > 99%

## Test Suite

### 1. API Performance Tests (`api-performance.test.js`)

Tests all API endpoints under various load conditions:

- **Authentication**: Registration, login, token refresh
- **Profile Operations**: CRUD operations on user profiles
- **Video Sessions**: Session creation, management, stats
- **Forum**: Post creation, listing, comments
- **Resources**: Library access, search
- **Booking**: Interpreter listing, availability, booking creation

**Key Metrics:**
- P50/P95/P99 latency
- Error rate
- Success rate
- Requests per second
- Database query duration

**Run Command:**
```bash
k6 run --env TEST_MODE=load api-performance.test.js
```

### 2. WebRTC Load Tests (`webrtc-load.test.js`)

Simulates multi-party video conferencing scenarios:

- **Peer-to-peer** (2 participants)
- **Small groups** (4 participants)
- **Medium groups** (8 participants)
- **Large meetings** (20 participants)

**Key Metrics:**
- Connection establishment time
- Signaling latency
- Media quality score
- Packet loss, jitter, bitrate
- Connection success rate

**Run Command:**
```bash
k6 run --env TEST_MODE=load webrtc-load.test.js
```

### 3. ML Inference Tests (`ml-inference.test.js`)

Tests ASL recognition model performance:

- **Single frame inference**
- **Batch processing**
- **Real-time video stream** (30 fps)
- **Cold start latency**
- **Concurrent requests**

**Key Metrics:**
- Inference time (P50/P95/P99)
- Model accuracy
- Throughput (requests/sec)
- Cold start time
- GPU/CPU utilization

**Run Command:**
```bash
k6 run --env TEST_MODE=load ml-inference.test.js
```

### 4. Frontend Performance Tests (`page-load-budget.test.js`)

Tests page load performance against budgets:

**Pages Tested:**
- Home Page
- Sign Language Learning
- Video Call
- Forum
- Resource Library
- Interpreter Booking
- User Profile

**Key Metrics:**
- Page Load Time
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Total Blocking Time (TBT)
- Bundle Size

**Run Command:**
```bash
k6 run --env TEST_MODE=load page-load-budget.test.js
```

## Test Modes

Configure test intensity with `TEST_MODE` environment variable:

### Smoke Test (Quick validation)
```bash
export TEST_MODE=smoke
# 5 users, 2 minutes
```

### Load Test (Normal traffic)
```bash
export TEST_MODE=load
# 50-100 users, 16 minutes
```

### Stress Test (High traffic)
```bash
export TEST_MODE=stress
# 100-300 users, 31 minutes
```

### Spike Test (Sudden traffic surge)
```bash
export TEST_MODE=spike
# 10→500 users spike, 8 minutes
```

### Soak Test (Sustained load)
```bash
export TEST_MODE=soak
# 50 users, 3 hours
```

## CI Integration

Performance tests run automatically on:
- **Pull Requests** with `performance` label
- **Pushes to main** branch
- **Manual workflow dispatch**

### GitHub Actions Workflow

Located at `.github/workflows/performance-tests.yml`:

1. **Setup**: Installs dependencies, starts services
2. **API Tests**: Validates API performance
3. **WebRTC Tests**: Validates real-time communication
4. **ML Tests**: Validates inference latency
5. **Frontend Tests**: Validates page load budgets
6. **Report Generation**: Consolidates results
7. **Regression Detection**: Compares with baseline
8. **PR Comments**: Posts results to pull request

### Running Locally

```bash
# Install k6
brew install k6  # macOS
# or
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz

# Run individual test
cd performance-tests
k6 run api-performance.test.js

# Run with custom config
k6 run --env TEST_MODE=smoke --env API_BASE_URL=http://localhost:5000 api-performance.test.js

# Run all tests
./run-all-tests.sh
```

## Reports

### Automated Reports

After each test run, reports are generated in `performance-tests/reports/`:

- `*-raw.json`: Raw k6 metrics data
- `*-summary.json`: Summarized metrics
- `performance-report.md`: Consolidated markdown report
- `performance-report.json`: Consolidated JSON report

### Viewing Reports

```bash
# Generate consolidated report
node ../scripts/generate-performance-report.js

# Check thresholds
node ../scripts/check-performance-thresholds.js reports/api-performance-summary.json

# Detect regressions
node ../scripts/detect-performance-regressions.js reports/

# Check all thresholds
node ../scripts/check-all-thresholds.js reports/
```

## Common Bottlenecks & Fixes

### 1. API Latency > 200ms (P95)

**Common Causes:**
- Unoptimized database queries
- Missing database indexes
- N+1 query problems
- No caching layer
- Synchronous external API calls

**Fixes:**
```javascript
// ❌ Bad: N+1 queries
posts.forEach(post => {
  const author = await db.users.findOne({ id: post.authorId })
})

// ✅ Good: Batch query
const authorIds = posts.map(p => p.authorId)
const authors = await db.users.find({ id: { $in: authorIds } })
```

**Optimizations:**
- Add database indexes on frequently queried fields
- Implement Redis caching for hot data
- Use connection pooling
- Implement database query pagination
- Profile slow queries with query analyzer

### 2. WebRTC Connection Time > 1000ms

**Common Causes:**
- Slow STUN/TURN server response
- Complex signaling flow
- Network traversal issues
- ICE candidate gathering delays

**Fixes:**
- Use geographically distributed TURN servers
- Implement Trickle ICE
- Optimize signaling message size
- Add connection pooling
- Use UDP over TCP when possible

**Configuration:**
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'pass',
    },
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10, // Pre-gather candidates
}
```

### 3. ML Inference > 100ms (P95)

**Common Causes:**
- Running on CPU instead of GPU
- Unoptimized model architecture
- Large model size
- No batch processing
- Cold start issues

**Fixes:**
- Enable GPU acceleration (CUDA/TensorRT)
- Implement model quantization (INT8/FP16)
- Use ONNX Runtime for optimization
- Add inference result caching
- Pre-warm model on startup
- Implement batch inference for non-real-time requests

**Example Optimization:**
```python
# ❌ Bad: Sequential inference
for frame in frames:
    result = model.predict(frame)

# ✅ Good: Batch inference
results = model.predict_batch(frames)
```

**TensorFlow Optimization:**
```python
import tensorflow as tf

# Enable mixed precision
tf.keras.mixed_precision.set_global_policy('mixed_float16')

# Quantize model
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()
```

### 4. Page Load > 3000ms (P95)

**Common Causes:**
- Large JavaScript bundles
- Unoptimized images
- Render-blocking resources
- No code splitting
- Slow CDN or no CDN

**Fixes:**

**Code Splitting:**
```javascript
// ❌ Bad: Single large bundle
import Forum from './components/Forum'
import Booking from './components/Booking'

// ✅ Good: Dynamic imports
const Forum = lazy(() => import('./components/Forum'))
const Booking = lazy(() => import('./components/Booking'))
```

**Image Optimization:**
```html
<!-- ❌ Bad: Large unoptimized image -->
<img src="hero.jpg" />

<!-- ✅ Good: Responsive WebP with fallback -->
<picture>
  <source srcset="hero-800.webp 800w, hero-1200.webp 1200w" type="image/webp" />
  <img src="hero-800.jpg" srcset="hero-800.jpg 800w, hero-1200.jpg 1200w"
       loading="lazy" decoding="async" />
</picture>
```

**Bundle Optimization:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
}
```

### 5. High Cumulative Layout Shift (CLS > 0.1)

**Common Causes:**
- Images without dimensions
- Dynamic content injection
- Web fonts causing FOIT/FOUT
- Ads without reserved space

**Fixes:**
```css
/* ❌ Bad: No dimensions */
img {
  width: 100%;
}

/* ✅ Good: Aspect ratio box */
.img-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.img-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

**Font Loading:**
```css
/* ❌ Bad: FOUT (Flash of Unstyled Text) */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2');
}

/* ✅ Good: Font display swap with fallback */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2');
  font-display: swap;
}

body {
  font-family: 'CustomFont', Arial, sans-serif;
}
```

### 6. Total Blocking Time > 300ms

**Common Causes:**
- Long-running JavaScript tasks
- Heavy synchronous operations
- Large component renders
- Unoptimized third-party scripts

**Fixes:**
```javascript
// ❌ Bad: Blocking operation
const result = heavyComputation(largeArray)

// ✅ Good: Web Worker
const worker = new Worker('heavy-computation.worker.js')
worker.postMessage(largeArray)
worker.onmessage = (e) => {
  const result = e.data
}
```

**React Optimization:**
```javascript
// ❌ Bad: No memoization
function ExpensiveComponent({ data }) {
  const result = expensiveCalculation(data)
  return <div>{result}</div>
}

// ✅ Good: Memoized
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const result = useMemo(() => expensiveCalculation(data), [data])
  return <div>{result}</div>
})
```

## Performance Monitoring

### Real-time Monitoring

Integrate performance monitoring in production:

```javascript
import { performanceMonitoring } from './services/performanceMonitoringService'

// Track API calls
performanceMonitoring.recordApiCall(endpoint, method, status, duration, correlationId)

// Track WebRTC
performanceMonitoring.recordWebRTCStats(stats)

// Track ML inference
performanceMonitoring.recordMLInference(duration, accuracy)

// Get current stats
const stats = performanceMonitoring.getStats()
```

### Alerts

Set up alerts for threshold violations:

```javascript
if (stats.api.p95 > 200) {
  alert('API P95 latency exceeds 200ms target!')
}

if (stats.webrtc.averagePacketLoss > 5) {
  alert('WebRTC packet loss exceeds 5%!')
}
```

## Baseline Management

### Creating Baseline

Baselines are automatically created when tests run on `main` branch:

```bash
# Manual baseline creation
cp performance-tests/reports/*.json performance-tests/baseline/
```

### Updating Baseline

Baselines should be updated when:
- Intentional performance improvements are made
- Architecture changes affect performance
- New features are added that change performance characteristics

**Do not update baseline to hide regressions!**

## Best Practices

### 1. Test Regularly
- Run smoke tests on every PR
- Run full load tests weekly
- Run soak tests before major releases

### 2. Monitor Trends
- Track performance metrics over time
- Set up dashboards (Grafana, DataDog)
- Review performance in sprint retrospectives

### 3. Set Realistic Targets
- Base targets on user requirements (NFR-001)
- Consider real-world network conditions
- Account for geographic distribution

### 4. Isolate Tests
- Use dedicated test environments
- Avoid running on developer machines
- Use containerized environments for consistency

### 5. Analyze Before Optimizing
- Profile before making changes
- Measure actual bottlenecks
- Optimize highest-impact areas first

## Troubleshooting

### Tests Failing in CI but Passing Locally

**Cause:** Different hardware, network conditions, or concurrent load

**Fix:**
- Use consistent test environments (Docker)
- Adjust thresholds for CI environment
- Run multiple iterations and average results

### High Variability in Results

**Cause:** Network instability, resource contention, cold starts

**Fix:**
- Increase test duration
- Add warmup period
- Use percentiles (P95/P99) instead of averages
- Run tests multiple times and use median

### False Positives in Regression Detection

**Cause:** Normal variance, transient issues, baseline staleness

**Fix:**
- Adjust regression threshold (currently 10%)
- Update baseline regularly
- Use multiple test runs for comparison
- Ignore low-severity regressions

## Resources

### Documentation
- [k6 Documentation](https://k6.io/docs/)
- [Web Vitals](https://web.dev/vitals/)
- [WebRTC Performance](https://webrtc.org/getting-started/testing)

### Tools
- [k6](https://k6.io/) - Load testing tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Frontend performance
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Performance profiling

### Benchmarks
- [HTTPArchive](https://httparchive.org/) - Web performance trends
- [SpeedCurve](https://speedcurve.com/) - Performance benchmarking

## Support

For questions or issues with performance testing:

1. Check this documentation
2. Review test output and reports
3. Check GitHub Actions logs
4. Open an issue with:
   - Test type
   - Environment details
   - Error messages
   - Performance report

---

**Last Updated:** 2025-11-13
**Maintained by:** SilentTalk FYP Team
