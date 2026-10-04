import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { LedChoice, PlainKey } from './LedButton'

const OPTIONS = [
  { value: 'a', content: 'A', name: 'Alpha' },
  { value: 'b', content: 'B', name: 'Bravo' },
  { value: 'c', content: 'C', name: 'Charlie' },
]

function Choice() {
  const [value, setValue] = useState('b')
  return (
    <>
      <button type="button">before</button>
      <LedChoice label="TEST" options={OPTIONS} value={value} onChange={setValue} />
    </>
  )
}

describe('LedChoice', () => {
  it('is one Tab stop that lands on the lit key', async () => {
    const user = userEvent.setup()
    render(<Choice />)
    await user.click(screen.getByText('before'))
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Bravo' })).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  it('moves and selects with arrows, wrapping, and jumps with Home and End', async () => {
    const user = userEvent.setup()
    render(<Choice />)
    screen.getByRole('radio', { name: 'Bravo' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Charlie' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Charlie' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'Charlie' })).toHaveFocus()
    await user.keyboard('{Home}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Charlie' })).toHaveAttribute('aria-checked', 'true')
  })
})

function Undo() {
  const [left, setLeft] = useState(1)
  return (
    <PlainKey label="Undo" title="Undo" disabled={left === 0} onPress={() => setLeft((n) => n - 1)}>
      {left}
    </PlainKey>
  )
}

describe('PlainKey', () => {
  it('keeps focus and ignores presses once disabled', async () => {
    const user = userEvent.setup()
    render(<Undo />)
    const key = screen.getByRole('button', { name: 'Undo' })
    key.focus()

    await user.keyboard('{Enter}')
    expect(key).toHaveAttribute('aria-disabled', 'true')
    expect(key).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(key).toHaveTextContent('0')
  })
})
