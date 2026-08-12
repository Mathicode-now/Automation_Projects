import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'https://summerschool.lovable.app/',
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  reporter: [
    ['html'],
    ['./src/reporters/heal-reporter.ts'],
  ],
});
