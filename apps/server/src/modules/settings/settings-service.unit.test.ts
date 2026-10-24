import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Cobertura de los delegadores restantes del service de settings (Outcome A
 * del gate de cobertura server). Todos son traducciones delgadas sobre el dao:
 * el contrato que fijan es QUÉ payload recibe el dao (columnas planas,
 * `createdOn` solo en alta, `updatedOn` solo en actualización, ids normalizados
 * con `Number`), que es exactamente lo que Prisma rechazaría en runtime si se
 * construyera mal.
 *
 * El dao se mockea por completo: ningún camino toca Prisma ni la BD, y los
 * tipos se preservan con casts en los mocks (mismo patrón que
 * `settings-patch-display.unit.test.ts`).
 */

vi.mock('./dao.js', () => ({
  getSettingsById: vi.fn(),
  createOrUpdateSettingsLanguage: vi.fn(),
  createOrUpdateSettingsDisplay: vi.fn(),
  getAllProductCategories: vi.fn(),
  createProductCategory: vi.fn(),
  updateProductCategory: vi.fn(),
  deleteProductCategory: vi.fn(),
  patchSettingsById: vi.fn(),
}));

import {
  getSettingsById as getSettingsByIdDao,
  createOrUpdateSettingsLanguage as createOrUpdateSettingsLanguageDao,
  createOrUpdateSettingsDisplay as createOrUpdateSettingsDisplayDao,
  getAllProductCategories as getAllProductCategoriesDao,
  updateProductCategory as updateProductCategoryDao,
  deleteProductCategory as deleteProductCategoryDao,
} from './dao.js';
import {
  getSettingsById,
  createOrUpdateSettingsLanguage,
  createOrUpdateSettingsDisplay,
  getAllProductCategories,
  updateProductCategoryById,
  deleteProductCategoryById,
} from './service.js';
import type {
  ProductCategory,
  ProductCategoryServiceResult,
  Setting,
} from './types.js';

const mockedGetByIdDao = vi.mocked(getSettingsByIdDao);
const mockedLangDao = vi.mocked(createOrUpdateSettingsLanguageDao);
const mockedDisplayDao = vi.mocked(createOrUpdateSettingsDisplayDao);
const mockedCategoriesDao = vi.mocked(getAllProductCategoriesDao);
const mockedUpdateCategoryDao = vi.mocked(updateProductCategoryDao);
const mockedDeleteCategoryDao = vi.mocked(deleteProductCategoryDao);

describe('settings service – delegadores (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetByIdDao.mockResolvedValue({ id: 1 } as unknown as Setting);
    mockedLangDao.mockResolvedValue({ id: 1 } as unknown as Setting);
    mockedDisplayDao.mockResolvedValue({ id: 1 } as unknown as Setting);
    mockedCategoriesDao.mockResolvedValue(
      [] as unknown as ProductCategoryServiceResult
    );
    mockedUpdateCategoryDao.mockResolvedValue({} as unknown as ProductCategory);
    mockedDeleteCategoryDao.mockResolvedValue({} as unknown as ProductCategory);
  });

  it('getSettingsById normaliza el id y delega en el dao', async () => {
    await getSettingsById(4);

    expect(mockedGetByIdDao).toHaveBeenCalledExactlyOnceWith(4);
  });

  it('createOrUpdateSettingsLanguage en actualización envía updatedOn, no createdOn', async () => {
    await createOrUpdateSettingsLanguage({ id: 5, language: 'en' }, 7);

    expect(mockedLangDao).toHaveBeenCalledOnce();
    const [rowId, payload, user] = mockedLangDao.mock.calls[0];

    expect(rowId).toBe(5);
    expect(user).toBe(7);
    expect(payload).toEqual({
      language: 'en',
      updatedOn: expect.any(Date),
    });
    expect(payload).not.toHaveProperty('createdOn');
  });

  it('createOrUpdateSettingsLanguage en alta envía createdOn, no updatedOn', async () => {
    await createOrUpdateSettingsLanguage({ language: 'es' }, 7);

    expect(mockedLangDao).toHaveBeenCalledOnce();
    const [rowId, payload, user] = mockedLangDao.mock.calls[0];

    // `Number(undefined)` es NaN: el dao recibe el id normalizado, no undefined.
    expect(Number.isNaN(rowId)).toBe(true);
    expect(user).toBe(7);
    expect(payload).toEqual({
      language: 'es',
      createdOn: expect.any(Date),
    });
    expect(payload).not.toHaveProperty('updatedOn');
  });

  it('createOrUpdateSettingsDisplay en actualización despliega las opciones con updatedOn', async () => {
    await createOrUpdateSettingsDisplay(
      { id: 9, displayOptions: { displayEvents: true, displayNotes: false } },
      3
    );

    expect(mockedDisplayDao).toHaveBeenCalledOnce();
    const [rowId, payload, user] = mockedDisplayDao.mock.calls[0];

    expect(rowId).toBe(9);
    expect(user).toBe(3);
    // Columnas planas, NUNCA anidadas bajo `displayOptions`.
    expect(payload).toEqual({
      displayEvents: true,
      displayNotes: false,
      updatedOn: expect.any(Date),
    });
    expect(payload).not.toHaveProperty('createdOn');
    expect(payload).not.toHaveProperty('displayOptions');
  });

  it('createOrUpdateSettingsDisplay en alta despliega las opciones con createdOn', async () => {
    await createOrUpdateSettingsDisplay(
      { displayOptions: { displayStock: true } },
      3
    );

    expect(mockedDisplayDao).toHaveBeenCalledOnce();
    const [rowId, payload] = mockedDisplayDao.mock.calls[0];

    expect(Number.isNaN(rowId)).toBe(true);
    expect(payload).toEqual({
      displayStock: true,
      createdOn: expect.any(Date),
    });
    expect(payload).not.toHaveProperty('updatedOn');
  });

  it('updateProductCategoryById adjunta updatedOn y normaliza el id del filtro', async () => {
    await updateProductCategoryById(12, { description: 'Bebidas' });

    expect(mockedUpdateCategoryDao).toHaveBeenCalledOnce();
    const [updateData, where] = mockedUpdateCategoryDao.mock.calls[0];

    expect(updateData).toEqual({
      description: 'Bebidas',
      updatedOn: expect.any(Date),
    });
    expect(where).toEqual({ id: 12 });
  });

  it('deleteProductCategoryById normaliza el id antes de delegar', async () => {
    await deleteProductCategoryById(15);

    expect(mockedDeleteCategoryDao).toHaveBeenCalledExactlyOnceWith({ id: 15 });
  });

  it('getAllProductCategories pagina de forma segura y pasa filtros al dao', async () => {
    await getAllProductCategories({
      description: 'Viajes',
      limit: 5,
      page: 2,
    });

    expect(mockedCategoriesDao).toHaveBeenCalledExactlyOnceWith(
      'Viajes',
      undefined,
      5,
      5
    );
    // page 2 × limit 5 → skip 5, take 5; code sin filtro viaja como undefined.
  });
});
