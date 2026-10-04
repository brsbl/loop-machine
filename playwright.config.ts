import { defineConfig, devices } from '@playwright/test'

/**
 * Browser smoke tests: the production build in real Chrome, where Web Audio
 * and layout exist (unlike jsdom). CI runs them after the unit tests.
 */
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // Audio starts from the Start click, a user gesture, but CI has no speakers to wake.
      use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
