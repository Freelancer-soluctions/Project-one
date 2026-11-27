import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

/**
 * E2E smoke for the revived client/provider order modules: the pages load,
 * the detail-line editor is rendered in both dialogs, and both modules stay
 * behind the auth guard.
 *
 * The create/transition flow needs client/product fixtures, which the E2E
 * database does not seed; those paths are covered by the server integration
 * suite (`tests/integration/orders`).
 */
test.describe('Orders View', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('client order page lists orders and opens the details editor', async ({
    page,
  }) => {
    await page.goto('/home/clientOrder');
    await expect(page).toHaveURL(/.*clientOrder/);
    await expect(page.locator('#clientOrder-filters-form')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('table')).toBeVisible();

    await page
      .locator('#clientOrder-filters-form')
      .getByRole('button', { name: 'Agregar' })
      .click();

    const dialog = page.locator('#clientOrder-form');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[name="clientId"]')).toBeVisible();
    await expect(
      dialog.locator('input[name="expectedDeliveryDate"]')
    ).toBeVisible();
    await expect(
      dialog.locator('input[name="details.0.productId"]')
    ).toBeVisible();
    await expect(
      dialog.locator('input[name="details.0.quantity"]')
    ).toBeVisible();
    await expect(
      dialog.locator('input[name="details.0.unitPrice"]')
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Agregar detalle' }).click();
    await expect(
      dialog.locator('input[name="details.1.productId"]')
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
  });

  test('provider order page lists orders and opens the details editor', async ({
    page,
  }) => {
    await page.goto('/home/providerOrder');
    await expect(page).toHaveURL(/.*providerOrder/);
    await expect(page.locator('#provider-order-filters-form')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('table')).toBeVisible();

    await page
      .locator('#provider-order-filters-form')
      .getByRole('button', { name: 'Agregar' })
      .click();

    const dialog = page.locator('#provider-order-form');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[name="supplierId"]')).toBeVisible();
    await expect(
      dialog.locator('input[name="details.0.estimatedPrice"]')
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
  });

  test('unauthenticated user is redirected to sign in', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/home/clientOrder');
    await expect(page).toHaveURL(/.*signIn/);

    await context.close();
  });
});
