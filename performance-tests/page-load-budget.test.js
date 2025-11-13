/**
 * Frontend Page Load Budget Tests
 * Tests page load performance against defined budgets
 *
 * Performance Budgets (based on Success Metrics pp. 27-28):
 * - Initial page load: < 3s (p95)
 * - Time to Interactive (TTI): < 3.5s (p95)
 * - First Contentful Paint (FCP): < 1.5s (p95)
 * - Largest Contentful Paint (LCP): < 2.5s (p95)
 * - Cumulative Layout Shift (CLS): < 0.1
 * - First Input Delay (FID): < 100ms
 * - Total Blocking Time (TBT): < 300ms
 * - Bundle size: < 500KB (gzipped)
 */

import { browser } from 'k6/experimental/browser'
import { check, sleep } from 'k6'
import { Rate, Counter, Trend } from 'k6/metrics'
import http from 'k6/http'

// Custom metrics
const pageLoadTime = new Trend('page_load_time')
const timeToInteractive = new Trend('time_to_interactive')
const firstContentfulPaint = new Trend('first_contentful_paint')
const largestContentfulPaint = new Trend('largest_contentful_paint')
const cumulativeLayoutShift = new Trend('cumulative_layout_shift')
const firstInputDelay = new Trend('first_input_delay')
const totalBlockingTime = new Trend('total_blocking_time')
const bundleSize = new Trend('bundle_size_kb')
const pageLoadSuccess = new Rate('page_load_success_rate')
const resourceErrors = new Counter('resource_errors')

// Test configuration
export const options = {
  scenarios: {
    browser_test: {
      executor: 'constant-vus',
      vus: 3,
      duration: '5m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    page_load_time: ['p(95)<3000', 'p(99)<5000'], // 3s at p95, 5s at p99
    time_to_interactive: ['p(95)<3500', 'p(99)<5500'],
    first_contentful_paint: ['p(95)<1500', 'p(99)<2000'],
    largest_contentful_paint: ['p(95)<2500', 'p(99)<3500'],
    cumulative_layout_shift: ['avg<0.1', 'p(95)<0.25'],
    first_input_delay: ['p(95)<100', 'p(99)<200'],
    total_blocking_time: ['p(95)<300', 'p(99)<500'],
    bundle_size_kb: ['avg<500'],
    page_load_success_rate: ['rate>0.98'],
  },
}

const WEB_BASE_URL = __ENV.WEB_BASE_URL || 'http://localhost:3000'

/**
 * Pages to test with their performance budgets
 */
const TEST_PAGES = [
  {
    name: 'Home Page',
    url: '/',
    budget: { loadTime: 2500, tti: 3000, fcp: 1200, lcp: 2000 },
  },
  {
    name: 'Sign Language Learning',
    url: '/learn',
    budget: { loadTime: 3000, tti: 3500, fcp: 1500, lcp: 2500 },
  },
  {
    name: 'Video Call',
    url: '/video-call',
    budget: { loadTime: 3000, tti: 3500, fcp: 1500, lcp: 2500 },
  },
  {
    name: 'Forum',
    url: '/forum',
    budget: { loadTime: 2500, tti: 3000, fcp: 1200, lcp: 2000 },
  },
  {
    name: 'Resource Library',
    url: '/resources',
    budget: { loadTime: 2500, tti: 3000, fcp: 1200, lcp: 2000 },
  },
  {
    name: 'Interpreter Booking',
    url: '/booking',
    budget: { loadTime: 2500, tti: 3000, fcp: 1200, lcp: 2000 },
  },
  {
    name: 'User Profile',
    url: '/profile',
    budget: { loadTime: 2000, tti: 2500, fcp: 1000, lcp: 1800 },
  },
]

/**
 * Calculate Web Vitals from Performance API
 */
function calculateWebVitals(page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint')

    // Calculate metrics
    const metrics = {
      // Page load metrics
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      domInteractive: navigation ? navigation.domInteractive - navigation.fetchStart : 0,

      // Paint metrics
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

      // Resource timing
      dnsTime: navigation ? navigation.domainLookupEnd - navigation.domainLookupStart : 0,
      tcpTime: navigation ? navigation.connectEnd - navigation.connectStart : 0,
      requestTime: navigation ? navigation.responseStart - navigation.requestStart : 0,
      responseTime: navigation ? navigation.responseEnd - navigation.responseStart : 0,
      renderTime: navigation ? navigation.domComplete - navigation.domLoading : 0,
    }

    // Estimate TTI (simplified - real implementation would be more complex)
    metrics.tti = Math.max(
      metrics.domContentLoaded,
      metrics.domInteractive,
      metrics.fcp + 1000, // FCP + 1 second of quiet period
    )

    return metrics
  })
}

