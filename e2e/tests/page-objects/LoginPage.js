export class LoginPage {
  constructor(page) {
    this.page = page;
    this.url = '/signIn';
    this.emailInput = page
      .locator('input[id="email"], input[name="email"], input[type="email"]')
      .first();
    this.passwordInput = page
      .locator(
        'input[id="password"], input[name="password"], input[type="password"]'
      )
      .first();
    this.submitButton = page.locator('button[type="submit"]').first();
    this.errorMessage = page
      .locator(
        '[role="alert"], .text-destructive, .text-red-500, :text-matches("invalid|incorrect|no registrado|incorrecto|credenciales", "i")'
      )
      .first();
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible().catch(() => false);
  }
}

export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.url = '/home';
    this.userInfo = page
      .locator(
        'img[alt*="Avatar"], img[alt*="avatar"], span:has-text("User menu"), [data-testid="user-info"]'
      )
      .first();
    this.logoutButton = page
      .locator(
        'a:has-text("Logout"), a:has-text("logout"), a:has-text("Cerrar sesión"), a:has-text("cerrar sesión"), [data-testid="logout"]'
      )
      .first();
    this.sidebar = page
      .locator('nav, aside, [role="navigation"], .sidebar')
      .first();
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async isUserLoggedIn() {
    return await this.userInfo.isVisible().catch(() => false);
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToUsers() {
    await this.page.goto('/home/users');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSales() {
    await this.page.goto('/home/sales');
    await this.page.waitForLoadState('networkidle');
  }
}

export class UsersPage {
  constructor(page) {
    this.page = page;
    this.url = '/home/users';
    this.createButton = page
      .locator(
        'button:has-text("Create"), button:has-text("Add"), button:has-text("Nuevo"), button:has-text("Crear")'
      )
      .first();
    this.userTable = page.locator('table, [role="table"], .datatable').first();
    this.nameInput = page
      .locator('input[name="name"], input[id="name"]')
      .first();
    this.emailInput = page
      .locator('input[name="email"], input[id="email"]')
      .first();
    this.saveButton = page
      .locator(
        'button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Guardar")'
      )
      .first();
    this.closeDialog = page
      .locator(
        'button:has-text("Cancel"), button:has-text("Cancelar"), [aria-label="Close"]'
      )
      .first();
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async createUser(userData) {
    await this.createButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.nameInput.fill(userData.name);
    await this.emailInput.fill(userData.email);
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isUserInList(email) {
    const row = this.page.locator(`tr:has-text("${email}")`).first();
    return await row.isVisible().catch(() => false);
  }
}

export class SalesPage {
  constructor(page) {
    this.page = page;
    this.url = '/home/sales';
    this.salesTable = page.locator('table, [role="table"], .datatable').first();
    this.salesRows = page.locator('tbody tr, [role="row"]').first();
    this.filtersForm = page.locator('form, [role="form"]').first();
    this.createButton = page
      .locator(
        'button:has-text("Create"), button:has-text("Add"), button:has-text("Nuevo"), button:has-text("Crear")'
      )
      .first();
    this.dateFromInput = page
      .locator(
        'input[name="dateFrom"], input[name="startDate"], input[id="dateFrom"]'
      )
      .first();
    this.dateToInput = page
      .locator(
        'input[name="dateTo"], input[name="endDate"], input[id="dateTo"]'
      )
      .first();
    this.filterSubmitButton = page
      .locator(
        'button[type="submit"]:has-text("Filter"), button:has-text("Filtrar"), button:has-text("Buscar")'
      )
      .first();
    this.pagination = page
      .locator(
        '[role="navigation"]:has(button:has-text("Next")), .pagination, [data-testid="pagination"]'
      )
      .first();
    this.nextPageButton = page
      .locator(
        'button:has-text("Next"), button:has-text("Siguiente"), [aria-label="Next page"]'
      )
      .first();
    this.saveButton = page
      .locator(
        'button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Guardar")'
      )
      .first();
    this.clientSelect = page
      .locator('select[name="clientId"], select[name="client"]')
      .first();
    this.productSelect = page
      .locator('select[name="productId"], select[name="product"]')
      .first();
    this.quantityInput = page
      .locator('input[name="quantity"], input[name="qty"]')
      .first();
    this.priceInput = page
      .locator('input[name="price"], input[name="unitPrice"]')
      .first();
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async isSalesListLoaded() {
    return await this.salesTable.isVisible().catch(() => false);
  }

  async hasSalesRecords() {
    const rows = await this.salesRows.count();
    return rows > 0;
  }

  async filterByDate(fromDate, toDate) {
    if (
      await this.dateFromInput.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await this.dateFromInput.fill(fromDate);
      await this.dateToInput.fill(toDate);
      await this.filterSubmitButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async isSaleInList(clientName) {
    const row = this.page.locator(`tr:has-text("${clientName}")`).first();
    return await row.isVisible().catch(() => false);
  }

  async fillSaleForm(saleData) {
    if (
      await this.clientSelect.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await this.clientSelect
        .selectOption({ label: saleData.client })
        .catch(() => {});
    }
    if (
      await this.productSelect.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await this.productSelect
        .selectOption({ label: saleData.product })
        .catch(() => {});
    }
    if (
      await this.quantityInput.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await this.quantityInput.fill(String(saleData.quantity));
    }
    if (await this.priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.priceInput.fill(String(saleData.price));
    }
  }
}
