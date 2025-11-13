#!/usr/bin/env node

/**
 * Check Performance Thresholds
 * Validates that performance test results meet defined thresholds
 */

const fs = require('fs')
const path = require('path')

// NFR-001 Thresholds
const THRESHOLDS = {
  api: {
    p95: 200, // ms
    p99: 500, // ms
    errorRate: 0.01, // 1%
    successRate: 0.99, // 99%
  },
  webrtc: {
    connectionTime_p95: 1000, // ms
    connectionTime_p99: 2000, // ms
    signalingLatency_p95: 100, // ms
    mediaQuality: 0.8, // 80%
    successRate: 0.98, // 98%
  },
  ml: {
    inference_p95: 100, // ms
    inference_p99: 200, // ms
    inference_avg: 80, // ms
    batch_p95: 500, // ms
    successRate: 0.99, // 99%
    accuracy: 0.9, // 90%
    throughput: 20, // req/sec
  },
  frontend: {
    pageLoad_p95: 3000, // ms
    tti_p95: 3500, // ms
    fcp_p95: 1500, // ms
    lcp_p95: 2500, // ms
    cls_avg: 0.1,
    fid_p95: 100, // ms
    tbt_p95: 300, // ms
    bundleSize: 500, // KB
  },
}

/**
 * Parse k6 summary JSON file
 */
function parseSummaryFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Summary file not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

/**
 * Check API performance thresholds
 */
function checkApiThresholds(summary) {
  const results = {
    passed: true,
    checks: [],
  }

  const httpDuration = summary.metrics.http_req_duration
  const httpFailed = summary.metrics.http_req_failed
  const successRate = summary.metrics.api_success_rate

  // Check P95 latency
  const p95 = httpDuration.values['p(95)']
  const p95Pass = p95 <= THRESHOLDS.api.p95
  results.checks.push({
    metric: 'API P95 Latency',
    value: `${p95.toFixed(2)}ms`,
    threshold: `≤${THRESHOLDS.api.p95}ms`,
    passed: p95Pass,
  })
  if (!p95Pass) results.passed = false

  // Check P99 latency
  const p99 = httpDuration.values['p(99)']
  const p99Pass = p99 <= THRESHOLDS.api.p99
  results.checks.push({
    metric: 'API P99 Latency',
    value: `${p99.toFixed(2)}ms`,
    threshold: `≤${THRESHOLDS.api.p99}ms`,
    passed: p99Pass,
  })
  if (!p99Pass) results.passed = false

  // Check error rate
  const errorRate = httpFailed.values.rate || 0
  const errorPass = errorRate < THRESHOLDS.api.errorRate
  results.checks.push({
    metric: 'API Error Rate',
    value: `${(errorRate * 100).toFixed(2)}%`,
    threshold: `<${THRESHOLDS.api.errorRate * 100}%`,
    passed: errorPass,
  })
  if (!errorPass) results.passed = false

  // Check success rate
  if (successRate) {
    const rate = successRate.values.rate || 0
    const ratePass = rate > THRESHOLDS.api.successRate
    results.checks.push({
      metric: 'API Success Rate',
      value: `${(rate * 100).toFixed(2)}%`,
      threshold: `>${THRESHOLDS.api.successRate * 100}%`,
      passed: ratePass,
    })
    if (!ratePass) results.passed = false
  }

  return results
}

/**
 * Check WebRTC performance thresholds
 */
function checkWebRTCThresholds(summary) {
  const results = {
    passed: true,
    checks: [],
  }

  const connectionTime = summary.metrics.webrtc_connection_time
  const signalingLatency = summary.metrics.signaling_latency
  const mediaQuality = summary.metrics.media_quality_score
  const successRate = summary.metrics.connection_success_rate

  // Check connection time P95
  const connP95 = connectionTime.values['p(95)']
  const connP95Pass = connP95 <= THRESHOLDS.webrtc.connectionTime_p95
  results.checks.push({
    metric: 'WebRTC Connection Time P95',
    value: `${connP95.toFixed(2)}ms`,
    threshold: `≤${THRESHOLDS.webrtc.connectionTime_p95}ms`,
    passed: connP95Pass,
  })
  if (!connP95Pass) results.passed = false

  // Check signaling latency
  if (signalingLatency) {
    const sigP95 = signalingLatency.values['p(95)']
    const sigP95Pass = sigP95 <= THRESHOLDS.webrtc.signalingLatency_p95
    results.checks.push({
      metric: 'Signaling Latency P95',
      value: `${sigP95.toFixed(2)}ms`,
      threshold: `≤${THRESHOLDS.webrtc.signalingLatency_p95}ms`,
      passed: sigP95Pass,
    })
    if (!sigP95Pass) results.passed = false
  }

  // Check media quality
  if (mediaQuality) {
    const quality = mediaQuality.values.avg
    const qualityPass = quality > THRESHOLDS.webrtc.mediaQuality
    results.checks.push({
      metric: 'Media Quality Score',
      value: `${(quality * 100).toFixed(2)}%`,
      threshold: `>${THRESHOLDS.webrtc.mediaQuality * 100}%`,
      passed: qualityPass,
    })
    if (!qualityPass) results.passed = false
  }

  // Check success rate
  if (successRate) {
    const rate = successRate.values.rate || 0
    const ratePass = rate > THRESHOLDS.webrtc.successRate
    results.checks.push({
      metric: 'Connection Success Rate',
      value: `${(rate * 100).toFixed(2)}%`,
      threshold: `>${THRESHOLDS.webrtc.successRate * 100}%`,
      passed: ratePass,
    })
    if (!ratePass) results.passed = false
  }

  return results
}

