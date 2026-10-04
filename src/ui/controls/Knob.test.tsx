import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Knob } from './Knob'

function Harness() {
  const [value, setValue] = useState(0.5)
  return <Knob value={value} onChange={setValue} label="Test knob" />
}

const notch = () => Number(screen.getByRole('slider', { name: 'Test knob' }).getAttribute('aria-valuenow'))
const wheel = (init: WheelEventInit) => fireEvent(screen.getByRole('slider', { name: 'Test knob' }), new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }))

describe('Knob wheel', () => {
  it('turns one notch per mouse-wheel click', () => {
    render(<Harness />)
    wheel({ deltaY: 100 })
    expect(notch()).toBe(4)
    wheel({ deltaY: -100 })
    wheel({ deltaY: -100 })
    expect(notch()).toBe(6)
  })

  it('adds up small trackpad deltas instead of jumping a notch per event', () => {
    render(<Harness />)
    // 30 px of scrolling stays put; reaching 40 px turns one notch.
    for (let i = 0; i < 6; i++) wheel({ deltaY: 5 })
    expect(notch()).toBe(5)
    for (let i = 0; i < 2; i++) wheel({ deltaY: 5 })
    expect(notch()).toBe(4)
  })

  it('ignores sideways swipes', () => {
    render(<Harness />)
    wheel({ deltaX: 80, deltaY: 0 })
    expect(notch()).toBe(5)
  })
})
