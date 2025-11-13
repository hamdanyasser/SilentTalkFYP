# Performance Tests

Comprehensive performance testing infrastructure for SilentTalk FYP.

## Quick Start

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu/Debian

# Run smoke test (quick validation)
npm run perf:smoke

# Run full load test
npm run perf:load

# Run all tests
npm run perf:all
```

## Test Suite

| Test | File | Metrics | Target |
|------|------|---------|--------|
| API Performance | `api-performance.test.js` | P95 Latency | ≤200ms |
| WebRTC Load | `webrtc-load.test.js` | Connection Time P95 | ≤1000ms |
| ML Inference | `ml-inference.test.js` | Inference P95 | ≤100ms |
| Page Load | `page-load-budget.test.js` | Load Time P95 | ≤3000ms |

## Usage

### Individual Tests

```bash
# API performance test
k6 run api-performance.test.js

# With custom environment
k6 run --env API_BASE_URL=http://localhost:5000 --env TEST_MODE=smoke api-performance.test.js

# WebRTC load test
k6 run webrtc-load.test.js

# ML inference test
k6 run ml-inference.test.js

# Frontend page load test
k6 run page-load-budget.test.js
```

### Test Modes

Set `TEST_MODE` environment variable:

- `smoke` - Quick validation (5 users, 2 min)
- `load` - Normal load (50-100 users, 16 min)
- `stress` - High load (100-300 users, 31 min)
- `spike` - Traffic spike (10→500 users, 8 min)
- `soak` - Sustained load (50 users, 3 hours)

### NPM Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "perf:smoke": "cd performance-tests && TEST_MODE=smoke k6 run api-performance.test.js",
    "perf:load": "cd performance-tests && TEST_MODE=load k6 run api-performance.test.js",
    "perf:all": "cd performance-tests && ./run-all-tests.sh",
    "perf:report": "node scripts/generate-performance-report.js",
    "perf:check": "node scripts/check-all-thresholds.js performance-tests/reports"
  }
}
```

## Reports

Reports are generated in `reports/` directory:

- `*-raw.json` - Raw k6 data
- `*-summary.json` - Summarized metrics
- `performance-report.md` - Consolidated report
- `performance-report.json` - JSON report

### View Reports

```bash
# Generate report
npm run perf:report

# Check thresholds
npm run perf:check

# Detect regressions
node ../scripts/detect-performance-regressions.js reports/
```

## CI Integration

Tests run automatically on:
- Pull requests with `performance` label
- Pushes to `main` branch
- Manual workflow dispatch

See `.github/workflows/performance-tests.yml` for configuration.

## Configuration

Edit `k6.config.js` to customize:

- Test stages and durations
- Performance thresholds
- HTTP options
- Test scenarios

## Documentation

See [PERFORMANCE.md](./PERFORMANCE.md) for:
- Detailed test descriptions
- Bottleneck identification
- Optimization recommendations
- Troubleshooting guide

## Requirements

- k6 v0.47.0 or later
- Node.js 18+ (for report generation)
- Running API server (for API/WebRTC/ML tests)
- Running frontend (for page load tests)

## Targets (NFR-001)

- ✅ API P95: ≤200ms
- ✅ WebRTC Connection: ≤1000ms
- ✅ ML Inference: ≤100ms
- ✅ Page Load: ≤3000ms
- ✅ Error Rate: <1%
- ✅ Success Rate: >99%

## Support

Issues? Check:
1. [PERFORMANCE.md](./PERFORMANCE.md) - Detailed documentation
2. GitHub Actions logs
3. Test output and reports

---

**Related:** NFR-001 (p. 11), Success Metrics (pp. 27-28)
