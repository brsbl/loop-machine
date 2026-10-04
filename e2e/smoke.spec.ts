import { expect, test, type Page } from '@playwright/test'

/** Page errors and console errors seen while the test runs. */
function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

const pressedSteps = (page: Page, row: string) =>
  page.locator(`button[aria-label^="${row} step "][aria-pressed="true"]`).evaluateAll((keys) =>
    keys.map((k) => Number(k.getAttribute('aria-label')!.split(' ').pop())),
  )

test('opens on the first pattern without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await expect(page.getByRole('radio', { name: 'Deep Night' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByLabel('Tempo in BPM')).toHaveValue('122')
  expect(errors).toEqual([])
})

test('plays, moves the playhead, and stops', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()

  const playhead = page.locator('[aria-current="step"]').first()
  await expect(playhead).toBeVisible()
  const first = await playhead.getAttribute('aria-label')
  await expect.poll(() => playhead.getAttribute('aria-label')).not.toBe(first)

  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(page.locator('[aria-current="step"]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('switches patterns and keeps them through a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'Jack Box' }).click()
  await expect(page.getByLabel('Tempo in BPM')).toHaveValue('124')
  // The share link trails edits by a moment.
  await expect(page).toHaveURL(/[?&]s=2~124~/)
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Jack Box' })).toHaveAttribute('aria-checked', 'true')
})

test('loads share links from every format', async ({ page }) => {
  // Previous app, Jul–Dec 2025: steps plus one-digit knobs.
  await page.goto('/?s=8888080880a2_000500')
  expect(await pressedSteps(page, 'KICK')).toEqual([1, 9, 11, 15])

  // Previous app, Dec 2025 on: steps, knobs, tempo.
  await page.goto('/?s=8888080880a2_cc0000cc3300cc00ff_098')
  expect(await pressedSteps(page, 'HI-HAT')).toEqual([1, 5, 9, 13])
  await expect(page.getByLabel('Tempo in BPM')).toHaveValue('098')

  // Current format.
  await page.goto('/?s=2~124~hihat.2222.990099~snare.0808.cc3380~kick.8888.e60066~syn.db6d.044880.b.16.s.9f.0')
  await expect(page.getByRole('radio', { name: 'French Filter' })).toHaveAttribute('aria-checked', 'true')
})

test('undo steps back a change', async ({ page }) => {
  await page.goto('/')
  const step = page.getByRole('button', { name: 'KICK step 2', exact: true })
  await step.click()
  await expect(step).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ControlOrMeta+Z')
  await expect(step).toHaveAttribute('aria-pressed', 'false')
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('shows a listening player that plays and switches loops', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'KICK step 1', exact: true })).toHaveCount(0)
    await expect(page.getByText('Deep Night')).toBeVisible()

    await page.getByRole('button', { name: 'START' }).tap()
    await expect(page.getByRole('button', { name: 'STOP' })).toBeVisible()
    await expect(page.locator('[data-now="true"]').first()).toBeAttached()
    await page.getByRole('button', { name: 'STOP' }).tap()
    await expect(page.locator('[data-now="true"]')).toHaveCount(0)

    await page.getByRole('radio', { name: 'Warehouse' }).tap()
    await expect(page.getByText('Warehouse')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
})
