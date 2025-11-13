#!/usr/bin/env node

/**
 * Detect Performance Regressions
 * Compares current test results with baseline to identify regressions
 */

const fs = require('fs')
const path = require('path')

const BASELINE_DIR = path.join(__dirname, '../performance-tests/baseline')
const REGRESSION_THRESHOLD = 0.1 // 10% regression threshold

/**
 * Load baseline results
 */
function loadBaseline() {
  if (!fs.existsSync(BASELINE_DIR)) {
    console.warn('No baseline found. Skipping regression detection.')
    return null
  }

  const baseline = {}
  const files = fs.readdirSync(BASELINE_DIR)

  files.forEach(file => {
    if (!file.endsWith('-summary.json')) return

    const filePath = path.join(BASELINE_DIR, file)
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      if (file.includes('api-performance')) {
        baseline.api = data
      } else if (file.includes('webrtc')) {
        baseline.webrtc = data
      } else if (file.includes('ml-inference')) {
        baseline.ml = data
      } else if (file.includes('page-load')) {
        baseline.frontend = data
      }
    } catch (error) {
      console.error(`Error loading baseline ${file}: ${error.message}`)
    }
  })

  return baseline
}

/**
 * Load current results
 */
function loadCurrentResults(reportsDir) {
  const current = {}
  const files = fs.readdirSync(reportsDir, { recursive: true })

  files.forEach(file => {
    const filePath = path.join(reportsDir, file)
    if (!fs.statSync(filePath).isFile()) return
    if (!file.endsWith('-summary.json')) return

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      if (file.includes('api-performance')) {
        current.api = data
      } else if (file.includes('webrtc')) {
        current.webrtc = data
      } else if (file.includes('ml-inference')) {
        current.ml = data
      } else if (file.includes('page-load')) {
        current.frontend = data
      }
    } catch (error) {
      console.error(`Error loading current result ${file}: ${error.message}`)
    }
  })

  return current
}

/**
 * Compare metric values
 */
function compareMetric(current, baseline, metricName, isLowerBetter = true) {
  if (!current || !baseline) return null

  const diff = current - baseline
  const percentChange = (diff / baseline) * 100

  // For metrics where lower is better (latency, error rate)
  // A positive change is a regression
  // For metrics where higher is better (throughput, success rate)
  // A negative change is a regression
  const isRegression = isLowerBetter
    ? percentChange > REGRESSION_THRESHOLD * 100
    : percentChange < -REGRESSION_THRESHOLD * 100

  return {
    metric: metricName,
    baseline: baseline.toFixed(2),
    current: current.toFixed(2),
    diff: diff.toFixed(2),
    percentChange: percentChange.toFixed(2),
    isRegression,
    severity: Math.abs(percentChange) > 20 ? 'high' : Math.abs(percentChange) > 10 ? 'medium' : 'low',
  }
}

/**
 * Detect API regressions
 */
function detectApiRegressions(current, baseline) {
  if (!current || !baseline) return []

  const regressions = []

  // Check P95 latency
  const p95Comparison = compareMetric(
    current.metrics.http_req_duration.values['p(95)'],
    baseline.metrics.http_req_duration.values['p(95)'],
    'API P95 Latency (ms)',
    true,
  )
  if (p95Comparison?.isRegression) regressions.push(p95Comparison)

  // Check P99 latency
  const p99Comparison = compareMetric(
    current.metrics.http_req_duration.values['p(99)'],
    baseline.metrics.http_req_duration.values['p(99)'],
    'API P99 Latency (ms)',
    true,
  )
  if (p99Comparison?.isRegression) regressions.push(p99Comparison)

  // Check error rate
  const errorComparison = compareMetric(
    (current.metrics.http_req_failed.values.rate || 0) * 100,
    (baseline.metrics.http_req_failed.values.rate || 0) * 100,
    'API Error Rate (%)',
    true,
  )
  if (errorComparison?.isRegression) regressions.push(errorComparison)

  // Check throughput
  const throughputComparison = compareMetric(
    current.metrics.http_reqs.values.rate || 0,
    baseline.metrics.http_reqs.values.rate || 0,
    'API Throughput (req/s)',
    false, // Higher is better
  )
  if (throughputComparison?.isRegression) regressions.push(throughputComparison)

  return regressions
}

/**
 * Detect WebRTC regressions
 */
