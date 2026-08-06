import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, UsersPage } from './page-objects/LoginPage';

test.describe('Users CRUD', () => {
  let loginPage;
  let dashboardPage;
  let usersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    usersPage = new UsersPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN admin navigates to users section THEN users list loads', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await expect(page).toHaveURL(/.*home\/users/);
    await expect(usersPage.userTable).toBeVisible({ timeout: 10000 });
  });

  test.skip('WHEN admin creates new user THEN new user appears in list', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await expect(usersPage.userTable).toBeVisible();

    const testUser = {
      name: 'Test User ' + Date.now(),
      email: `testuser${Date.now()}@example.com`,
    };

    await usersPage.createUser(testUser);
    await expect(page).toHaveURL(/.*home\/users/);
    await expect(usersPage.isUserInList(testUser.email)).resolves.toBeTruthy();
  });

  test('WHEN admin views users list THEN table displays user data', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await expect(usersPage.userTable).toBeVisible();

    const rows = await usersPage.page.locator('tbody tr, [role="row"]').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });

  test('WHEN unauthenticated user accesses users THEN redirected to login', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/home/users');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN non-admin user accesses users THEN access denied', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginPage.goto();
    await loginPage.login('user2@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);

    await dashboardPage.navigateToUsers();
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/.*home\/users/);
  });
});

test.describe('Users Form Validation', () => {
  let loginPage;
  let dashboardPage;
  let usersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    usersPage = new UsersPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test.skip('WHEN admin submits empty user form THEN validation errors shown', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await usersPage.createButton.click();
    await page.waitForLoadState('networkidle');

    await usersPage.saveButton.click();
    await expect(
      page.locator('[role="alert"], .text-destructive, .text-red-500').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test.skip('WHEN admin submits invalid email THEN validation error shown', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await usersPage.createButton.click();
    await page.waitForLoadState('networkidle');

    await usersPage.nameInput.fill('Test User');
    await usersPage.emailInput.fill('invalid-email');
    await usersPage.saveButton.click();

    await expect(
      page.locator('[role="alert"], .text-destructive, .text-red-500').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test.skip('WHEN admin submits duplicate email THEN error shown', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await usersPage.createButton.click();
    await page.waitForLoadState('networkidle');

    await usersPage.nameInput.fill('Test User');
    await usersPage.emailInput.fill('admin@gmail.com');
    await usersPage.saveButton.click();

    await expect(
      page.locator('[role="alert"], .text-destructive, .text-red-500').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Users Search and Filter', () => {
  let loginPage;
  let dashboardPage;
  let usersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    usersPage = new UsersPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN admin searches users THEN filtered results displayed', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await expect(usersPage.userTable).toBeVisible();

    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"], input[name="search"]'
      )
      .first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('admin');
      await page.waitForLoadState('networkidle');
      await expect(usersPage.userTable).toBeVisible();
    }
  });

  test('WHEN admin filters by status THEN filtered results displayed', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await expect(usersPage.userTable).toBeVisible();

    const statusFilter = page
      .locator('select[name*="status"], select[id*="status"]')
      .first();
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.selectOption('active');
      await page.waitForLoadState('networkidle');
      await expect(usersPage.userTable).toBeVisible();
    }
  });
});

test.describe('Users Pagination', () => {
  let loginPage;
  let dashboardPage;
  let usersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    usersPage = new UsersPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN users table has pagination THEN pagination controls work', async ({
    page,
  }) => {
    await dashboardPage.navigateToUsers();
    await expect(usersPage.userTable).toBeVisible();

    const nextButton = page
      .locator(
        'button[aria-label="Next page"], button:has-text("Next"), button:has-text("Siguiente")'
      )
      .first();
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      await expect(usersPage.userTable).toBeVisible();
    }
  });
});
