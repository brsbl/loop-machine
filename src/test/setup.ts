import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only unmounts between tests on its own when Vitest globals are on; they're off here.
afterEach(cleanup)