function detectWebRTCRegressions(current, baseline) {
  if (!current || !baseline) return []

  const regressions = []

  // Check connection time P95
  const connComparison = compareMetric(
    current.metrics.webrtc_connection_time.values['p(95)'],
    baseline.metrics.webrtc_connection_time.values['p(95)'],
    'WebRTC Connection Time P95 (ms)',
    true,
  )
  if (connComparison?.isRegression) regressions.push(connComparison)

  // Check signaling latency
  if (current.metrics.signaling_latency && baseline.metrics.signaling_latency) {
    const sigComparison = compareMetric(
      current.metrics.signaling_latency.values['p(95)'],
      baseline.metrics.signaling_latency.values['p(95)'],
      'Signaling Latency P95 (ms)',
      true,
    )
    if (sigComparison?.isRegression) regressions.push(sigComparison)
  }

  // Check media quality
  if (current.metrics.media_quality_score && baseline.metrics.media_quality_score) {
    const qualityComparison = compareMetric(
      current.metrics.media_quality_score.values.avg * 100,
      baseline.metrics.media_quality_score.values.avg * 100,
      'Media Quality Score (%)',
      false, // Higher is better
    )
    if (qualityComparison?.isRegression) regressions.push(qualityComparison)
  }

  return regressions
}

/**
 * Detect ML regressions
 */
function detectMLRegressions(current, baseline) {
  if (!current || !baseline) return []

  const regressions = []

  // Check inference P95
  const infComparison = compareMetric(
    current.metrics.ml_inference_duration.values['p(95)'],
    baseline.metrics.ml_inference_duration.values['p(95)'],
    'ML Inference P95 (ms)',
    true,
  )
  if (infComparison?.isRegression) regressions.push(infComparison)

  // Check batch inference
  if (current.metrics.ml_batch_inference_duration && baseline.metrics.ml_batch_inference_duration) {
    const batchComparison = compareMetric(
      current.metrics.ml_batch_inference_duration.values['p(95)'],
      baseline.metrics.ml_batch_inference_duration.values['p(95)'],
      'Batch Inference P95 (ms)',
      true,
    )
    if (batchComparison?.isRegression) regressions.push(batchComparison)
  }

  // Check accuracy
  if (current.metrics.model_accuracy_score && baseline.metrics.model_accuracy_score) {
    const accComparison = compareMetric(
      current.metrics.model_accuracy_score.values.avg * 100,
      baseline.metrics.model_accuracy_score.values.avg * 100,
      'Model Accuracy (%)',
      false, // Higher is better
    )
    if (accComparison?.isRegression) regressions.push(accComparison)
  }

  // Check throughput
  if (current.metrics.inference_throughput_rps && baseline.metrics.inference_throughput_rps) {
    const throughputComparison = compareMetric(
      current.metrics.inference_throughput_rps.values.avg,
      baseline.metrics.inference_throughput_rps.values.avg,
      'Inference Throughput (req/s)',
      false, // Higher is better
    )
    if (throughputComparison?.isRegression) regressions.push(throughputComparison)
  }

  return regressions
}

/**
 * Detect Frontend regressions
 */
function detectFrontendRegressions(current, baseline) {
  if (!current || !baseline) return []

  const regressions = []

  // Check page load P95
  const loadComparison = compareMetric(
    current.metrics.page_load_time.values['p(95)'],
    baseline.metrics.page_load_time.values['p(95)'],
    'Page Load Time P95 (ms)',
    true,
  )
  if (loadComparison?.isRegression) regressions.push(loadComparison)

  // Check TTI P95
  const ttiComparison = compareMetric(
    current.metrics.time_to_interactive.values['p(95)'],
    baseline.metrics.time_to_interactive.values['p(95)'],
    'Time to Interactive P95 (ms)',
    true,
  )
  if (ttiComparison?.isRegression) regressions.push(ttiComparison)

  // Check FCP P95
  const fcpComparison = compareMetric(
    current.metrics.first_contentful_paint.values['p(95)'],
    baseline.metrics.first_contentful_paint.values['p(95)'],
    'First Contentful Paint P95 (ms)',
    true,
  )
  if (fcpComparison?.isRegression) regressions.push(fcpComparison)

  // Check LCP P95
  const lcpComparison = compareMetric(
    current.metrics.largest_contentful_paint.values['p(95)'],
    baseline.metrics.largest_contentful_paint.values['p(95)'],
    'Largest Contentful Paint P95 (ms)',
    true,
  )
  if (lcpComparison?.isRegression) regressions.push(lcpComparison)

  // Check CLS
  const clsComparison = compareMetric(
    current.metrics.cumulative_layout_shift.values.avg,
    baseline.metrics.cumulative_layout_shift.values.avg,
    'Cumulative Layout Shift',
    true,
  )
  if (clsComparison?.isRegression) regressions.push(clsComparison)

  // Check bundle size
  const bundleComparison = compareMetric(
    current.metrics.bundle_size_kb.values.avg,
    baseline.metrics.bundle_size_kb.values.avg,
    'Bundle Size (KB)',
    true,
  )
  if (bundleComparison?.isRegression) regressions.push(bundleComparison)

  return regressions
}

