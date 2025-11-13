#!/usr/bin/env node

/**
 * Check All Performance Thresholds
 * Validates all test results against thresholds
 */

const fs = require('fs')
const path = require('path')
const {
  checkApiThresholds,
  checkWebRTCThresholds,
  checkMLThresholds,
  checkFrontendThresholds,
} = require('./check-performance-thresholds')

/**
 * Load all test results
 */
function loadAllResults(reportsDir) {
  const results = {}
  const files = fs.readdirSync(reportsDir, { recursive: true })

  files.forEach(file => {
    const filePath = path.join(reportsDir, file)
    if (!fs.statSync(filePath).isFile()) return
    if (!file.endsWith('-summary.json')) return

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      if (file.includes('api-performance')) {
        results.api = { data, type: 'API' }
      } else if (file.includes('webrtc')) {
        results.webrtc = { data, type: 'WebRTC' }
      } else if (file.includes('ml-inference')) {
        results.ml = { data, type: 'ML Inference' }
      } else if (file.includes('page-load')) {
        results.frontend = { data, type: 'Frontend' }
      }
    } catch (error) {
      console.error(`Error loading ${file}: ${error.message}`)
    }
  })

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
    const status = check.passed ? '✅ PASS' : '❌ FAIL'
    console.log(
      `${check.metric.padEnd(maxMetricLen)} | ${check.value.padEnd(maxValueLen)} | ${check.threshold.padEnd(maxThresholdLen)} | ${status}`,
    )
  })

  console.log(`\nResult: ${results.passed ? '✅ PASS' : '❌ FAIL'}`)
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: check-all-thresholds.js <reports-dir>')
    process.exit(1)
  }

  const reportsDir = args[0]

  try {
    console.log('Loading all test results...')
    const results = loadAllResults(reportsDir)

    if (Object.keys(results).length === 0) {
      console.error('No test results found!')
      process.exit(1)
    }

    const allChecks = {}
    let overallPassed = true

    // Check API thresholds
    if (results.api) {
      const apiChecks = checkApiThresholds(results.api.data)
      allChecks.API = apiChecks
      printResults('API', apiChecks)
      if (!apiChecks.passed) overallPassed = false
    }

    // Check WebRTC thresholds
    if (results.webrtc) {
      const webrtcChecks = checkWebRTCThresholds(results.webrtc.data)
      allChecks.WebRTC = webrtcChecks
      printResults('WebRTC', webrtcChecks)
      if (!webrtcChecks.passed) overallPassed = false
    }

    // Check ML thresholds
    if (results.ml) {
      const mlChecks = checkMLThresholds(results.ml.data)
      allChecks['ML Inference'] = mlChecks
      printResults('ML Inference', mlChecks)
      if (!mlChecks.passed) overallPassed = false
    }

    // Check Frontend thresholds
    if (results.frontend) {
      const frontendChecks = checkFrontendThresholds(results.frontend.data)
      allChecks.Frontend = frontendChecks
      printResults('Frontend', frontendChecks)
      if (!frontendChecks.passed) overallPassed = false
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('OVERALL PERFORMANCE TEST RESULTS')
    console.log('='.repeat(60))

    const totalChecks = Object.values(allChecks).reduce(
      (sum, c) => sum + c.checks.length,
      0,
    )
    const passedChecks = Object.values(allChecks).reduce(
      (sum, c) => sum + c.checks.filter(check => check.passed).length,
      0,
    )
    const failedChecks = totalChecks - passedChecks

    console.log(`\nTotal Checks: ${totalChecks}`)
    console.log(`✅ Passed: ${passedChecks}`)
    console.log(`❌ Failed: ${failedChecks}`)
    console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(2)}%`)

    if (overallPassed) {
      console.log('\n✅ ALL PERFORMANCE TESTS PASSED!')
      process.exit(0)
    } else {
      console.error('\n❌ SOME PERFORMANCE TESTS FAILED!')
      process.exit(1)
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    console.error(error.stack)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { loadAllResults }
