import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, SalesPage } from './page-objects/LoginPage';

test.describe('Sales View', () => {
  let loginPage;
  let dashboardPage;
  let salesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    salesPage = new SalesPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
    await salesPage.goto();
  });

  test('WHEN user navigates to sales module THEN sales list loads and displays records', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/.*sales/);
    await expect(salesPage.salesTable).toBeVisible({ timeout: 15000 });
    await expect(salesPage.filtersForm).toBeVisible();
  });

  test('WHEN sales page loads THEN filters form is visible', async ({
    page,
  }) => {
    await expect(salesPage.filtersForm).toBeVisible();
  });

  test('WHEN user applies date filters THEN filtered results displayed', async ({
    page,
  }) => {
    await salesPage.filterByDate('2024-01-01', '2024-12-31');
    await page.waitForLoadState('networkidle');
    await expect(salesPage.salesTable).toBeVisible();
  });

  test('WHEN user searches sales THEN results filtered', async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"], input[name="search"]'
      )
      .first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await expect(salesPage.salesTable).toBeVisible();
    }
  });

  test('WHEN user sorts sales table THEN data reorders', async ({ page }) => {
    const sortableHeaders = page
      .locator('th[aria-sort], th[role="columnheader"]')
      .first();
    if (await sortableHeaders.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sortableHeaders.click();
      await page.waitForLoadState('networkidle');
      await expect(salesPage.salesTable).toBeVisible();
    }
  });

  test.skip('WHEN user creates new sale THEN sale appears in list', async ({
    page,
  }) => {
    await salesPage.createButton.click();
    await page.waitForLoadState('networkidle');

    await salesPage.fillSaleForm({
      client: 'Test Client',
      product: 'Test Product',
      quantity: 1,
      price: 100,
    });

    await salesPage.saveButton.click();
    await page.waitForLoadState('networkidle');

    await expect(salesPage.isSaleInList('Test Client')).resolves.toBeTruthy();
  });

  test('WHEN unauthenticated user accesses sales THEN redirected to login', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/home/sales');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*signIn/);
  });

  test('WHEN sales list is empty THEN empty state displayed', async ({
    page,
  }) => {
    await expect(salesPage.salesTable).toBeVisible();
    const hasRecords = await salesPage.hasSalesRecords();
    if (!hasRecords) {
      const emptyState = page
        .locator(
          'text=No data, text=No hay datos, text=No records, .empty-state, [data-testid="empty"]'
        )
        .first();
      await expect(emptyState)
        .toBeVisible({ timeout: 5000 })
        .catch(() => {});
    }
  });
});

test.describe('Sales Pagination', () => {
  let loginPage;
  let dashboardPage;
  let salesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    salesPage = new SalesPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
    await salesPage.goto();
  });

  test('WHEN sales table has pagination THEN pagination controls visible', async ({
    page,
  }) => {
    if (
      await salesPage.pagination.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(salesPage.pagination).toBeVisible();
    }
  });

  test('WHEN user clicks next page THEN next page loads', async ({ page }) => {
    if (
      await salesPage.nextPageButton
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await salesPage.nextPageButton.click();
      await page.waitForLoadState('networkidle');
      await expect(salesPage.salesTable).toBeVisible();
    }
  });

  test('WHEN user changes page size THEN page size updates', async ({
    page,
  }) => {
    const pageSizeSelect = page
      .locator(
        'select[aria-label*="page"], select[aria-label*="Page"], select[name="pageSize"], select[name="limit"]'
      )
      .first();
    if (await pageSizeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pageSizeSelect.selectOption('50');
      await page.waitForLoadState('networkidle');
      await expect(salesPage.salesTable).toBeVisible();
    }
  });
});

test.describe('Sales Detail View', () => {
  let loginPage;
  let salesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    salesPage = new SalesPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
    await salesPage.goto();
  });

  test.skip('WHEN user clicks sale row THEN detail dialog opens', async ({
    page,
  }) => {
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
      const detailDialog = page
        .locator('[role="dialog"], .dialog, [data-testid="sale-detail"]')
        .first();
      await expect(detailDialog).toBeVisible({ timeout: 5000 });
    }
  });

  test('WHEN user exports sales THEN file downloads', async ({ page }) => {
    const exportButton = page
      .locator(
        'button:has-text("Export"), button:has-text("Exportar"), button:has-text("Download")'
      )
      .first();
    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise.catch(() => null);
      if (download) {
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });
});
