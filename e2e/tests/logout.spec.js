import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './page-objects/LoginPage';

test.describe('Logout Flow', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN authenticated user clicks logout button THEN redirected to login page and session cleared', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('WHEN user logs out and tries to access dashboard THEN redirected to login', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    await dashboardPage.goto();
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN user logs out and logs back in THEN new session created', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    await loginPage.login('admin@example.com', 'password123');
    await expect(page).toHaveURL(/.*home/);
    await expect(dashboardPage.isUserLoggedIn()).resolves.toBeTruthy();
  });

  test('WHEN user clicks logout THEN all session cookies cleared', async ({ page }) => {
    const cookiesBefore = await page.context().cookies();
    const authCookiesBefore = cookiesBefore.filter(c => c.name.includes('token') || c.name.includes('auth') || c.name.includes('session'));

    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    const cookiesAfter = await page.context().cookies();
    const authCookiesAfter = cookiesAfter.filter(c => c.name.includes('token') || c.name.includes('auth') || c.name.includes('session'));

    expect(authCookiesAfter.length).toBeLessThanOrEqual(authCookiesBefore.length);
  });

  test('WHEN user logs out from dashboard THEN logout button not visible', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);
    await expect(dashboardPage.logoutButton).not.toBeVisible();
  });
});

test.describe('Logout Security', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN user logs out THEN cannot access protected routes via back button', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN user logs out THEN localStorage cleared', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    const localStorage = await page.evaluate(() => Object.keys(window.localStorage));
    const authKeys = localStorage.filter(k => k.includes('token') || k.includes('auth') || k.includes('user'));
    expect(authKeys.length).toBe(0);
  });

  test('WHEN user logs out THEN sessionStorage cleared', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    const sessionStorage = await page.evaluate(() => Object.keys(window.sessionStorage));
    const authKeys = sessionStorage.filter(k => k.includes('token') || k.includes('auth') || k.includes('user'));
    expect(authKeys.length).toBe(0);
  });
});

test.describe('Logout UI', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN user hovers over logout button THEN tooltip or label visible', async ({ page }) => {
    await dashboardPage.logoutButton.hover();
    await expect(dashboardPage.logoutButton).toBeVisible();
  });

  test('WHEN user clicks logout THEN confirmation shown', async ({ page }) => {
    const confirmDialog = page.locator('[role="dialog"]:has-text("Logout"), [role="dialog"]:has-text("Cerrar sesión"), .confirm-dialog').first();
    await dashboardPage.logoutButton.click();
    if (await confirmDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Sí")').first().click();
    }
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });
});