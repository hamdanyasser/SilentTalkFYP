#!/usr/bin/env node
/**
 * Lighthouse CI Accessibility Audit
 * WCAG 2.1 AA Performance and Accessibility
 */

import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

const pages = [
  { name: 'Home', url: '/' },
  { name: 'Video Call', url: '/call' },
];

// Lighthouse configuration focusing on accessibility
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

async function runLighthouseAudit() {
  console.log('🔍 Starting Lighthouse Accessibility Audit...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222', '--no-sandbox'],
  });

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: [],
    summary: {
      averageAccessibilityScore: 0,
      averageBestPracticesScore: 0,
      averageSeoScore: 0,
      totalIssues: 0,
    },
  };

  try {
    for (const pageInfo of pages) {
      console.log(`Auditing: ${pageInfo.name} (${pageInfo.url})`);

      const url = `${BASE_URL}${pageInfo.url}`;
      const result = await lighthouse(url, {
        port: 9222,
        output: 'json',
      }, config);

      if (!result) {
        console.log(`  ❌ Failed to audit ${pageInfo.name}\n`);
        continue;
      }

      const { lhr } = result;

      // Extract scores
      const accessibility = lhr.categories.accessibility?.score * 100 || 0;
      const bestPractices = lhr.categories['best-practices']?.score * 100 || 0;
      const seo = lhr.categories.seo?.score * 100 || 0;

      // Extract accessibility issues
      const a11yAudits = Object.entries(lhr.audits)
        .filter(([key, audit]) => {
          return (
            audit.score !== null &&
            audit.score < 1 &&
            (key.includes('aria') ||
              key.includes('color-contrast') ||
              key.includes('heading') ||
              key.includes('label') ||
              key.includes('tabindex') ||
              key.includes('document-title') ||
              key.includes('html-lang') ||
              key.includes('image-alt') ||
              key.includes('button-name') ||
              key.includes('link-name'))
          );
        })
        .map(([key, audit]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
        }));

      const pageResult = {
        name: pageInfo.name,
        url: pageInfo.url,
        scores: {
          accessibility,
          bestPractices,
          seo,
        },
        issues: a11yAudits,
        issueCount: a11yAudits.length,
      };

      results.pages.push(pageResult);

      // Update summary
      results.summary.averageAccessibilityScore += accessibility;
      results.summary.averageBestPracticesScore += bestPractices;
      results.summary.averageSeoScore += seo;
      results.summary.totalIssues += a11yAudits.length;

      // Print results
      console.log(`  📊 Accessibility Score: ${accessibility.toFixed(0)}/100`);
      console.log(`  📊 Best Practices Score: ${bestPractices.toFixed(0)}/100`);
      console.log(`  📊 SEO Score: ${seo.toFixed(0)}/100`);

      if (a11yAudits.length > 0) {
        console.log(`  ⚠️  Found ${a11yAudits.length} accessibility issues:`);
        a11yAudits.forEach((issue) => {
          console.log(`     - ${issue.title}`);
        });
      } else {
        console.log('  ✅ No accessibility issues found!');
      }

      console.log('');
    }

    // Calculate averages
    const pageCount = results.pages.length;
    if (pageCount > 0) {
      results.summary.averageAccessibilityScore /= pageCount;
      results.summary.averageBestPracticesScore /= pageCount;
      results.summary.averageSeoScore /= pageCount;
    }

    // Save results
    const reportPath = join(process.cwd(), 'lighthouse-report.json');
    writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('='.repeat(60));
    console.log('LIGHTHOUSE AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Average Accessibility Score: ${results.summary.averageAccessibilityScore.toFixed(0)}/100`);
    console.log(`Average Best Practices Score: ${results.summary.averageBestPracticesScore.toFixed(0)}/100`);
    console.log(`Average SEO Score: ${results.summary.averageSeoScore.toFixed(0)}/100`);
    console.log(`Total Accessibility Issues: ${results.summary.totalIssues}`);
    console.log('='.repeat(60));

    // Check if passing (90+ accessibility score)
    if (results.summary.averageAccessibilityScore < 90) {
      console.log('\n⚠️  Accessibility score below 90. Please improve.\n');
      process.exit(1);
    } else {
      console.log('\n✅ Lighthouse audit passed!\n');
      process.exit(0);
    }
  } finally {
    await browser.close();
  }
}

// Run audit
runLighthouseAudit().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
