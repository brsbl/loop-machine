import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

/**
 * Audio render tests: Vitest in real Chromium, where OfflineAudioContext
 * exists (jsdom has no Web Audio). They render the engine's graph faster than
 * real time and measure the result.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.audio.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
