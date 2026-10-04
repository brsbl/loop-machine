import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Browser tests in e2e/ run in real Chrome through Playwright, not here.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
