import { memo } from 'react'

const Pad = memo(function Pad({ active, playing, isBeatStart, onClick }) {
  const classNames = [
    'note-button',
    active ? 'active' : '',
    playing ? 'playing-step' : '',
    isBeatStart ? 'beat-start' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classNames}
      onClick={onClick}
    />
  )
})

export default Pad
