import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './ui/tokens.css'

// The Agentation annotation toolbar is a development aid; it never ships to visitors.
const DevToolbar = import.meta.env.DEV ? lazy(() => import('agentation').then((m) => ({ default: m.Agentation }))) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {DevToolbar && (
      <Suspense fallback={null}>
        <DevToolbar />
      </Suspense>
    )}
  </StrictMode>,
)