/**
 * Get LCP using PerformanceObserver (via page evaluation)
 */
function observeLCP(page) {
  return page.evaluate(() => {
    return new Promise(resolve => {
      let lcp = 0
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        lcp = lastEntry.startTime
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })

      // Resolve after 5 seconds or when page is fully loaded
      setTimeout(() => {
        observer.disconnect()
        resolve(lcp)
      }, 5000)
    })
  })
}

/**
 * Get CLS using PerformanceObserver
 */
function observeCLS(page) {
  return page.evaluate(() => {
    return new Promise(resolve => {
      let cls = 0
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value
          }
        }
      })
      observer.observe({ entryTypes: ['layout-shift'] })

      setTimeout(() => {
        observer.disconnect()
        resolve(cls)
      }, 5000)
    })
  })
}

/**
 * Measure Total Blocking Time
 */
function measureTBT(page) {
  return page.evaluate(() => {
    return new Promise(resolve => {
      let tbt = 0
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            tbt += entry.duration - 50
          }
        }
      })
      observer.observe({ entryTypes: ['longtask'] })

      setTimeout(() => {
        observer.disconnect()
        resolve(tbt)
      }, 5000)
    })
  })
}

/**
 * Get bundle sizes
 */
function getBundleSizes(page) {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType('resource')
    let totalJS = 0
    let totalCSS = 0
    let totalImages = 0
    let totalFonts = 0
    let totalOther = 0

    resources.forEach(resource => {
      const size = resource.transferSize || resource.encodedBodySize || 0
      const name = resource.name

      if (name.endsWith('.js') || resource.initiatorType === 'script') {
        totalJS += size
      } else if (name.endsWith('.css') || resource.initiatorType === 'css') {
        totalCSS += size
      } else if (
        name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) ||
        resource.initiatorType === 'img'
      ) {
        totalImages += size
      } else if (name.match(/\.(woff|woff2|ttf|otf)$/i) || resource.initiatorType === 'font') {
        totalFonts += size
      } else {
        totalOther += size
      }
    })

    return {
      totalJS: Math.round(totalJS / 1024), // KB
      totalCSS: Math.round(totalCSS / 1024),
      totalImages: Math.round(totalImages / 1024),
      totalFonts: Math.round(totalFonts / 1024),
      totalOther: Math.round(totalOther / 1024),
      total: Math.round((totalJS + totalCSS + totalImages + totalFonts + totalOther) / 1024),
    }
  })
}

/**
 * Main test scenario
 */
