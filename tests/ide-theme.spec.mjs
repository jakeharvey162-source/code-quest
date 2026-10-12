import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dark designer properties, file tabs and XP remain readable and preserve edits when switched to light', async ({ page }) => {
  await page.goto('/#designer');
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await page.getByRole('button', { name: 'Label', exact: true }).dblclick();
  await page.getByRole('button', { name: 'Select label1', exact: true }).click();
  const properties = page.getByRole('complementary', { name: 'WinForms Properties panel', exact: true });
  await properties.getByLabel('Control Text', { exact: true }).fill('Student name');
  const result = await new AxeBuilder({ page })
    .include('.properties-panel')
    .include('.workspace-tabs')
    .include('.header-stats')
    .withRules(['color-contrast'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
  await expect(properties.getByLabel('Control Text', { exact: true })).toHaveValue('Student name');
  await expect(page.getByRole('button', { name: 'Switch to dark mode', exact: true })).toBeVisible();
});
