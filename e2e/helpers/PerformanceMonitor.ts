import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  responseTime: number;
  domLoadTime: number;
  totalLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

export interface VideoMetrics {
  latency: number;
  jitter: number;
  packetsLost: number;
  frameRate: number;
  bitrate: number;
}

export class PerformanceMonitor {
  constructor(private page: Page) {}

  /**
   * Measure API response time
   */
  async measureApiResponseTime(apiPath: string): Promise<number> {
    const startTime = Date.now();

    const response = await this.page.waitForResponse(
      (response) => response.url().includes(apiPath) && response.status() === 200,
      { timeout: 10000 }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`API ${apiPath} response time: ${responseTime}ms`);
    return responseTime;
  }

  /**
   * Measure page load performance metrics
   */
  async measurePageLoad(): Promise<PerformanceMetrics> {
    const performanceTiming = await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintData = window.performance.getEntriesByType('paint');

      return {
        responseTime: perfData.responseEnd - perfData.requestStart,
        domLoadTime: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        totalLoadTime: perfData.loadEventEnd - perfData.fetchStart,
        firstContentfulPaint: paintData.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0, // Will be updated by LCP observer
      };
    });

    // Get LCP separately as it requires an observer
    const lcp = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    return {
      ...performanceTiming,
      largestContentfulPaint: lcp,
    };
  }

  /**
   * Measure video call performance metrics
   */
  async measureVideoCallMetrics(): Promise<VideoMetrics> {
    const stats = await this.page.evaluate(() => {
      return new Promise<VideoMetrics>((resolve, reject) => {
        // Access the peer connection from the global scope
        const pc = (window as any).peerConnection;

        if (!pc) {
          reject(new Error('No peer connection found'));
          return;
        }

        pc.getStats().then((stats: RTCStatsReport) => {
          let latency = 0;
          let jitter = 0;
          let packetsLost = 0;
          let frameRate = 0;
          let bitrate = 0;

          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
              packetsLost = report.packetsLost || 0;
              jitter = report.jitter || 0;
              frameRate = report.framesPerSecond || 0;
              bitrate = report.bytesReceived ? (report.bytesReceived * 8) / report.timestamp : 0;
            }

            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
            }
          });

          resolve({
            latency,
            jitter,
            packetsLost,
            frameRate,
            bitrate,
          });
        }).catch(reject);
      });
    });

    console.log('Video call metrics:', stats);
    return stats;
  }

  /**
   * Validate API response time meets SLO (p95 < 200ms)
   */
  async validateApiSLO(apiPath: string, threshold: number = 200): Promise<boolean> {
    const measurements: number[] = [];

    // Take 20 measurements
    for (let i = 0; i < 20; i++) {
      const responseTime = await this.measureApiResponseTime(apiPath);
      measurements.push(responseTime);
      await this.page.waitForTimeout(100); // Small delay between measurements
    }

    // Calculate p95
    measurements.sort((a, b) => a - b);
    const p95Index = Math.ceil(measurements.length * 0.95) - 1;
    const p95 = measurements[p95Index];

    console.log(`API ${apiPath} p95: ${p95}ms (threshold: ${threshold}ms)`);
    return p95 < threshold;
  }

  /**
   * Validate video call latency meets SLO (< 150ms)
   */
  async validateVideoLatency(threshold: number = 150): Promise<boolean> {
    const metrics = await this.measureVideoCallMetrics();
    console.log(`Video latency: ${metrics.latency}ms (threshold: ${threshold}ms)`);
    return metrics.latency < threshold;
  }

  /**
   * Validate page load performance
   */
  async validatePageLoadPerformance(): Promise<boolean> {
    const metrics = await this.measurePageLoad();

    const checks = {
      totalLoadTime: metrics.totalLoadTime < 2000, // < 2s
      firstContentfulPaint: metrics.firstContentfulPaint < 1000, // < 1s
      largestContentfulPaint: metrics.largestContentfulPaint < 2500, // < 2.5s
    };

    console.log('Page load metrics:', {
      totalLoadTime: `${metrics.totalLoadTime}ms (target: <2000ms)`,
      firstContentfulPaint: `${metrics.firstContentfulPaint}ms (target: <1000ms)`,
      largestContentfulPaint: `${metrics.largestContentfulPaint}ms (target: <2500ms)`,
    });

    return Object.values(checks).every(check => check);
  }

  /**
   * Monitor real-time performance during test execution
   */
  async startMonitoring(interval: number = 1000): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        const memory = await this.page.evaluate(() => {
          const mem = (performance as any).memory;
          return mem ? {
            usedJSHeapSize: mem.usedJSHeapSize,
            totalJSHeapSize: mem.totalJSHeapSize,
            jsHeapSizeLimit: mem.jsHeapSizeLimit,
          } : null;
        });

        if (memory) {
          console.log('Memory usage:', {
            used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
            total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
          });
        }
      } catch (error) {
        // Ignore errors during monitoring
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}