export default async function () {
  const page = browser.newPage()

  try {
    // Select random page to test
    const testPage = TEST_PAGES[Math.floor(Math.random() * TEST_PAGES.length)]
    const url = `${WEB_BASE_URL}${testPage.url}`

    console.log(`Testing ${testPage.name}: ${url}`)

    // Navigate to page
    const navigationStart = Date.now()
    const response = await page.goto(url, { waitUntil: 'networkidle' })

    const loadSuccess = check(response, {
      'page loaded successfully': r => r.status() === 200,
      'page is HTML': r => r.headers()['content-type']?.includes('text/html'),
    })

    pageLoadSuccess.add(loadSuccess)

    if (!loadSuccess) {
      console.error(`Failed to load ${testPage.name}: ${response.status()}`)
      resourceErrors.add(1)
      page.close()
      return
    }

    // Wait for page to stabilize
    await page.waitForLoadState('load')

    // Collect Web Vitals
    const vitals = await calculateWebVitals(page)

    // Record core metrics
    pageLoadTime.add(vitals.pageLoadTime)
    timeToInteractive.add(vitals.tti)
    firstContentfulPaint.add(vitals.fcp)

    console.log(`${testPage.name} - Load: ${vitals.pageLoadTime.toFixed(0)}ms, TTI: ${vitals.tti.toFixed(0)}ms, FCP: ${vitals.fcp.toFixed(0)}ms`)

    // Observe LCP
    const lcp = await observeLCP(page)
    largestContentfulPaint.add(lcp)

    // Observe CLS
    const cls = await observeCLS(page)
    cumulativeLayoutShift.add(cls)

    // Measure TBT
    const tbt = await measureTBT(page)
    totalBlockingTime.add(tbt)

    // Simulate user interaction to measure FID
    const interactionStart = Date.now()
    await page.click('body') // Click somewhere on the page
    const fid = Date.now() - interactionStart
    firstInputDelay.add(fid)

    // Get bundle sizes
    const bundles = await getBundleSizes(page)
    bundleSize.add(bundles.total)

    console.log(
      `${testPage.name} - LCP: ${lcp.toFixed(0)}ms, CLS: ${cls.toFixed(3)}, TBT: ${tbt.toFixed(0)}ms, FID: ${fid}ms`,
    )
    console.log(
      `${testPage.name} - Bundle: ${bundles.total}KB (JS: ${bundles.totalJS}KB, CSS: ${bundles.totalCSS}KB, Images: ${bundles.totalImages}KB)`,
    )

    // Check against page-specific budgets
    const budgetChecks = {
      'load time within budget': vitals.pageLoadTime <= testPage.budget.loadTime,
      'TTI within budget': vitals.tti <= testPage.budget.tti,
      'FCP within budget': vitals.fcp <= testPage.budget.fcp,
      'LCP within budget': lcp <= testPage.budget.lcp,
      'CLS within budget': cls < 0.1,
      'bundle size within budget': bundles.total < 500,
    }

    const allChecksPassed = Object.values(budgetChecks).every(v => v)
    if (!allChecksPassed) {
      console.warn(`${testPage.name} failed budget checks:`, budgetChecks)
    }

    // Test page interactions
    await testPageInteractions(page, testPage.name)

    // Take screenshot if configured
    if (__ENV.SCREENSHOT === 'true') {
      page.screenshot({ path: `reports/screenshots/${testPage.name.replace(/\s+/g, '-').toLowerCase()}.png` })
    }
  } catch (error) {
    console.error(`Error testing page: ${error}`)
    resourceErrors.add(1)
    pageLoadSuccess.add(false)
  } finally {
    page.close()
  }

  sleep(Math.random() * 2 + 1)
}

/**
 * Test common page interactions
 */
async function testPageInteractions(page, pageName) {
  try {
    // Test navigation menu
    const navStart = Date.now()
    await page.click('nav a:first-of-type', { timeout: 2000 }).catch(() => {})
    const navDuration = Date.now() - navStart
    console.log(`${pageName} - Navigation interaction: ${navDuration}ms`)

    // Test button clicks
    const buttonStart = Date.now()
    await page.click('button:first-of-type', { timeout: 2000 }).catch(() => {})
    const buttonDuration = Date.now() - buttonStart
    console.log(`${pageName} - Button interaction: ${buttonDuration}ms`)

    // Test form inputs
    const inputStart = Date.now()
    await page.type('input:first-of-type', 'test', { timeout: 2000 }).catch(() => {})
    const inputDuration = Date.now() - inputStart
    console.log(`${pageName} - Input interaction: ${inputDuration}ms`)

    // Record interaction delays
    firstInputDelay.add(Math.max(navDuration, buttonDuration, inputDuration))
  } catch (error) {
    console.log(`${pageName} - Interaction test error: ${error}`)
  }
}

