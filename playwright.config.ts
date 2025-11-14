import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'dist/playwright-report' }],
    ['json', { outputFile: 'dist/playwright-report/results.json' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'app-user',
      use: { ...devices['Desktop Chrome'] },
      testDir: './test/playwright/app-user',
    },
    {
      name: 'app-partner',
      use: { ...devices['Desktop Chrome'] },
      testDir: './test/playwright/app-partner',
    },
  ],
  webServer: [
    {
      command: 'npm run start:dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});

