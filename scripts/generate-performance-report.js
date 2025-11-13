#!/usr/bin/env node

/**
 * Generate Performance Report
 * Consolidates all performance test results into a comprehensive report
 */

const fs = require('fs')
const path = require('path')

const REPORTS_DIR = path.join(__dirname, '../performance-tests/reports')

/**
 * Load all test results
 */
function loadTestResults() {
  const results = {
    api: null,
    webrtc: null,
    ml: null,
    frontend: null,
  }

  // Try to load each test result
  const files = fs.readdirSync(REPORTS_DIR, { recursive: true })

  files.forEach(file => {
    const filePath = path.join(REPORTS_DIR, file)
    if (!fs.statSync(filePath).isFile()) return
    if (!file.endsWith('-summary.json')) return

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      if (file.includes('api-performance')) {
        results.api = data
      } else if (file.includes('webrtc')) {
        results.webrtc = data
      } else if (file.includes('ml-inference')) {
        results.ml = data
      } else if (file.includes('page-load')) {
        results.frontend = data
      }
    } catch (error) {
      console.error(`Error loading ${file}: ${error.message}`)
    }
  })

  return results
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results) {
  const lines = []

  lines.push('# Performance Test Report')
  lines.push('')
  lines.push(`**Generated:** ${new Date().toISOString()}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Executive Summary
  lines.push('## Executive Summary')
  lines.push('')

  const allPassed = checkAllTestsPassed(results)
  const emoji = allPassed ? '✅' : '❌'

  lines.push(`**Overall Status:** ${emoji} ${allPassed ? 'PASS' : 'FAIL'}`)
  lines.push('')

  // API Performance
  if (results.api) {
    lines.push('## API Performance (NFR-001: p95 ≤ 200ms)')
    lines.push('')
    lines.push(generateApiSection(results.api))
    lines.push('')
  }

  // WebRTC Performance
  if (results.webrtc) {
    lines.push('## WebRTC Multi-Party Performance')
    lines.push('')
    lines.push(generateWebRTCSection(results.webrtc))
    lines.push('')
  }

  // ML Inference Performance
  if (results.ml) {
    lines.push('## ML Inference Performance')
    lines.push('')
    lines.push(generateMLSection(results.ml))
    lines.push('')
  }

  // Frontend Performance
  if (results.frontend) {
    lines.push('## Frontend Performance (Page Load Budgets)')
    lines.push('')
    lines.push(generateFrontendSection(results.frontend))
    lines.push('')
  }

  // Bottlenecks & Recommendations
  lines.push('## Bottlenecks & Recommendations')
  lines.push('')
  lines.push(generateBottlenecksSection(results))
  lines.push('')

  // Test Configuration
  lines.push('## Test Configuration')
  lines.push('')
  lines.push('| Test Type | Duration | Virtual Users | Requests |')
  lines.push('|-----------|----------|---------------|----------|')

  if (results.api) {
    const apiMetrics = results.api.metrics
    lines.push(
      `| API Load | ${formatDuration(apiMetrics.http_req_duration?.values.avg || 0)} avg | ${results.api.root_group?.checks?.length || 'N/A'} | ${apiMetrics.http_reqs?.values.count || 'N/A'} |`,
    )
  }

  if (results.webrtc) {
    const webrtcMetrics = results.webrtc.metrics
    lines.push(
      `| WebRTC Load | N/A | N/A | ${webrtcMetrics.messages_sent?.values.count || 'N/A'} messages |`,
    )
  }

  if (results.ml) {
    const mlMetrics = results.ml.metrics
    lines.push(
      `| ML Inference | ${formatDuration(mlMetrics.ml_inference_duration?.values.avg || 0)} avg | N/A | N/A |`,
    )
  }

  if (results.frontend) {
    const frontendMetrics = results.frontend.metrics
    lines.push(
      `| Frontend Load | ${formatDuration(frontendMetrics.page_load_time?.values.avg || 0)} avg | N/A | N/A |`,
    )
  }

  lines.push('')

  return lines.join('\n')
}

/**
 * Generate API section
 */
function generateApiSection(data) {
  const metrics = data.metrics
  const duration = metrics.http_req_duration
  const failed = metrics.http_req_failed
  const reqs = metrics.http_reqs

  const lines = []

  lines.push('| Metric | Value | Threshold | Status |')
  lines.push('|--------|-------|-----------|--------|')

  const p95 = duration.values['p(95)']
  lines.push(
    `| P95 Latency | ${p95.toFixed(2)}ms | ≤200ms | ${p95 <= 200 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const p99 = duration.values['p(99)']
  lines.push(
    `| P99 Latency | ${p99.toFixed(2)}ms | ≤500ms | ${p99 <= 500 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const avg = duration.values.avg
  lines.push(
    `| Average Latency | ${avg.toFixed(2)}ms | ≤150ms | ${avg <= 150 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const errorRate = failed.values.rate || 0
  lines.push(
    `| Error Rate | ${(errorRate * 100).toFixed(2)}% | <1% | ${errorRate < 0.01 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const rps = reqs.values.rate || 0
  lines.push(
    `| Requests/sec | ${rps.toFixed(2)} | >10 | ${rps > 10 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  return lines.join('\n')
}

/**
 * Generate WebRTC section
 */
function generateWebRTCSection(data) {
  const metrics = data.metrics
  const connectionTime = metrics.webrtc_connection_time
  const signalingLatency = metrics.signaling_latency
  const mediaQuality = metrics.media_quality_score
  const successRate = metrics.connection_success_rate

  const lines = []

  lines.push('| Metric | Value | Threshold | Status |')
  lines.push('|--------|-------|-----------|--------|')

  const connP95 = connectionTime.values['p(95)']
  lines.push(
    `| Connection Time P95 | ${connP95.toFixed(2)}ms | ≤1000ms | ${connP95 <= 1000 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const connP99 = connectionTime.values['p(99)']
  lines.push(
    `| Connection Time P99 | ${connP99.toFixed(2)}ms | ≤2000ms | ${connP99 <= 2000 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  if (signalingLatency) {
    const sigP95 = signalingLatency.values['p(95)']
    lines.push(
      `| Signaling Latency P95 | ${sigP95.toFixed(2)}ms | ≤100ms | ${sigP95 <= 100 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  if (mediaQuality) {
    const quality = mediaQuality.values.avg
    lines.push(
      `| Media Quality | ${(quality * 100).toFixed(2)}% | >80% | ${quality > 0.8 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  if (successRate) {
    const rate = successRate.values.rate || 0
    lines.push(
      `| Success Rate | ${(rate * 100).toFixed(2)}% | >98% | ${rate > 0.98 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  return lines.join('\n')
}

/**
 * Generate ML section
 */
function generateMLSection(data) {
  const metrics = data.metrics
  const inference = metrics.ml_inference_duration
  const batch = metrics.ml_batch_inference_duration
  const successRate = metrics.inference_success_rate
  const accuracy = metrics.model_accuracy_score
  const throughput = metrics.inference_throughput_rps

  const lines = []

  lines.push('| Metric | Value | Threshold | Status |')
  lines.push('|--------|-------|-----------|--------|')

  const infP95 = inference.values['p(95)']
  lines.push(
    `| Inference P95 | ${infP95.toFixed(2)}ms | ≤100ms | ${infP95 <= 100 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const infAvg = inference.values.avg
  lines.push(
    `| Inference Average | ${infAvg.toFixed(2)}ms | ≤80ms | ${infAvg <= 80 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  if (batch) {
    const batchP95 = batch.values['p(95)']
    lines.push(
      `| Batch Inference P95 | ${batchP95.toFixed(2)}ms | ≤500ms | ${batchP95 <= 500 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  if (successRate) {
    const rate = successRate.values.rate || 0
    lines.push(
      `| Success Rate | ${(rate * 100).toFixed(2)}% | >99% | ${rate > 0.99 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  if (accuracy) {
    const acc = accuracy.values.avg
    lines.push(
      `| Model Accuracy | ${(acc * 100).toFixed(2)}% | >90% | ${acc > 0.9 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  if (throughput) {
    const tput = throughput.values.avg
    lines.push(
      `| Throughput | ${tput.toFixed(2)} req/sec | >20 | ${tput > 20 ? '✅ PASS' : '❌ FAIL'} |`,
    )
  }

  return lines.join('\n')
}

/**
 * Generate Frontend section
 */
function generateFrontendSection(data) {
  const metrics = data.metrics
  const pageLoad = metrics.page_load_time
  const tti = metrics.time_to_interactive
  const fcp = metrics.first_contentful_paint
  const lcp = metrics.largest_contentful_paint
  const cls = metrics.cumulative_layout_shift
  const fid = metrics.first_input_delay
  const tbt = metrics.total_blocking_time
  const bundleSize = metrics.bundle_size_kb

  const lines = []

  lines.push('| Metric | Value | Budget | Status |')
  lines.push('|--------|-------|--------|--------|')

  const loadP95 = pageLoad.values['p(95)']
  lines.push(
    `| Page Load P95 | ${loadP95.toFixed(0)}ms | ≤3000ms | ${loadP95 <= 3000 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const ttiP95 = tti.values['p(95)']
  lines.push(
    `| TTI P95 | ${ttiP95.toFixed(0)}ms | ≤3500ms | ${ttiP95 <= 3500 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const fcpP95 = fcp.values['p(95)']
  lines.push(
    `| FCP P95 | ${fcpP95.toFixed(0)}ms | ≤1500ms | ${fcpP95 <= 1500 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const lcpP95 = lcp.values['p(95)']
  lines.push(
    `| LCP P95 | ${lcpP95.toFixed(0)}ms | ≤2500ms | ${lcpP95 <= 2500 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const clsAvg = cls.values.avg
  lines.push(
    `| CLS Average | ${clsAvg.toFixed(3)} | <0.1 | ${clsAvg < 0.1 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const fidP95 = fid.values['p(95)']
  lines.push(
    `| FID P95 | ${fidP95.toFixed(0)}ms | ≤100ms | ${fidP95 <= 100 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const tbtP95 = tbt.values['p(95)']
  lines.push(
    `| TBT P95 | ${tbtP95.toFixed(0)}ms | ≤300ms | ${tbtP95 <= 300 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  const bundleAvg = bundleSize.values.avg
  lines.push(
    `| Bundle Size | ${bundleAvg.toFixed(0)}KB | <500KB | ${bundleAvg < 500 ? '✅ PASS' : '❌ FAIL'} |`,
  )

  return lines.join('\n')
}

/**
 * Generate bottlenecks section
 */
function generateBottlenecksSection(results) {
  const bottlenecks = []
  const recommendations = []

  // Check API
  if (results.api) {
    const p95 = results.api.metrics.http_req_duration.values['p(95)']
    if (p95 > 200) {
      bottlenecks.push(`**API P95 Latency:** ${p95.toFixed(2)}ms exceeds 200ms target`)
      recommendations.push(
        '- Implement database query optimization and indexing',
        '- Add Redis caching for frequently accessed data',
        '- Consider API response compression',
        '- Profile slow endpoints and optimize business logic',
      )
    }
  }

  // Check WebRTC
  if (results.webrtc) {
    const connTime = results.webrtc.metrics.webrtc_connection_time.values['p(95)']
    if (connTime > 1000) {
      bottlenecks.push(
        `**WebRTC Connection Time:** ${connTime.toFixed(2)}ms exceeds 1000ms target`,
      )
      recommendations.push(
        '- Optimize signaling server response time',
        '- Implement TURN server for better connectivity',
        '- Add connection pooling',
        '- Optimize ICE candidate gathering',
      )
    }
  }

  // Check ML
  if (results.ml) {
    const infP95 = results.ml.metrics.ml_inference_duration.values['p(95)']
    if (infP95 > 100) {
      bottlenecks.push(`**ML Inference Latency:** ${infP95.toFixed(2)}ms exceeds 100ms target`)
      recommendations.push(
        '- Use GPU acceleration for inference',
        '- Implement model quantization to reduce size',
        '- Add inference result caching',
        '- Consider batch processing for non-real-time requests',
        '- Use TensorRT or ONNX Runtime for optimization',
      )
    }
  }

  // Check Frontend
  if (results.frontend) {
    const loadP95 = results.frontend.metrics.page_load_time.values['p(95)']
    const bundleSize = results.frontend.metrics.bundle_size_kb.values.avg

    if (loadP95 > 3000) {
      bottlenecks.push(`**Page Load Time:** ${loadP95.toFixed(0)}ms exceeds 3000ms budget`)
      recommendations.push(
        '- Implement code splitting and lazy loading',
        '- Optimize images (WebP format, responsive images)',
        '- Enable CDN for static assets',
        '- Implement service worker for caching',
      )
    }

    if (bundleSize > 500) {
      bottlenecks.push(`**Bundle Size:** ${bundleSize.toFixed(0)}KB exceeds 500KB budget`)
      recommendations.push(
        '- Remove unused dependencies',
        '- Implement tree shaking',
        '- Use dynamic imports for routes',
        '- Minimize and compress JavaScript/CSS',
      )
    }
  }

  const lines = []

  if (bottlenecks.length > 0) {
    lines.push('### 🚨 Identified Bottlenecks')
    lines.push('')
    bottlenecks.forEach(b => lines.push(`- ${b}`))
    lines.push('')
  }

  if (recommendations.length > 0) {
    lines.push('### 💡 Optimization Recommendations')
    lines.push('')
    recommendations.forEach(r => lines.push(r))
    lines.push('')
  }

  if (bottlenecks.length === 0 && recommendations.length === 0) {
    lines.push('✅ No significant bottlenecks detected. All performance targets met!')
  }

  return lines.join('\n')
}

/**
 * Check if all tests passed
 */
function checkAllTestsPassed(results) {
  let allPassed = true

  if (results.api) {
    const p95 = results.api.metrics.http_req_duration.values['p(95)']
    if (p95 > 200) allPassed = false
  }

  if (results.webrtc) {
    const connTime = results.webrtc.metrics.webrtc_connection_time.values['p(95)']
    if (connTime > 1000) allPassed = false
  }

  if (results.ml) {
    const infP95 = results.ml.metrics.ml_inference_duration.values['p(95)']
    if (infP95 > 100) allPassed = false
  }

  if (results.frontend) {
    const loadP95 = results.frontend.metrics.page_load_time.values['p(95)']
    if (loadP95 > 3000) allPassed = false
  }

  return allPassed
}

/**
 * Format duration
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Generate JSON report
 */
function generateJSONReport(results) {
  return JSON.stringify(results, null, 2)
}

/**
 * Main function
 */
function main() {
  console.log('Generating performance report...')

  try {
    const results = loadTestResults()

    // Generate markdown report
    const markdown = generateMarkdownReport(results)
    const markdownPath = path.join(REPORTS_DIR, 'performance-report.md')
    fs.writeFileSync(markdownPath, markdown)
    console.log(`✅ Markdown report generated: ${markdownPath}`)

    // Generate JSON report
    const json = generateJSONReport(results)
    const jsonPath = path.join(REPORTS_DIR, 'performance-report.json')
    fs.writeFileSync(jsonPath, json)
    console.log(`✅ JSON report generated: ${jsonPath}`)

    // Print summary to console
    console.log('\n' + markdown)
  } catch (error) {
    console.error(`Error generating report: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  generateMarkdownReport,
  generateJSONReport,
  loadTestResults,
}
