import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('\n🏁 E2E Test Suite Complete');
  console.log('📊 Check test-results/ for detailed reports');
}

export default globalTeardown;
