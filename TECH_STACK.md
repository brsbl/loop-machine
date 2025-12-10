# Tech Stack Evaluation

## Current Stack
| Layer | Choice | Status |
|-------|--------|--------|
| Framework | React 18 | ✅ Keep |
| Build | Vite 5 | ✅ Keep |
| Styling | Tailwind 4 | ✅ Keep |
| Audio | Tone.js | ✅ Decided |

## Audio Library Options

### Option A: Keep Raw Web Audio API
**Pros**
- Zero dependencies, smallest bundle
- Full control over scheduling
- Already working well

**Cons**
- More code for complex features (arpeggiator, filters)
- Manual implementation of musical concepts

**Verdict**: Good for drums, but arpeggiator will need more work

---

### Option B: Tone.js
**Pros**
- Built-in `Tone.Arpeggiator` class
- Musical timing (bars, beats) instead of raw seconds
- Synths, samplers, effects all included
- Transport sync built-in

**Cons**
- ~300KB minified (significant)
- Learning curve
- May be overkill for this project

**Verdict**: Best DX for arpeggiator, but heavy

---

### Option C: Hybrid Approach (Recommended?)
Keep Web Audio for drums, add minimal helpers:
- Use `Tone.Transport` for timing only (~50KB)
- Build arpeggiator logic ourselves
- Keep existing effect chain

**Verdict**: Balance of control + convenience

---

## Questions to Decide

1. **Bundle size priority?**
   - Minimal (<100KB) → Stay vanilla
   - Moderate (<500KB) → Tone.js is fine

2. **Arpeggiator complexity?**
   - Simple (up/down/rate) → Can build ourselves
   - Advanced (patterns, swing) → Tone.js helps

3. **Future synth sounds?**
   - Just samples → Vanilla is fine
   - Oscillator-based synths → Tone.js wins

## Decision

**Using Tone.js** for all audio features.

**Why:**
- Built-in `Transport` for tempo/timing
- `Sampler` for drum samples
- `Pattern` / arpeggiator utilities
- Effects (reverb, filter) are easier to chain
- Future-proofs for synth sounds

**Migration path:**
1. Install Tone.js
2. Replace `useAudioEngine` with Tone-based implementation
3. Use `Tone.Transport` for sequencer timing
4. Keep existing React component structure
