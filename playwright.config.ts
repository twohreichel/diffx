import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://127.0.0.1:3434' },
  projects: [
    { name: 'iPhone 15', use: { ...devices['iPhone 15'] }, testMatch: 'mobile.spec.ts' },
    { name: 'iPad (gen 7)', use: { ...devices['iPad (gen 7)'] }, testMatch: 'mobile.spec.ts' },
    { name: 'Desktop Safari', use: { ...devices['Desktop Safari'] }, testMatch: 'desktop.spec.ts' },
  ],
  webServer: {
    command: 'vite build && node --import tsx e2e/serve.ts',
    url: 'http://127.0.0.1:3434',
    reuseExistingServer: false,
  },
})
