import { test, expect } from '@playwright/test';

test.describe('APP-USER Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app-user base URL
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    // Placeholder test - update when app-user is implemented
    await expect(page).toHaveTitle(/BThwani/i);
  });

  test('should have accessible navigation', async ({ page }) => {
    // Placeholder test - verify navigation structure when implemented
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should support RTL layout', async ({ page }) => {
    // Verify RTL support as per engineering guidelines
    const html = page.locator('html');
    const dir = await html.getAttribute('dir');
    expect(dir).toBe('rtl');
  });
});
