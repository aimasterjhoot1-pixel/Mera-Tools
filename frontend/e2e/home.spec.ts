import { test, expect } from '@playwright/test';

test('homepage loads and displays tools', async ({ page }) => {
  await page.goto('/');

  // Check title
  await expect(page).toHaveTitle(/Mera Dost/);

  // Check main heading
  await expect(page.getByRole('heading', { name: /Mera Dost/i })).toBeVisible();

  // Check tool links
  await expect(page.getByRole('link', { name: /Edit PDF/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Convert/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Merge/i })).toBeVisible();
});

test('navigates to tool page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Edit PDF/i }).click();
  await expect(page).toHaveURL(/.*\/tools\/edit/);
});

