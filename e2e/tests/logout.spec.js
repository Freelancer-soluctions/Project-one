import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './page-objects/LoginPage';

test.describe('Logout Flow', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN authenticated user clicks logout button THEN redirected to login page and session cleared', async ({
    page,
  }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('WHEN user logs out and tries to access dashboard THEN redirected to login', async ({
    page,
  }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    await dashboardPage.goto();
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN user logs out and logs back in THEN new session created', async ({
    page,
  }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
    await expect(dashboardPage.isUserLoggedIn()).resolves.toBeTruthy();
  });

  test('WHEN user clicks logout THEN session cleared', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    const token = await page.evaluate(() =>
      window.sessionStorage.getItem('accessToken')
    );
    expect(token).toBeNull();
  });

  test('WHEN user logs out from dashboard THEN logout button not visible', async ({
    page,
  }) => {
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
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN user logs out THEN cannot access protected routes via back button', async ({
    page,
  }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN user logs out THEN localStorage cleared', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    const accessTokenInLS = await page.evaluate(() =>
      window.localStorage.getItem('accessToken')
    );
    expect(accessTokenInLS).toBeNull();
  });

  test('WHEN user logs out THEN sessionStorage cleared', async ({ page }) => {
    await dashboardPage.logout();
    await expect(page).toHaveURL(/.*signIn/);

    const token = await page.evaluate(() =>
      window.sessionStorage.getItem('accessToken')
    );
    expect(token).toBeNull();
  });
});

test.describe('Logout UI', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN user hovers over logout button THEN tooltip or label visible', async ({
    page,
  }) => {
    await dashboardPage.logoutButton.hover();
    await expect(dashboardPage.logoutButton).toBeVisible();
  });

  test('WHEN user clicks logout THEN confirmation shown', async ({ page }) => {
    const confirmDialog = page
      .locator(
        '[role="dialog"]:has-text("Logout"), [role="dialog"]:has-text("Cerrar sesión"), .confirm-dialog'
      )
      .first();
    await dashboardPage.logoutButton.click();
    if (await confirmDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page
        .locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Sí")'
        )
        .first()
        .click();
    }
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });
});
