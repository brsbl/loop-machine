import React from 'react';
import '../style.css';

/**
 * Individual component stories for visual regression testing
 * These stories isolate specific UI elements for detailed testing
 */

// Play/Stop Button Component
const PlayStopButton = ({ isPlaying = false, disabled = false }) => (
  <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', backgroundColor: '#f8f8f8' }}>
    <button
      id="play-stop-button"
      className={isPlaying ? 'playing' : ''}
      disabled={disabled}
    >
      <div className="button-text-line">START</div>
      <div className="button-separator"></div>
      <div className="button-text-line">STOP</div>
    </button>
  </div>
);

export const PlayButton = () => <PlayStopButton />;
export const PlayButtonPlaying = () => <PlayStopButton isPlaying={true} />;
export const PlayButtonDisabled = () => <PlayStopButton disabled={true} />;

// Note Buttons Component
const NoteButtons = ({ instrument = 'hihat', activeSteps = [], playingStep = -1 }) => (
  <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
    <div className="instrument-track-row" data-instrument={instrument}>
      <div className="instrument-label">{instrument}</div>
      <div className="notes-container">
        {Array.from({ length: 16 }, (_, i) => (
          <button
            key={i}
            className={`note-button ${activeSteps.includes(i) ? 'active' : ''} ${i === playingStep ? 'playing-step' : ''} ${i % 4 === 0 ? 'beat-start' : ''}`}
            data-step={i}
          />
        ))}
      </div>
    </div>
  </div>
);

export const HiHatNotesInactive = () => <NoteButtons instrument="hihat" />;
export const HiHatNotesActive = () => <NoteButtons instrument="hihat" activeSteps={[0, 2, 4, 6, 8, 10, 12, 14]} />;
export const HiHatNotesPlaying = () => <NoteButtons instrument="hihat" activeSteps={[0, 2, 4, 6, 8, 10, 12, 14]} playingStep={4} />;

export const SnareNotesInactive = () => <NoteButtons instrument="snare" />;
export const SnareNotesActive = () => <NoteButtons instrument="snare" activeSteps={[4, 12]} />;
export const SnareNotesPlaying = () => <NoteButtons instrument="snare" activeSteps={[4, 12]} playingStep={12} />;

export const KickNotesInactive = () => <NoteButtons instrument="kick" />;
export const KickNotesActive = () => <NoteButtons instrument="kick" activeSteps={[0, 8]} />;
export const KickNotesPlaying = () => <NoteButtons instrument="kick" activeSteps={[0, 8]} playingStep={0} />;

// Effect Sliders Component
const EffectSliders = ({ instrument = 'hihat', reverb = 0, delay = 0 }) => (
  <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
    <div className="instrument-track-row" data-instrument={instrument}>
      <div className="sliders-container">
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="10"
            value={reverb}
            className="effect-slider reverb-slider"
            data-effect="reverb"
            readOnly
          />
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="10"
            value={delay}
            className="effect-slider delay-slider"
            data-effect="delay"
            readOnly
          />
        </div>
      </div>
    </div>
  </div>
);

export const SlidersZero = () => <EffectSliders instrument="hihat" reverb={0} delay={0} />;
export const SlidersLow = () => <EffectSliders instrument="snare" reverb={3} delay={2} />;
export const SlidersMedium = () => <EffectSliders instrument="kick" reverb={5} delay={5} />;
export const SlidersHigh = () => <EffectSliders instrument="hihat" reverb={8} delay={9} />;
export const SlidersMax = () => <EffectSliders instrument="snare" reverb={10} delay={10} />;

// Labels Component
const Labels = () => (
  <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
    <div className="sequencer">
      <div className="beat-labels">
        <div className="beat-label">1</div>
        <div className="beat-label">2</div>
        <div className="beat-label">3</div>
        <div className="beat-label">4</div>
      </div>
      <div className="measure-labels">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="step-label">{i + 1}</div>
        ))}
      </div>
    </div>
  </div>
);

export const BeatAndStepLabels = () => <Labels />;

// Effect Labels Component
const EffectLabels = () => (
  <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
    <div className="effects-labels">
      <div className="effect-label reverb-label">REVERB</div>
      <div className="effect-label delay-label">DELAY</div>
    </div>
  </div>
);

export const EffectLabelsComponent = () => <EffectLabels />;

// Toggle Sidebar Button Component
const ToggleSidebarButton = ({ active = false }) => {
  React.useEffect(() => {
    if (active) {
      document.body.classList.add('sidebar-visible');
    } else {
      document.body.classList.remove('sidebar-visible');
    }
    return () => {
      document.body.classList.remove('sidebar-visible');
    };
  }, [active]);

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
      <button id="toggle-sidebar-button"></button>
    </div>
  );
};

export const ToggleButtonOff = () => <ToggleSidebarButton />;
export const ToggleButtonOn = () => <ToggleSidebarButton active={true} />;

// Reset Button Component
const ResetButton = () => (
  <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
    <button id="reset-button">RESET</button>
  </div>
);

export const ResetButtonComponent = () => <ResetButton />;

// Instrument Label Component
const InstrumentLabel = ({ name, id }) => (
  <div style={{ padding: '40px', backgroundColor: '#f8f8f8' }}>
    <div className="instrument-label">{name}</div>
  </div>
);

export const HiHatLabel = () => <InstrumentLabel name="hi hat" id="hihat" />;
export const SnareLabel = () => <InstrumentLabel name="snare" id="snare" />;
export const KickLabel = () => <InstrumentLabel name="kick" id="kick" />;

export default {
  title: 'Components',
};
