import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

const EMPLOYEE_FORM_ERRORS = {
  es: {
    title: 'Agregar empleado',
    name: 'El nombre del empleado es obligatorio.',
    position: 'La posición es obligatoria.',
    department: 'El departamento es obligatorio.',
  },
  en: {
    title: 'Add employee',
    name: 'Employee name is required.',
    position: 'Position is required.',
    department: 'Department is required.',
  },
};

/** Abre el diálogo de alta de empleado desde /home/employees. */
async function openAddEmployeeDialog(page) {
  await page.goto('/home/employees');
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('button', { name: /^(Agregar|Add)$/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Cambia el idioma de la aplicación desde Configuración. */
async function changeLanguage(page, language) {
  await page.goto('/home/settings');
  await page
    .getByRole('tab', { name: /^(Idioma|Language)$/ })
    .first()
    .click();
  await page.getByRole('combobox').first().click();
  const optionName =
    language === 'en' ? /^(Inglés|English)$/ : /^(Español|Spanish)$/;
  await page.getByRole('option', { name: optionName }).click();
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByRole('tab', {
      name: language === 'en' ? /^Language$/ : /^Idioma$/,
    })
  ).toBeVisible();
}

/** Envía el formulario vacío del diálogo. */
async function submitEmptyForm(dialog) {
  await dialog.getByRole('button', { name: /^(Guardar|Save)$/ }).click();
}

test.describe('Employee form validation', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@gmail.com', '123456');
    await expect(page).toHaveURL(/.*home/);
  });

  test('WHEN admin submits an empty employee form THEN inline errors are shown and nothing is sent', async ({
    page,
  }) => {
    const dialog = await openAddEmployeeDialog(page);
    await expect(
      dialog.getByRole('heading', {
        name: /^(Agregar empleado|Add employee)$/,
      })
    ).toBeVisible();

    const requests = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') requests.push(request.url());
    });

    await submitEmptyForm(dialog);

    await expect(dialog.locator('#name')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(dialog.locator('#positionId')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(dialog.locator('#departmentId')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(dialog.locator('p.text-destructive')).toHaveCount(7);

    expect(requests.filter((url) => url.includes('/employees'))).toEqual([]);
    await expect(dialog).toBeVisible();
  });

  test('WHEN the language changes THEN the same errors are translated', async ({
    page,
  }) => {
    test.setTimeout(120000);

    try {
      await changeLanguage(page, 'es');
      let dialog = await openAddEmployeeDialog(page);
      await submitEmptyForm(dialog);
      await expect(
        dialog.getByText(EMPLOYEE_FORM_ERRORS.es.name)
      ).toBeVisible();
      await expect(
        dialog.getByText(EMPLOYEE_FORM_ERRORS.es.position)
      ).toBeVisible();
      await expect(
        dialog.getByText(EMPLOYEE_FORM_ERRORS.es.department)
      ).toBeVisible();
      await dialog.getByRole('button', { name: /^(Cancelar|Cancel)$/ }).click();

      await changeLanguage(page, 'en');
      dialog = await openAddEmployeeDialog(page);
      await submitEmptyForm(dialog);
      await expect(
        dialog.getByText(EMPLOYEE_FORM_ERRORS.en.name)
      ).toBeVisible();
      await expect(
        dialog.getByText(EMPLOYEE_FORM_ERRORS.en.position)
      ).toBeVisible();
      await expect(
        dialog.getByText(EMPLOYEE_FORM_ERRORS.en.department)
      ).toBeVisible();
      await expect(
        dialog.getByRole('heading', { name: EMPLOYEE_FORM_ERRORS.en.title })
      ).toBeVisible();
    } finally {
      // El idioma es una preferencia persistida por usuario: restaurarlo
      // evita dejar la suite (y la app) en inglés si el test falla.
      await changeLanguage(page, 'es').catch(() => {});
    }
  });
});
