import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TempoControl } from './TempoControl'

describe('TempoControl', () => {
  it('applies a typed tempo on Enter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TempoControl bpm={120} onChange={onChange} />)
    await user.click(screen.getByLabelText('Tempo in BPM'))
    await user.keyboard('130{Enter}')
    expect(onChange).toHaveBeenCalledWith(130)
  })

  it('drops a typed tempo on Escape', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TempoControl bpm={120} onChange={onChange} />)
    const input = screen.getByLabelText('Tempo in BPM')
    await user.click(input)
    await user.keyboard('150{Escape}')
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('120')
  })
})
