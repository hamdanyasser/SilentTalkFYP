/**
 * ML Inference Latency Test
 * Tests ASL recognition model inference performance
 *
 * Test scenarios:
 * - Single frame ASL recognition
 * - Batch inference (multiple frames)
 * - Real-time video stream inference
 * - Model warmup time
 * - Cold start performance
 * - GPU vs CPU inference comparison
 * - Concurrent inference requests
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Counter, Trend } from 'k6/metrics'
import { SharedArray } from 'k6/data'
import encoding from 'k6/encoding'
import { getStages, getThresholds, getHttpOptions, addCorrelationHeaders } from './k6.config.js'

// Custom metrics
const mlInferenceDuration = new Trend('ml_inference_duration')
const mlBatchInferenceDuration = new Trend('ml_batch_inference_duration')
const modelLoadTime = new Trend('model_load_time')
const coldStartLatency = new Trend('cold_start_latency')
const inferenceSuccessRate = new Rate('inference_success_rate')
const inferenceErrors = new Counter('inference_errors')
const modelAccuracy = new Trend('model_accuracy_score')
const throughputRPS = new Trend('inference_throughput_rps')

// Test configuration
export const options = {
  stages: getStages(__ENV.TEST_MODE || 'load'),
  thresholds: getThresholds({
    ml_inference_duration: ['p(95)<100', 'p(99)<200', 'avg<80'], // NFR requirement
    ml_batch_inference_duration: ['p(95)<500', 'p(99)<1000'],
    cold_start_latency: ['p(95)<2000'],
    inference_success_rate: ['rate>0.99'],
    model_accuracy_score: ['avg>0.90'], // 90% accuracy minimum
    inference_throughput_rps: ['avg>20'], // Minimum 20 inferences/second
  }),
}

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000'

/**
 * Mock ASL image data (base64 encoded synthetic frames)
 * In real scenario, these would be actual ASL gesture images
 */
const testFrames = new SharedArray('test_frames', function () {
  const frames = []
  const signs = ['hello', 'thank-you', 'yes', 'no', 'please', 'help', 'friend', 'family']

  for (let i = 0; i < 50; i++) {
    frames.push({
      sign: signs[i % signs.length],
      // Mock base64 image (in real scenario, this would be actual image data)
      imageData: encoding.b64encode(`mock-image-data-${i}-${Math.random()}`),
      timestamp: Date.now() + i * 33, // 30 fps = 33ms per frame
      frameNumber: i,
    })
  }

  return frames
})

/**
 * Generate synthetic video frame data
 */
function generateVideoFrame(frameNumber = 0) {
  // Mock base64 encoded frame (640x480 JPEG would be ~30-50KB)
  const mockImageData = encoding.b64encode(
    `mock-video-frame-${frameNumber}-${Date.now()}-${'x'.repeat(1000)}`,
  )

  return {
    imageData: mockImageData,
    width: 640,
    height: 480,
    format: 'jpeg',
    timestamp: Date.now(),
    frameNumber,
  }
}

/**
 * Main test scenario
 */
