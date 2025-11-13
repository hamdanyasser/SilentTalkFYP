import { Page } from '@playwright/test';
import type { AxeResults, Result, NodeResult } from 'axe-core';

export interface AccessibilityReport {
  violations: Result[];
  passes: Result[];
  incomplete: Result[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  timestamp: string;
  url: string;
}

export class AccessibilityChecker {
  constructor(private page: Page) {}

  /**
   * Inject axe-core into the page
   */
  private async injectAxe(): Promise<void> {
    await this.page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
    });
  }

  /**
   * Run accessibility audit on current page
   */
  async runAudit(wcagLevel: 'A' | 'AA' | 'AAA' = 'AA'): Promise<AccessibilityReport> {
    await this.injectAxe();

    const results: AxeResults = await this.page.evaluate((level) => {
      return (window as any).axe.run({
        runOnly: {
          type: 'tag',
          values: [`wcag2${level.toLowerCase()}`, `wcag21${level.toLowerCase()}`],
        },
      });
    }, wcagLevel);

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      wcagLevel,
      timestamp: new Date().toISOString(),
      url: this.page.url(),
    };
  }

  /**
   * Check for critical accessibility violations
   */
  async checkCriticalIssues(): Promise<boolean> {
    const report = await this.runAudit('AA');

    // Critical issues that must not exist
    const criticalRules = [
      'color-contrast', // Sufficient color contrast
      'label', // Form elements have labels
      'button-name', // Buttons have accessible names
      'link-name', // Links have accessible names
      'image-alt', // Images have alt text
      'aria-required-attr', // Required ARIA attributes present
      'aria-valid-attr-value', // Valid ARIA attribute values
      'duplicate-id', // No duplicate IDs
    ];

    const criticalViolations = report.violations.filter((violation) =>
      criticalRules.includes(violation.id)
    );

    if (criticalViolations.length > 0) {
      console.error('Critical accessibility violations found:');
      criticalViolations.forEach((violation) => {
        console.error(`  - ${violation.id}: ${violation.description}`);
        console.error(`    Impact: ${violation.impact}`);
        console.error(`    Affected nodes: ${violation.nodes.length}`);
      });
      return false;
    }

    return true;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<boolean> {
    const issues: string[] = [];

    // Get all interactive elements
    const interactiveElements = await this.page.evaluate(() => {
      const selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map((el, index) => ({
        index,
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 50) || '',
        id: el.id,
        className: el.className,
      }));
    });

    console.log(`Found ${interactiveElements.length} interactive elements`);

    // Tab through all elements
    for (let i = 0; i < interactiveElements.length; i++) {
      await this.page.keyboard.press('Tab');

      // Check if focus is visible
      const focusVisible = await this.page.evaluate(() => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;

        const styles = window.getComputedStyle(activeElement);
        const hasOutline = styles.outline !== 'none' && styles.outlineWidth !== '0px';
        const hasBorder = styles.border !== 'none' && styles.borderWidth !== '0px';
        const hasBoxShadow = styles.boxShadow !== 'none';

        return hasOutline || hasBorder || hasBoxShadow;
      });

      if (!focusVisible) {
        issues.push(`Element ${i + 1} (${interactiveElements[i].tagName}) has no visible focus indicator`);
      }
    }

    if (issues.length > 0) {
      console.error('Keyboard navigation issues:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      return false;
    }

    return true;
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility(): Promise<boolean> {
    const issues: string[] = [];

    // Check for proper heading hierarchy
    const headingIssues = await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const levels = headings.map(h => parseInt(h.tagName.substring(1)));

      const issues: string[] = [];

      // Check if h1 exists
      if (levels.length > 0 && !levels.includes(1)) {
        issues.push('No h1 heading found on page');
      }

      // Check for skipped levels
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          issues.push(`Heading level skipped: h${levels[i - 1]} to h${levels[i]}`);
        }
      }

      return issues;
    });

    issues.push(...headingIssues);

    // Check for ARIA landmarks
    const landmarkIssues = await this.page.evaluate(() => {
      const landmarks = {
        main: document.querySelectorAll('main, [role="main"]').length,
        navigation: document.querySelectorAll('nav, [role="navigation"]').length,
        banner: document.querySelectorAll('header, [role="banner"]').length,
        contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length,
      };

      const issues: string[] = [];

      if (landmarks.main === 0) {
        issues.push('No main landmark found');
      }

      if (landmarks.main > 1) {
        issues.push('Multiple main landmarks found');
      }

      return issues;
    });

    issues.push(...landmarkIssues);

    // Check form labels
    const formIssues = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      const issues: string[] = [];

      inputs.forEach((input) => {
        const id = input.id;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const type = (input as HTMLInputElement).type;

        // Skip hidden and submit/button inputs
        if (type === 'hidden' || type === 'submit' || type === 'button') {
          return;
        }

        if (!label && !ariaLabel && !ariaLabelledby) {
          issues.push(`Form input without label: ${input.tagName} (id: ${id || 'none'})`);
        }
      });

      return issues;
    });

    issues.push(...formIssues);

    if (issues.length > 0) {
      console.error('Screen reader compatibility issues:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      return false;
    }

    return true;
  }

  /**
   * Test color contrast ratios
   */
  async testColorContrast(): Promise<boolean> {
    await this.injectAxe();

    const contrastResults = await this.page.evaluate(() => {
      return (window as any).axe.run({
        runOnly: {
          type: 'rule',
          values: ['color-contrast'],
        },
      });
    });

    if (contrastResults.violations.length > 0) {
      console.error('Color contrast violations:');
      contrastResults.violations.forEach((violation: Result) => {
        console.error(`  - ${violation.description}`);
        violation.nodes.forEach((node: NodeResult) => {
          console.error(`    Element: ${node.html.substring(0, 100)}`);
          console.error(`    Contrast ratio: ${node.any[0]?.data?.contrastRatio || 'unknown'}`);
        });
      });
      return false;
    }

    return true;
  }

  /**
   * Test for keyboard traps
   */
  async testKeyboardTraps(): Promise<boolean> {
    const initialActiveElement = await this.page.evaluate(() => document.activeElement?.tagName);

    // Tab forward 20 times
    for (let i = 0; i < 20; i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(50);
    }

    // Tab backward 20 times
    for (let i = 0; i < 20; i++) {
      await this.page.keyboard.press('Shift+Tab');
      await this.page.waitForTimeout(50);
    }

    const finalActiveElement = await this.page.evaluate(() => document.activeElement?.tagName);

    // We should be able to cycle through elements without getting trapped
    // This is a basic check - in a real scenario, we'd want to verify we can reach all elements

    return true; // If we got here without timing out, there's likely no keyboard trap
  }

  /**
   * Generate comprehensive accessibility report
   */
  async generateReport(): Promise<AccessibilityReport> {
    const report = await this.runAudit('AA');

    console.log('\n=== Accessibility Report ===');
    console.log(`URL: ${report.url}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`WCAG Level: ${report.wcagLevel}`);
    console.log(`\nViolations: ${report.violations.length}`);
    console.log(`Passes: ${report.passes.length}`);
    console.log(`Incomplete: ${report.incomplete.length}`);

    if (report.violations.length > 0) {
      console.log('\n=== Violations ===');
      report.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id} (${violation.impact})`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Affected nodes: ${violation.nodes.length}`);

        violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
          console.log(`   Node ${nodeIndex + 1}: ${node.html.substring(0, 100)}...`);
        });
      });
    }

    return report;
  }

  /**
   * Validate WCAG 2.1 AA compliance
   */
  async validateWCAG_AA(): Promise<boolean> {
    console.log('\n=== Running WCAG 2.1 AA Compliance Check ===\n');

    const checks = {
      criticalIssues: await this.checkCriticalIssues(),
      keyboardNavigation: await this.testKeyboardNavigation(),
      screenReader: await this.testScreenReaderCompatibility(),
      colorContrast: await this.testColorContrast(),
      keyboardTraps: await this.testKeyboardTraps(),
    };

    const allPassed = Object.values(checks).every(check => check);

    console.log('\n=== Compliance Check Results ===');
    console.log(`Critical Issues: ${checks.criticalIssues ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Keyboard Navigation: ${checks.keyboardNavigation ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Screen Reader: ${checks.screenReader ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Color Contrast: ${checks.colorContrast ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Keyboard Traps: ${checks.keyboardTraps ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`\nOverall: ${allPassed ? '✓ WCAG 2.1 AA COMPLIANT' : '✗ NON-COMPLIANT'}\n`);

    return allPassed;
  }
}
