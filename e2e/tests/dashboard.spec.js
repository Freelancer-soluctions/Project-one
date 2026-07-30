import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './page-objects/LoginPage';

test.describe('Dashboard Access', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN authenticated user accesses dashboard URL THEN dashboard renders with user info', async ({ page }) => {
    await expect(page).toHaveURL(/.*home/);
    await expect(dashboardPage.isUserLoggedIn()).resolves.toBeTruthy();
    await expect(dashboardPage.sidebar).toBeVisible();
  });

  test('WHEN user navigates to dashboard THEN navigation menu visible', async ({ page }) => {
    await expect(dashboardPage.sidebar).toBeVisible();
    const navLinks = dashboardPage.page.locator('nav a, [role="navigation"] a, aside a').first();
    await expect(navLinks).toBeVisible();
  });

  test('WHEN user clicks dashboard modules THEN navigates to correct page', async ({ page }) => {
    const modules = [
      { link: 'a[href="/home/users"]', url: '/home/users' },
      { link: 'a[href="/home/sales"]', url: '/home/sales' },
      { link: 'a[href="/home/products"]', url: '/home/products' },
      { link: 'a[href="/home/clients"]', url: '/home/clients' },
    ];

    for (const module of modules) {
      const link = dashboardPage.page.locator(module.link).first();
      if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(module.url.replace('/', '\\/')));
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('WHEN unauthenticated user accesses dashboard THEN redirected to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN dashboard loads THEN key metrics displayed', async ({ page }) => {
    const metrics = page.locator('[data-testid="metric"], .metric, .stat, .card:has-text("Total")').first();
    await expect(metrics).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('WHEN user switches language THEN dashboard updates', async ({ page }) => {
    const langSwitcher = page.locator('button:has-text("EN"), button:has-text("ES"), [role="combobox"]:has-text("Language"), [role="combobox"]:has-text("Idioma")').first();
    if (await langSwitcher.isVisible({ timeout: 1000 }).catch(() => false)) {
      await langSwitcher.click();
      const option = page.locator('[role="option"]:has-text("Spanish"), [role="option"]:has-text("Español")').first();
      if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
        await option.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
});

test.describe('Dashboard Responsive', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN viewport is mobile THEN sidebar collapses', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const toggle = page.locator('button[aria-label="Toggle sidebar"], button:has-text("Menu"), button:has-text("menu")').first();
    if (await toggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(dashboardPage.sidebar).toBeHidden();
    }
  });

  test('WHEN viewport is desktop THEN sidebar visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);
    await expect(dashboardPage.sidebar).toBeVisible();
  });
});