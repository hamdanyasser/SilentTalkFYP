import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Suite...');
  console.log(`Base URL: ${config.use?.baseURL || 'http://localhost:3000'}`);

  // Wait for services to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = config.use?.baseURL || 'http://localhost:3000';
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const mlURL = process.env.ML_URL || 'http://localhost:8000';

  // Check if frontend is ready
  console.log('⏳ Waiting for frontend...');
  let retries = 30;
  while (retries > 0) {
    try {
      await page.goto(baseURL, { timeout: 5000 });
      console.log('✅ Frontend is ready');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error('Frontend failed to start');
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Check if backend API is ready
  console.log('⏳ Waiting for backend API...');
  retries = 30;
  while (retries > 0) {
    try {
      const response = await page.request.get(`${apiURL}/health`);
      if (response.ok()) {
        console.log('✅ Backend API is ready');
        break;
      }
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.warn('⚠️  Backend API not ready, some tests may fail');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Check if ML service is ready
  console.log('⏳ Waiting for ML service...');
  retries = 30;
  while (retries > 0) {
    try {
      const response = await page.request.get(`${mlURL}/health`);
      if (response.ok()) {
        console.log('✅ ML service is ready');
        break;
      }
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.warn('⚠️  ML service not ready, some tests may fail');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  await browser.close();

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
