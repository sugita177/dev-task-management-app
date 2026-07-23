/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './global-teardown.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'docker compose -f ../../docker-compose.test.yml up db_test -d && npm run start',
      cwd: '../backend',
      url: 'http://localhost:3001/api',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: {
        PORT: '3001',
        DATABASE_URL: 'postgresql://dev_user:dev_password@localhost:5433/dev_task_db_test?schema=public',
        NODE_ENV: 'test',
        FRONTEND_URL: 'http://localhost:5174',
      },
    },
    {
      command: 'npx vite --port 5174',
      cwd: './',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: {
        VITE_API_BASE_URL: 'http://localhost:3001/api',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
