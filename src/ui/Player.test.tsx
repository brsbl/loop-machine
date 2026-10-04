import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { STOPPED } from '../engine/engine'
import { PRESETS } from '../session/library'
import { defaultSession } from '../session/schema'
import { createSessionStore } from '../session/store'
import { decodeSession } from '../session/url'
import { Player } from './Player'

const renderPlayer = (link: string | null, isPlaying = false) => {
  const store = createSessionStore(link ? decodeSession(link) : defaultSession())
  const onStartStop = vi.fn()
  render(<Player store={store} playhead={STOPPED} isPlaying={isPlaying} onStartStop={onStartStop} />)
  return { store, onStartStop }
}

describe('Player', () => {
  it('plays and switches loops, with nothing to edit', async () => {
    const user = userEvent.setup()
    const { onStartStop } = renderPlayer(PRESETS[0].link)
    expect(screen.getByText(PRESETS[0].name)).toBeInTheDocument()
    expect(screen.queryAllByRole('slider')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /step/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'START' }))
    expect(onStartStop).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('radio', { name: PRESETS[4].name }))
    expect(screen.getByText(PRESETS[4].name)).toBeInTheDocument()
  })

  it('names a loop that is not one of the six a shared loop', () => {
    renderPlayer('8888080880a2_000500')
    expect(screen.getByText('Shared loop')).toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true)
  })

  it('shows STOP while playing', () => {
    renderPlayer(PRESETS[0].link, true)
    expect(screen.getByRole('button', { name: 'STOP' })).toBeInTheDocument()
  })
})
