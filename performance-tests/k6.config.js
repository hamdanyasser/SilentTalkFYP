/**
 * k6 Base Configuration
 * Performance testing configuration for SilentTalk FYP
 *
 * Thresholds based on NFR-001:
 * - API p95 ≤ 200ms
 * - Error rate < 1%
 * - Success rate > 99%
 */

export const baseConfig = {
  // Test execution stages
  stages: {
    smoke: [
      { duration: '30s', target: 5 }, // Ramp up to 5 users
      { duration: '1m', target: 5 }, // Stay at 5 users
      { duration: '30s', target: 0 }, // Ramp down
    ],
    load: [
      { duration: '2m', target: 50 }, // Ramp up to 50 users
      { duration: '5m', target: 50 }, // Stay at 50 users
      { duration: '2m', target: 100 }, // Ramp up to 100 users
      { duration: '5m', target: 100 }, // Stay at 100 users
      { duration: '2m', target: 0 }, // Ramp down
    ],
    stress: [
      { duration: '2m', target: 100 }, // Ramp up to 100 users
      { duration: '5m', target: 100 }, // Stay at 100 users
      { duration: '2m', target: 200 }, // Ramp up to 200 users
      { duration: '5m', target: 200 }, // Stay at 200 users
      { duration: '2m', target: 300 }, // Ramp up to 300 users
      { duration: '5m', target: 300 }, // Stay at 300 users
      { duration: '5m', target: 0 }, // Ramp down
    ],
    spike: [
      { duration: '30s', target: 10 }, // Normal load
      { duration: '1m', target: 500 }, // Spike to 500 users
      { duration: '3m', target: 500 }, // Stay at spike
      { duration: '30s', target: 10 }, // Recovery
      { duration: '3m', target: 10 }, // Sustained recovery
    ],
    soak: [
      { duration: '5m', target: 50 }, // Ramp up
      { duration: '3h', target: 50 }, // Sustained load for 3 hours
      { duration: '5m', target: 0 }, // Ramp down
    ],
  },

  // Base thresholds (NFR-001 requirements)
  thresholds: {
    // API Response time requirements
    http_req_duration: [
      'p(95)<200', // 95% of requests must complete below 200ms (NFR-001)
      'p(99)<500', // 99% of requests must complete below 500ms
      'avg<150', // Average response time should be below 150ms
    ],
    // Error rate requirements
    http_req_failed: [
      'rate<0.01', // Error rate must be below 1%
    ],
    // Request rate monitoring
    http_reqs: [
      'rate>10', // Minimum 10 requests per second
    ],
    // Custom metrics
    api_success_rate: [
      'rate>0.99', // Success rate must be above 99%
    ],
    ml_inference_duration: [
      'p(95)<100', // ML inference should complete in <100ms at p95
      'p(99)<200', // ML inference should complete in <200ms at p99
    ],
    webrtc_connection_time: [
      'p(95)<1000', // WebRTC connection time <1s at p95
      'p(99)<2000', // WebRTC connection time <2s at p99
    ],
    page_load_time: [
      'p(95)<3000', // Page load time <3s at p95 (performance budget)
      'p(99)<5000', // Page load time <5s at p99
    ],
  },

  // HTTP options
  httpOptions: {
    timeout: '30s',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },

  // Test scenarios weights
  scenarios: {
    api_load: {
      executor: 'ramping-vus',
      weight: 40, // 40% of traffic
    },
    webrtc_load: {
      executor: 'ramping-vus',
      weight: 30, // 30% of traffic
    },
    ml_inference: {
      executor: 'ramping-vus',
      weight: 20, // 20% of traffic
    },
    page_load: {
      executor: 'ramping-vus',
      weight: 10, // 10% of traffic
    },
  },

  // Summary export options
  summaryExport: {
    format: 'json',
    path: './reports/summary.json',
  },

  // Environment variables
  env: {
    API_BASE_URL: __ENV.API_BASE_URL || 'http://localhost:5000',
    WS_BASE_URL: __ENV.WS_BASE_URL || 'ws://localhost:5000',
    WEB_BASE_URL: __ENV.WEB_BASE_URL || 'http://localhost:3000',
    TEST_MODE: __ENV.TEST_MODE || 'load', // smoke, load, stress, spike, soak
  },

  // Tags for filtering and analysis
  tags: {
    project: 'silenttalk-fyp',
    environment: __ENV.ENVIRONMENT || 'test',
    version: __ENV.VERSION || 'development',
  },
}

/**
 * Get stages configuration based on test mode
 */
export function getStages(mode) {
  return baseConfig.stages[mode] || baseConfig.stages.load
}

/**
 * Get thresholds with custom overrides
 */
export function getThresholds(customThresholds = {}) {
  return {
    ...baseConfig.thresholds,
    ...customThresholds,
  }
}

/**
 * Get HTTP options with auth token
 */
export function getHttpOptions(token = null) {
  const options = { ...baseConfig.httpOptions }
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`
  }
  return options
}

/**
 * Generate correlation ID for request tracing
 */
export function generateCorrelationId() {
  return `k6-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Add correlation headers to request
 */
export function addCorrelationHeaders(options, sessionId = null) {
  const correlationId = generateCorrelationId()
  options.headers = options.headers || {}
  options.headers['X-Correlation-ID'] = correlationId
  options.headers['X-Session-ID'] = sessionId || correlationId
  options.headers['X-Test-Run'] = 'k6-performance-test'
  return options
}
