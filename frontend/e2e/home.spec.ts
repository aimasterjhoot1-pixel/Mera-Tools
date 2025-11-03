import { test, expect } from '@playwright/test';

test('homepage loads and displays tools', async ({ page }) => {
  await page.goto('/');

  // Check title
  await expect(page).toHaveTitle(/Mera Tool/);

  // Check main heading - use more specific selector to avoid strict mode violation
  await expect(page.getByRole('heading', { name: /Mera Tool - PDF Toolkit/i })).toBeVisible();

  // Check tool links
  await expect(page.getByRole('link', { name: /Edit PDF/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Convert/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Merge/i }).first()).toBeVisible();
});

test('navigates to tool page', async ({ page }) => {
  await page.goto('/');
  // Use first() to handle multiple links with same text
  await page.getByRole('link', { name: /Edit PDF/i }).first().click();
  await expect(page).toHaveURL(/.*\/tools\/edit/);
});