export default function () {
  const sessionId = `ml-test-${__VU}-${__ITER}`

  group('ML Model Initialization', () => {
    // Test model loading/warmup
    const loadStart = Date.now()

    let options = getHttpOptions()
    options = addCorrelationHeaders(options, sessionId)

    const warmupRes = http.post(
      `${API_BASE_URL}/api/ml/model/warmup`,
      JSON.stringify({ modelType: 'asl-recognition' }),
      options,
    )

    const loadTime = Date.now() - loadStart
    modelLoadTime.add(loadTime)

    const warmupSuccess = check(warmupRes, {
      'model warmup status is 200': r => r.status === 200,
      'model warmup time < 5s': r => r.timings.duration < 5000,
      'model ready': r => {
        try {
          return JSON.parse(r.body).status === 'ready'
        } catch {
          return false
        }
      },
    })

    if (!warmupSuccess) {
      console.error('Model warmup failed')
      inferenceErrors.add(1)
    }
  })

  sleep(1)

  group('Single Frame Inference', () => {
    // Test single frame ASL recognition
    const frame = testFrames[Math.floor(Math.random() * testFrames.length)]

    const payload = JSON.stringify({
      imageData: frame.imageData,
      timestamp: frame.timestamp,
      sessionId,
    })

    let options = getHttpOptions()
    options = addCorrelationHeaders(options, sessionId)

    const inferenceStart = Date.now()
    const inferenceRes = http.post(`${API_BASE_URL}/api/ml/recognize`, payload, options)
    const inferenceDuration = Date.now() - inferenceStart

    mlInferenceDuration.add(inferenceDuration)

    const inferenceSuccess = check(inferenceRes, {
      'inference status is 200': r => r.status === 200,
      'inference time < 200ms': r => r.timings.duration < 200,
      'inference has prediction': r => {
        try {
          const data = JSON.parse(r.body)
          return data.prediction !== undefined && data.confidence !== undefined
        } catch {
          return false
        }
      },
      'inference confidence > 0.7': r => {
        try {
          return JSON.parse(r.body).confidence > 0.7
        } catch {
          return false
        }
      },
    })

    inferenceSuccessRate.add(inferenceSuccess)

    if (!inferenceSuccess) {
      inferenceErrors.add(1)
    } else {
      // Record accuracy based on expected sign
      try {
        const result = JSON.parse(inferenceRes.body)
        const isCorrect = result.prediction === frame.sign
        modelAccuracy.add(isCorrect ? 1 : 0)
      } catch (e) {
        console.error(`Failed to parse inference result: ${e}`)
      }
    }
  })

  sleep(0.5)

  group('Batch Inference', () => {
    // Test batch processing (multiple frames at once)
    const batchSize = 10
    const batch = []

    for (let i = 0; i < batchSize; i++) {
      batch.push(generateVideoFrame(i))
    }

    const payload = JSON.stringify({
      frames: batch,
      sessionId,
      batchSize,
    })

    let options = getHttpOptions()
    options = addCorrelationHeaders(options, sessionId)
    options.timeout = '10s' // Longer timeout for batch processing

    const batchStart = Date.now()
    const batchRes = http.post(`${API_BASE_URL}/api/ml/recognize/batch`, payload, options)
    const batchDuration = Date.now() - batchStart

    mlBatchInferenceDuration.add(batchDuration)

    const batchSuccess = check(batchRes, {
      'batch inference status is 200': r => r.status === 200,
      'batch inference time < 1s': r => r.timings.duration < 1000,
      'batch has all predictions': r => {
        try {
          const data = JSON.parse(r.body)
          return data.predictions && data.predictions.length === batchSize
        } catch {
          return false
        }
      },
    })

    inferenceSuccessRate.add(batchSuccess)

    if (!batchSuccess) {
      inferenceErrors.add(1)
    }

    // Calculate throughput (frames per second)
    const throughput = (batchSize / batchDuration) * 1000
    throughputRPS.add(throughput)
  })

  sleep(0.5)

  group('Real-time Stream Inference', () => {
    // Simulate real-time video stream processing (30 fps)
    const streamDuration = 3 // seconds
    const fps = 30
    const totalFrames = streamDuration * fps

    const streamStart = Date.now()
    let successfulInferences = 0

    for (let frameNum = 0; frameNum < totalFrames; frameNum++) {
      const frame = generateVideoFrame(frameNum)
      const payload = JSON.stringify({
        imageData: frame.imageData,
        timestamp: frame.timestamp,
        frameNumber: frame.frameNumber,
        sessionId,
        streamMode: true,
      })

      let options = getHttpOptions()
      options = addCorrelationHeaders(options, sessionId)

      const frameInferenceStart = Date.now()
      const inferenceRes = http.post(`${API_BASE_URL}/api/ml/recognize`, payload, options)
      const frameDuration = Date.now() - frameInferenceStart

      mlInferenceDuration.add(frameDuration)

      const success = check(inferenceRes, {
        'stream inference status is 200': r => r.status === 200,
        'stream inference time < 100ms': r => r.timings.duration < 100, // Critical for real-time
      })

      if (success) {
        successfulInferences++
      } else {
        inferenceErrors.add(1)
      }

      // Maintain frame rate timing
      const frameTime = 1000 / fps // 33.33ms per frame
      const elapsed = Date.now() - streamStart - frameNum * frameTime
      if (elapsed < frameTime) {
        sleep((frameTime - elapsed) / 1000)
      }
    }

    const streamSuccess = successfulInferences / totalFrames >= 0.95 // 95% success rate
    inferenceSuccessRate.add(streamSuccess)

    const actualFPS = totalFrames / ((Date.now() - streamStart) / 1000)
    console.log(
      `Stream processing: ${actualFPS.toFixed(2)} fps (${successfulInferences}/${totalFrames} successful)`,
    )
  })

  sleep(1)

  group('Cold Start Test', () => {
    // Test cold start performance (new session)
    const newSessionId = `cold-start-${__VU}-${Date.now()}`
    const frame = generateVideoFrame(0)

    const payload = JSON.stringify({
      imageData: frame.imageData,
      timestamp: frame.timestamp,
      sessionId: newSessionId,
      coldStart: true,
    })

    let options = getHttpOptions()
    options = addCorrelationHeaders(options, newSessionId)

    const coldStartBegin = Date.now()
    const coldStartRes = http.post(`${API_BASE_URL}/api/ml/recognize`, payload, options)
    const coldStartDuration = Date.now() - coldStartBegin

    coldStartLatency.add(coldStartDuration)

    check(coldStartRes, {
      'cold start inference status is 200': r => r.status === 200,
      'cold start time < 3s': r => r.timings.duration < 3000,
    })
  })

  sleep(1)

  group('Concurrent Inference Load', () => {
    // Test concurrent inference requests
    const concurrentRequests = 5
    const requests = []

    for (let i = 0; i < concurrentRequests; i++) {
      const frame = generateVideoFrame(i)
      const payload = JSON.stringify({
        imageData: frame.imageData,
        timestamp: frame.timestamp,
        sessionId,
        requestId: i,
      })

      let options = getHttpOptions()
      options = addCorrelationHeaders(options, sessionId)

      requests.push({
        method: 'POST',
        url: `${API_BASE_URL}/api/ml/recognize`,
        body: payload,
        params: options,
      })
    }

    const concurrentStart = Date.now()
    const responses = http.batch(requests)
    const concurrentDuration = Date.now() - concurrentStart

    let successCount = 0
    responses.forEach((res, index) => {
      const success = check(res, {
        [`concurrent request ${index} status is 200`]: r => r.status === 200,
        [`concurrent request ${index} time < 300ms`]: r => r.timings.duration < 300,
      })

      if (success) {
        successCount++
        mlInferenceDuration.add(res.timings.duration)
      }
    })

    inferenceSuccessRate.add(successCount / concurrentRequests >= 0.9)

    // Calculate concurrent throughput
    const concurrentThroughput = (concurrentRequests / concurrentDuration) * 1000
    throughputRPS.add(concurrentThroughput)

    console.log(
      `Concurrent load: ${successCount}/${concurrentRequests} successful in ${concurrentDuration}ms`,
    )
  })

  sleep(1)

  group('Model Performance Metrics', () => {
    // Get model performance metrics
    let options = getHttpOptions()
    options = addCorrelationHeaders(options, sessionId)

    const metricsRes = http.get(`${API_BASE_URL}/api/ml/metrics`, options)

    check(metricsRes, {
      'metrics status is 200': r => r.status === 200,
      'metrics response time < 100ms': r => r.timings.duration < 100,
      'metrics has performance data': r => {
        try {
          const data = JSON.parse(r.body)
          return (
            data.averageInferenceTime !== undefined &&
            data.throughput !== undefined &&
            data.modelAccuracy !== undefined
          )
        } catch {
          return false
        }
      },
    })
  })

  // Think time between iterations
  sleep(Math.random() * 2 + 1)
}