/**
 * Check ML inference thresholds
 */
function checkMLThresholds(summary) {
  const results = {
    passed: true,
    checks: [],
  }

  const inferenceDuration = summary.metrics.ml_inference_duration
  const batchDuration = summary.metrics.ml_batch_inference_duration
  const successRate = summary.metrics.inference_success_rate
  const accuracy = summary.metrics.model_accuracy_score
  const throughput = summary.metrics.inference_throughput_rps

  // Check inference P95
  const infP95 = inferenceDuration.values['p(95)']
  const infP95Pass = infP95 <= THRESHOLDS.ml.inference_p95
  results.checks.push({
    metric: 'ML Inference P95',
    value: `${infP95.toFixed(2)}ms`,
    threshold: `≤${THRESHOLDS.ml.inference_p95}ms`,
    passed: infP95Pass,
  })
  if (!infP95Pass) results.passed = false

  // Check inference average
  const infAvg = inferenceDuration.values.avg
  const infAvgPass = infAvg <= THRESHOLDS.ml.inference_avg
  results.checks.push({
    metric: 'ML Inference Average',
    value: `${infAvg.toFixed(2)}ms`,
    threshold: `≤${THRESHOLDS.ml.inference_avg}ms`,
    passed: infAvgPass,
  })
  if (!infAvgPass) results.passed = false

  // Check batch inference
  if (batchDuration) {
    const batchP95 = batchDuration.values['p(95)']
    const batchP95Pass = batchP95 <= THRESHOLDS.ml.batch_p95
    results.checks.push({
      metric: 'Batch Inference P95',
      value: `${batchP95.toFixed(2)}ms`,
      threshold: `≤${THRESHOLDS.ml.batch_p95}ms`,
      passed: batchP95Pass,
    })
    if (!batchP95Pass) results.passed = false
  }

  // Check success rate
  if (successRate) {
    const rate = successRate.values.rate || 0
    const ratePass = rate > THRESHOLDS.ml.successRate
    results.checks.push({
      metric: 'Inference Success Rate',
      value: `${(rate * 100).toFixed(2)}%`,
      threshold: `>${THRESHOLDS.ml.successRate * 100}%`,
      passed: ratePass,
    })
    if (!ratePass) results.passed = false
  }

  // Check accuracy
  if (accuracy) {
    const acc = accuracy.values.avg
    const accPass = acc > THRESHOLDS.ml.accuracy
    results.checks.push({
      metric: 'Model Accuracy',
      value: `${(acc * 100).toFixed(2)}%`,
      threshold: `>${THRESHOLDS.ml.accuracy * 100}%`,
      passed: accPass,
    })
    if (!accPass) results.passed = false
  }

  // Check throughput
  if (throughput) {
    const tput = throughput.values.avg
    const tputPass = tput > THRESHOLDS.ml.throughput
    results.checks.push({
      metric: 'Throughput',
      value: `${tput.toFixed(2)} req/sec`,
      threshold: `>${THRESHOLDS.ml.throughput} req/sec`,
      passed: tputPass,
    })
    if (!tputPass) results.passed = false
  }

  return results
}

/**
 * Check frontend performance thresholds
 */
