import { test, expect } from '@playwright/test';

test.describe('Loop Machine UI', () => {
  test('renders primary controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'RESET' })).toBeVisible();
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('shows sequencer grid structure', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.beat-label')).toHaveCount(4);
    await expect(page.locator('.step-label')).toHaveCount(16);
  });
});