/**
 * Setup function
 */
export function setup() {
  console.log(`Starting ML inference test against ${API_BASE_URL}`)
  console.log(`Test mode: ${__ENV.TEST_MODE || 'load'}`)
  console.log(`Test frames loaded: ${testFrames.length}`)

  // Verify ML endpoint is available
  const healthRes = http.get(`${API_BASE_URL}/health`)
  if (healthRes.status !== 200) {
    throw new Error(`API health check failed: ${healthRes.status}`)
  }

  // Check if ML service is available
  const mlHealthRes = http.get(`${API_BASE_URL}/api/ml/health`)
  if (mlHealthRes.status !== 200) {
    console.warn('ML service health check failed, tests may fail')
  }

  return { startTime: Date.now() }
}

/**
 * Teardown function
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`ML inference test completed in ${duration.toFixed(2)} seconds`)
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  const inferenceP95 = data.metrics.ml_inference_duration.values['p(95)']
  const inferenceP99 = data.metrics.ml_inference_duration.values['p(99)']
  const inferenceAvg = data.metrics.ml_inference_duration.values.avg
  const batchP95 = data.metrics.ml_batch_inference_duration?.values['p(95)'] || 0
  const successRate = data.metrics.inference_success_rate?.values.rate || 0
  const accuracy = data.metrics.model_accuracy_score?.values.avg || 0
  const throughput = data.metrics.inference_throughput_rps?.values.avg || 0
  const coldStart = data.metrics.cold_start_latency?.values['p(95)'] || 0

  console.log('\n=== ML Inference Performance Summary ===')
  console.log(
    `Single Frame Inference P95: ${inferenceP95.toFixed(2)}ms (Target: <100ms) - ${inferenceP95 < 100 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Single Frame Inference P99: ${inferenceP99.toFixed(2)}ms (Target: <200ms) - ${inferenceP99 < 200 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Average Inference Time: ${inferenceAvg.toFixed(2)}ms (Target: <80ms) - ${inferenceAvg < 80 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Batch Inference P95: ${batchP95.toFixed(2)}ms (Target: <500ms) - ${batchP95 < 500 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Cold Start P95: ${coldStart.toFixed(2)}ms (Target: <2000ms) - ${coldStart < 2000 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Inference Success Rate: ${(successRate * 100).toFixed(2)}% (Target: >99%) - ${successRate > 0.99 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Model Accuracy: ${(accuracy * 100).toFixed(2)}% (Target: >90%) - ${accuracy > 0.9 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Throughput: ${throughput.toFixed(2)} req/sec (Target: >20) - ${throughput > 20 ? '✓ PASS' : '✗ FAIL'}`,
  )

  // Identify bottlenecks
  const bottlenecks = []
  if (inferenceP95 >= 100) bottlenecks.push('Single frame inference latency exceeds target')
  if (batchP95 >= 500) bottlenecks.push('Batch inference latency exceeds target')
  if (coldStart >= 2000) bottlenecks.push('Cold start time too high')
  if (successRate < 0.99) bottlenecks.push('Inference success rate below target')
  if (accuracy < 0.9) bottlenecks.push('Model accuracy below 90%')
  if (throughput < 20) bottlenecks.push('Throughput below 20 req/sec')

  if (bottlenecks.length > 0) {
    console.log('\n⚠️  Bottlenecks Detected:')
    bottlenecks.forEach((b, i) => console.log(`  ${i + 1}. ${b}`))
  }

  return {
    'reports/ml-inference.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
