import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Browser tests in e2e/ (Playwright) and audio renders (*.audio.test.ts, vitest.audio.config.ts) run in real Chrome, not here.
    exclude: [...configDefaults.exclude, 'e2e/**', '**/*.audio.test.ts'],
  },
})