/**
 * Print regression report
 */
function printRegressionReport(allRegressions) {
  if (Object.keys(allRegressions).length === 0) {
    console.log('\n✅ No performance regressions detected!')
    return
  }

  console.log('\n⚠️  Performance Regressions Detected!\n')

  Object.entries(allRegressions).forEach(([testType, regressions]) => {
    if (regressions.length === 0) return

    console.log(`=== ${testType} Regressions ===\n`)

    regressions.forEach(reg => {
      const emoji = reg.severity === 'high' ? '🔴' : reg.severity === 'medium' ? '🟡' : '🟢'
      console.log(`${emoji} ${reg.metric}`)
      console.log(`   Baseline: ${reg.baseline}`)
      console.log(`   Current:  ${reg.current}`)
      console.log(`   Change:   ${reg.diff} (${reg.percentChange}%)`)
      console.log(`   Severity: ${reg.severity.toUpperCase()}`)
      console.log()
    })
  })

  // Count by severity
  const allRegressionsFlat = Object.values(allRegressions).flat()
  const highSeverity = allRegressionsFlat.filter(r => r.severity === 'high').length
  const mediumSeverity = allRegressionsFlat.filter(r => r.severity === 'medium').length
  const lowSeverity = allRegressionsFlat.filter(r => r.severity === 'low').length

  console.log('\n=== Regression Summary ===')
  console.log(`🔴 High Severity: ${highSeverity}`)
  console.log(`🟡 Medium Severity: ${mediumSeverity}`)
  console.log(`🟢 Low Severity: ${lowSeverity}`)
  console.log(`Total: ${allRegressionsFlat.length}`)
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: detect-performance-regressions.js <reports-dir>')
    process.exit(1)
  }

  const reportsDir = args[0]

  try {
    console.log('Loading baseline...')
    const baseline = loadBaseline()

    if (!baseline) {
      console.log('No baseline available. Skipping regression detection.')
      process.exit(0)
    }

    console.log('Loading current results...')
    const current = loadCurrentResults(reportsDir)

    console.log('Detecting regressions...')

    const allRegressions = {}

    // API regressions
    if (current.api && baseline.api) {
      const apiRegressions = detectApiRegressions(current.api, baseline.api)
      if (apiRegressions.length > 0) allRegressions.API = apiRegressions
    }

    // WebRTC regressions
    if (current.webrtc && baseline.webrtc) {
      const webrtcRegressions = detectWebRTCRegressions(current.webrtc, baseline.webrtc)
      if (webrtcRegressions.length > 0) allRegressions.WebRTC = webrtcRegressions
    }

    // ML regressions
    if (current.ml && baseline.ml) {
      const mlRegressions = detectMLRegressions(current.ml, baseline.ml)
      if (mlRegressions.length > 0) allRegressions['ML Inference'] = mlRegressions
    }

    // Frontend regressions
    if (current.frontend && baseline.frontend) {
      const frontendRegressions = detectFrontendRegressions(current.frontend, baseline.frontend)
      if (frontendRegressions.length > 0) allRegressions.Frontend = frontendRegressions
    }

    printRegressionReport(allRegressions)

    // Exit with error if high severity regressions found
    const hasHighSeverity = Object.values(allRegressions)
      .flat()
      .some(r => r.severity === 'high')

    if (hasHighSeverity) {
      console.error('\n❌ High severity regressions found!')
      process.exit(1)
    }

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
  detectApiRegressions,
  detectWebRTCRegressions,
  detectMLRegressions,
  detectFrontendRegressions,
}