/**
 * Setup function
 */
export function setup() {
  console.log(`Starting page load budget test against ${WEB_BASE_URL}`)
  console.log(`Testing ${TEST_PAGES.length} pages`)

  // Verify web server is running
  const healthRes = http.get(WEB_BASE_URL)
  if (healthRes.status !== 200) {
    throw new Error(`Web server health check failed: ${healthRes.status}`)
  }

  return { startTime: Date.now() }
}

/**
 * Teardown function
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`Page load budget test completed in ${duration.toFixed(2)} seconds`)
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  const loadP95 = data.metrics.page_load_time.values['p(95)']
  const ttiP95 = data.metrics.time_to_interactive.values['p(95)']
  const fcpP95 = data.metrics.first_contentful_paint.values['p(95)']
  const lcpP95 = data.metrics.largest_contentful_paint.values['p(95)']
  const clsAvg = data.metrics.cumulative_layout_shift.values.avg
  const fidP95 = data.metrics.first_input_delay.values['p(95)']
  const tbtP95 = data.metrics.total_blocking_time.values['p(95)']
  const bundleAvg = data.metrics.bundle_size_kb.values.avg
  const successRate = data.metrics.page_load_success_rate?.values.rate || 0

  console.log('\n=== Page Load Budget Test Summary ===')
  console.log(
    `Page Load Time P95: ${loadP95.toFixed(0)}ms (Budget: <3000ms) - ${loadP95 < 3000 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Time to Interactive P95: ${ttiP95.toFixed(0)}ms (Budget: <3500ms) - ${ttiP95 < 3500 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `First Contentful Paint P95: ${fcpP95.toFixed(0)}ms (Budget: <1500ms) - ${fcpP95 < 1500 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Largest Contentful Paint P95: ${lcpP95.toFixed(0)}ms (Budget: <2500ms) - ${lcpP95 < 2500 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Cumulative Layout Shift Avg: ${clsAvg.toFixed(3)} (Budget: <0.1) - ${clsAvg < 0.1 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `First Input Delay P95: ${fidP95.toFixed(0)}ms (Budget: <100ms) - ${fidP95 < 100 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Total Blocking Time P95: ${tbtP95.toFixed(0)}ms (Budget: <300ms) - ${tbtP95 < 300 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Bundle Size Avg: ${bundleAvg.toFixed(0)}KB (Budget: <500KB) - ${bundleAvg < 500 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Page Load Success Rate: ${(successRate * 100).toFixed(2)}% (Target: >98%) - ${successRate > 0.98 ? '✓ PASS' : '✗ FAIL'}`,
  )

  // Identify performance bottlenecks
  const bottlenecks = []
  if (loadP95 >= 3000) bottlenecks.push('Page load time exceeds budget')
  if (ttiP95 >= 3500) bottlenecks.push('Time to Interactive exceeds budget')
  if (fcpP95 >= 1500) bottlenecks.push('First Contentful Paint too slow')
  if (lcpP95 >= 2500) bottlenecks.push('Largest Contentful Paint too slow')
  if (clsAvg >= 0.1) bottlenecks.push('Excessive layout shift')
  if (fidP95 >= 100) bottlenecks.push('First Input Delay too high')
  if (tbtP95 >= 300) bottlenecks.push('Total Blocking Time exceeds budget')
  if (bundleAvg >= 500) bottlenecks.push('Bundle size exceeds 500KB')

  if (bottlenecks.length > 0) {
    console.log('\n⚠️  Performance Bottlenecks Detected:')
    bottlenecks.forEach((b, i) => console.log(`  ${i + 1}. ${b}`))
  }

  return {
    'reports/page-load-budget.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
