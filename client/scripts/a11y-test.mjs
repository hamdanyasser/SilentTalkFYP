#!/usr/bin/env node
/**
 * Accessibility Testing with Axe-Core and Playwright
 * WCAG 2.1 AA Automated Testing
 */

import { chromium } from 'playwright';
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

const pages = [
  { name: 'Home', url: '/' },
  { name: 'Video Call', url: '/call' },
  { name: 'Health', url: '/health' },
];

async function runA11yTests() {
  console.log('🔍 Starting Accessibility Tests with Axe-Core...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: [],
    summary: {
      totalViolations: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    },
  };

  for (const pageInfo of pages) {
    console.log(`Testing: ${pageInfo.name} (${pageInfo.url})`);

    try {
      await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle' });

      // Inject axe-core
      await injectAxe(page);

      // Run accessibility check
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });

      // Process violations
      const pageResult = {
        name: pageInfo.name,
        url: pageInfo.url,
        violations: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length,
          wcagTags: v.tags.filter((t) => t.startsWith('wcag')),
        })),
        violationCount: violations.length,
      };

      results.pages.push(pageResult);

      // Update summary
      violations.forEach((v) => {
        results.summary.totalViolations++;
        if (v.impact === 'critical') results.summary.critical++;
        else if (v.impact === 'serious') results.summary.serious++;
        else if (v.impact === 'moderate') results.summary.moderate++;
        else if (v.impact === 'minor') results.summary.minor++;
      });

      // Print violations
      if (violations.length > 0) {
        console.log(`  ❌ Found ${violations.length} violations:`);
        violations.forEach((v) => {
          console.log(`     - [${v.impact.toUpperCase()}] ${v.id}: ${v.help}`);
        });
      } else {
        console.log('  ✅ No violations found!');
      }

      console.log('');
    } catch (error) {
      console.error(`  ❌ Error testing ${pageInfo.name}:`, error.message);
      results.pages.push({
        name: pageInfo.name,
        url: pageInfo.url,
        error: error.message,
      });
    }
  }

  await browser.close();

  // Save results
  const reportPath = join(process.cwd(), 'a11y-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Report saved to: ${reportPath}\n`);

  // Print summary
  console.log('='.repeat(60));
  console.log('ACCESSIBILITY TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Violations: ${results.summary.totalViolations}`);
  console.log(`  Critical: ${results.summary.critical}`);
  console.log(`  Serious: ${results.summary.serious}`);
  console.log(`  Moderate: ${results.summary.moderate}`);
  console.log(`  Minor: ${results.summary.minor}`);
  console.log('='.repeat(60));

  // Exit with error if violations found
  if (results.summary.totalViolations > 0) {
    console.log('\n❌ Accessibility violations found. Please fix them.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All accessibility tests passed!\n');
    process.exit(0);
  }
}

// Run tests
runA11yTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
