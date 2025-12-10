## Review Findings

### [P1] Potential AudioContext memory leak
**File:** `src/hooks/useAudioEngine.js`

The `useEffect` hook creates a new `AudioContext` instance whenever `instruments` changes but fails to close the previous instance in the cleanup function. Browsers typically have a limit on the number of active `AudioContexts` (often 6), so this can lead to errors and a broken audio engine if the component re-renders with new props or during Hot Module Replacement (HMR).

```javascript
    return () => {
      initCountRef.current++
      if (ctx.state !== 'closed') {
        ctx.close()
      }
    }
```

### [P2] Regression in real-time parameter control
**File:** `src/hooks/useAudioEngine.js`

The refactor removed the `onEffectChange` prop and logic, meaning that adjustments to volume, reverb, and filter now only apply to the *next* triggered note via `playSound`. Changes made while a sound is playing (e.g., adjusting the filter on a long tail) will not be audible immediately, which is a regression in responsiveness for a musical instrument interface. Consider restoring the real-time update mechanism using the exposed setters.

### [P2] Knob component lacks keyboard support
**File:** `src/components/ui/Knob.jsx`

The `Knob` component includes `role="slider"` and `tabIndex={0}`, making it focusable, but it lacks `onKeyDown` handlers. This prevents keyboard users from adjusting the value, violating accessibility standards.

### [P3] Knob drag sensitivity is too high
**File:** `src/components/ui/Knob.jsx`

The drag sensitivity is calculated such that a 50px movement covers the entire range (0 to 1). This is quite sensitive and may make fine adjustments difficult. Increasing this distance (e.g., to 150px) would improve usability.

```javascript
      const sensitivity = range / 150
```

### [P3] Audio loading errors are swallowed
**File:** `src/hooks/useAudioEngine.js`

Errors occurring during the fetch or decode phases of sample loading are silently caught and ignored. This leaves the user unaware if specific samples fail to load. Consider logging the error or updating the track state to indicate the failure.

---
**Overall Verdict:** Changes required. The AudioContext leak is a significant issue for stability.
