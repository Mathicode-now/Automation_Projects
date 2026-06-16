import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  reporter: [
    ['html'],
    ['./src/reporters/heal-reporter.ts'],
  ],
  webServer: {
    command: 'npx http-server ../ -p 8080 -s',
    port: 8080,
    reuseExistingServer: true,
  },
});
