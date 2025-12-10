import React, { useEffect, useRef } from 'react';
import '../style.css';

/**
 * Wrapper component that creates the loop machine DOM structure
 * matching the vanilla HTML/CSS implementation
 */
const LoopMachineUI = ({
  hihatNotes = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  snareNotes = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  kickNotes = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  hihatReverb = 0,
  hihatDelay = 0,
  snareReverb = 0,
  snareDelay = 0,
  kickReverb = 0,
  kickDelay = 0,
  isPlaying = false,
  sidebarVisible = false,
  currentStep = -1
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Apply sidebar visibility class to body
    if (sidebarVisible) {
      document.body.classList.add('sidebar-visible');
    } else {
      document.body.classList.remove('sidebar-visible');
    }

    return () => {
      document.body.classList.remove('sidebar-visible');
    };
  }, [sidebarVisible]);

  const instruments = [
    { name: 'hi hat', id: 'hihat', notes: hihatNotes, reverb: hihatReverb, delay: hihatDelay },
    { name: 'snare', id: 'snare', notes: snareNotes, reverb: snareReverb, delay: snareDelay },
    { name: 'kick', id: 'kick', notes: kickNotes, reverb: kickReverb, delay: kickDelay },
  ];

  return (
    <>
      {/* Sidebar */}
      <div id="sidebar">
        <div className="json-editor-title">JSON State</div>
        <pre>
          <code id="json-editor" contentEditable="true" spellCheck="false">
            {JSON.stringify({
              hihat: { notes: hihatNotes, reverb: hihatReverb, delay: hihatDelay },
              snare: { notes: snareNotes, reverb: snareReverb, delay: snareDelay },
              kick: { notes: kickNotes, reverb: kickReverb, delay: kickDelay }
            }, null, 2)}
          </code>
        </pre>
        <button id="apply-json-button">Apply Changes</button>
      </div>

      {/* Main Container */}
      <div className="main-container" ref={containerRef}>
        <div className="loop-machine">
          {/* Settings Container */}
          <div className="settings-container">
            <button id="toggle-sidebar-button"></button>
            <button id="reset-button">RESET</button>
          </div>

          {/* Controls - Play/Stop Button */}
          <div className="controls">
            <button id="play-stop-button" className={isPlaying ? 'playing' : ''}>
              <div className="button-text-line">START</div>
              <div className="button-separator"></div>
              <div className="button-text-line">STOP</div>
            </button>
          </div>

          {/* Sequencer */}
          <div className="sequencer">
            {/* Beat Labels (1-4) */}
            <div className="beat-labels">
              <div className="beat-label">1</div>
              <div className="beat-label">2</div>
              <div className="beat-label">3</div>
              <div className="beat-label">4</div>
            </div>

            {/* Measure Labels (1-16) */}
            <div className="measure-labels">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="step-label">{i + 1}</div>
              ))}
            </div>

            {/* Instrument Tracks */}
            <div className="instrument-tracks">
              {instruments.map(instrument => (
                <div
                  key={instrument.id}
                  className="instrument-track-row"
                  data-instrument={instrument.id}
                >
                  {/* Instrument Label */}
                  <div className="instrument-label">{instrument.name}</div>

                  {/* Note Buttons */}
                  <div className="notes-container">
                    {instrument.notes.map((isActive, stepIndex) => (
                      <button
                        key={stepIndex}
                        className={`note-button ${isActive ? 'active' : ''} ${stepIndex === currentStep ? 'playing-step' : ''} ${stepIndex % 4 === 0 ? 'beat-start' : ''}`}
                        data-step={stepIndex}
                      />
                    ))}
                  </div>

                  {/* Effect Sliders */}
                  <div className="sliders-container">
                    {/* Reverb Slider */}
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={instrument.reverb}
                        className="effect-slider reverb-slider"
                        data-effect="reverb"
                        readOnly
                      />
                    </div>

                    {/* Delay Slider */}
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={instrument.delay}
                        className="effect-slider delay-slider"
                        data-effect="delay"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Effects Labels */}
          <div className="effects-labels">
            <div className="effect-label reverb-label">REVERB</div>
            <div className="effect-label delay-label">DELAY</div>
          </div>
        </div>
      </div>
    </>
  );
};

// Default story - empty state
export const Default = () => <LoopMachineUI />;

// Story with some notes active
export const WithPattern = () => (
  <LoopMachineUI
    hihatNotes={[true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]}
    snareNotes={[false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]}
    kickNotes={[true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]}
  />
);

// Story with effects enabled
export const WithEffects = () => (
  <LoopMachineUI
    hihatNotes={[true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]}
    snareNotes={[false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]}
    kickNotes={[true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]}
    hihatReverb={3}
    hihatDelay={5}
    snareReverb={7}
    snareDelay={2}
    kickReverb={4}
    kickDelay={6}
  />
);

// Story showing playing state
export const Playing = () => (
  <LoopMachineUI
    hihatNotes={[true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]}
    snareNotes={[false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]}
    kickNotes={[true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]}
    isPlaying={true}
    currentStep={4}
  />
);

// Story with sidebar visible
export const WithSidebar = () => (
  <LoopMachineUI
    hihatNotes={[true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]}
    snareNotes={[false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]}
    kickNotes={[true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]}
    hihatReverb={3}
    hihatDelay={2}
    sidebarVisible={true}
  />
);

// Story showing a complex pattern
export const ComplexPattern = () => (
  <LoopMachineUI
    hihatNotes={[true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]}
    snareNotes={[false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true]}
    kickNotes={[true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false]}
    hihatReverb={2}
    snareReverb={8}
    snareDelay={4}
    kickDelay={3}
  />
);

// Story for testing all buttons active
export const AllNotesActive = () => (
  <LoopMachineUI
    hihatNotes={Array(16).fill(true)}
    snareNotes={Array(16).fill(true)}
    kickNotes={Array(16).fill(true)}
    hihatReverb={10}
    hihatDelay={10}
    snareReverb={10}
    snareDelay={10}
    kickReverb={10}
    kickDelay={10}
  />
);

// Story for testing empty state
export const EmptyState = () => (
  <LoopMachineUI
    hihatNotes={Array(16).fill(false)}
    snareNotes={Array(16).fill(false)}
    kickNotes={Array(16).fill(false)}
    hihatReverb={0}
    hihatDelay={0}
    snareReverb={0}
    snareDelay={0}
    kickReverb={0}
    kickDelay={0}
  />
);

export default {
  title: 'Loop Machine',
};