function checkFrontendThresholds(summary) {
  const results = {
    passed: true,
    checks: [],
  }

  const pageLoad = summary.metrics.page_load_time
  const tti = summary.metrics.time_to_interactive
  const fcp = summary.metrics.first_contentful_paint
  const lcp = summary.metrics.largest_contentful_paint
  const cls = summary.metrics.cumulative_layout_shift
  const fid = summary.metrics.first_input_delay
  const tbt = summary.metrics.total_blocking_time
  const bundleSize = summary.metrics.bundle_size_kb

  // Check page load P95
  const loadP95 = pageLoad.values['p(95)']
  const loadP95Pass = loadP95 <= THRESHOLDS.frontend.pageLoad_p95
  results.checks.push({
    metric: 'Page Load Time P95',
    value: `${loadP95.toFixed(0)}ms`,
    threshold: `≤${THRESHOLDS.frontend.pageLoad_p95}ms`,
    passed: loadP95Pass,
  })
  if (!loadP95Pass) results.passed = false

  // Check TTI P95
  const ttiP95 = tti.values['p(95)']
  const ttiP95Pass = ttiP95 <= THRESHOLDS.frontend.tti_p95
  results.checks.push({
    metric: 'Time to Interactive P95',
    value: `${ttiP95.toFixed(0)}ms`,
    threshold: `≤${THRESHOLDS.frontend.tti_p95}ms`,
    passed: ttiP95Pass,
  })
  if (!ttiP95Pass) results.passed = false

  // Check FCP P95
  const fcpP95 = fcp.values['p(95)']
  const fcpP95Pass = fcpP95 <= THRESHOLDS.frontend.fcp_p95
  results.checks.push({
    metric: 'First Contentful Paint P95',
    value: `${fcpP95.toFixed(0)}ms`,
    threshold: `≤${THRESHOLDS.frontend.fcp_p95}ms`,
    passed: fcpP95Pass,
  })
  if (!fcpP95Pass) results.passed = false

  // Check LCP P95
  const lcpP95 = lcp.values['p(95)']
  const lcpP95Pass = lcpP95 <= THRESHOLDS.frontend.lcp_p95
  results.checks.push({
    metric: 'Largest Contentful Paint P95',
    value: `${lcpP95.toFixed(0)}ms`,
    threshold: `≤${THRESHOLDS.frontend.lcp_p95}ms`,
    passed: lcpP95Pass,
  })
  if (!lcpP95Pass) results.passed = false

  // Check CLS
  const clsAvg = cls.values.avg
  const clsAvgPass = clsAvg < THRESHOLDS.frontend.cls_avg
  results.checks.push({
    metric: 'Cumulative Layout Shift',
    value: clsAvg.toFixed(3),
    threshold: `<${THRESHOLDS.frontend.cls_avg}`,
    passed: clsAvgPass,
  })
  if (!clsAvgPass) results.passed = false

  // Check FID P95
  const fidP95 = fid.values['p(95)']
  const fidP95Pass = fidP95 <= THRESHOLDS.frontend.fid_p95
  results.checks.push({
    metric: 'First Input Delay P95',
    value: `${fidP95.toFixed(0)}ms`,
    threshold: `≤${THRESHOLDS.frontend.fid_p95}ms`,
    passed: fidP95Pass,
  })
  if (!fidP95Pass) results.passed = false

  // Check TBT P95
  const tbtP95 = tbt.values['p(95)']
  const tbtP95Pass = tbtP95 <= THRESHOLDS.frontend.tbt_p95
  results.checks.push({
    metric: 'Total Blocking Time P95',
    value: `${tbtP95.toFixed(0)}ms`,
    threshold: `≤${THRESHOLDS.frontend.tbt_p95}ms`,
    passed: tbtP95Pass,
  })
  if (!tbtP95Pass) results.passed = false

  // Check bundle size
  const bundleAvg = bundleSize.values.avg
  const bundlePass = bundleAvg < THRESHOLDS.frontend.bundleSize
  results.checks.push({
    metric: 'Bundle Size Average',
    value: `${bundleAvg.toFixed(0)}KB`,
    threshold: `<${THRESHOLDS.frontend.bundleSize}KB`,
    passed: bundlePass,
  })
  if (!bundlePass) results.passed = false

  return results
}

/**
 * Print results table
 */
function printResults(testType, results) {
  console.log(`\n=== ${testType} Performance Threshold Checks ===\n`)

  const maxMetricLen = Math.max(...results.checks.map(c => c.metric.length))
  const maxValueLen = Math.max(...results.checks.map(c => c.value.length))
  const maxThresholdLen = Math.max(...results.checks.map(c => c.threshold.length))

  console.log(
    `${'Metric'.padEnd(maxMetricLen)} | ${'Value'.padEnd(maxValueLen)} | ${'Threshold'.padEnd(maxThresholdLen)} | Status`,
  )
  console.log('-'.repeat(maxMetricLen + maxValueLen + maxThresholdLen + 20))

  results.checks.forEach(check => {
    const status = check.passed ? '✓ PASS' : '✗ FAIL'
    console.log(
      `${check.metric.padEnd(maxMetricLen)} | ${check.value.padEnd(maxValueLen)} | ${check.threshold.padEnd(maxThresholdLen)} | ${status}`,
    )
  })

  console.log(`\nOverall: ${results.passed ? '✓ PASS' : '✗ FAIL'}`)
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: check-performance-thresholds.js <summary-file.json>')
    process.exit(1)
  }

  const summaryFile = args[0]
  const basename = path.basename(summaryFile)

  try {
    const summary = parseSummaryFile(summaryFile)

    let results
    let testType

    // Determine test type from filename
    if (basename.includes('api-performance')) {
      testType = 'API'
      results = checkApiThresholds(summary)
    } else if (basename.includes('webrtc')) {
      testType = 'WebRTC'
      results = checkWebRTCThresholds(summary)
    } else if (basename.includes('ml-inference')) {
      testType = 'ML Inference'
      results = checkMLThresholds(summary)
    } else if (basename.includes('page-load')) {
      testType = 'Frontend'
      results = checkFrontendThresholds(summary)
    } else {
      console.error(`Unknown test type for file: ${basename}`)
      process.exit(1)
    }

    printResults(testType, results)

    if (!results.passed) {
      console.error('\n❌ Performance thresholds not met!')
      process.exit(1)
    }

    console.log('\n✅ All performance thresholds met!')
    process.exit(0)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  checkApiThresholds,
  checkWebRTCThresholds,
  checkMLThresholds,
  checkFrontendThresholds,
  THRESHOLDS,
}
