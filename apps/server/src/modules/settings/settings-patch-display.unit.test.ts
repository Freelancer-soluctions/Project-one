import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regresión de `server-ts-latent-defects`, fix 2 (endpoint roto).
 *
 * `PATCH /settings/:id` construía `updateData.displayOptions = displayOptions`
 * y lo pasaba al dao. El modelo `settings` NO tiene columna `displayOptions`
 * (son 8 columnas planas: `displayEvents`…`displayStock`), así que
 * `prisma.settings.update` rechazaba la clave en runtime. El compilador no lo
 * detectó porque `updateData` es una variable (sin excess-property check).
 *
 * El aplanado vive en el service (como en el create/upsert) y este test lo
 * fija sobre el mock del dao: es el único instrumento que ve el payload final.
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

import { patchSettingsById as patchSettingsByIdDao } from './dao.js';
import { patchSettingsById } from './service.js';
import type { Setting } from './types.js';

const mockedPatchDao = vi.mocked(patchSettingsByIdDao);

/** Llamada capturada del dao (estrecha el `undefined` de `calls[0]`). */
const firstDaoCall = () => {
  const call = mockedPatchDao.mock.calls[0];
  if (!call) throw new Error('patchSettingsByIdDao was not called');
  return call;
};

describe('settings service – patchSettingsById aplana displayOptions (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPatchDao.mockResolvedValue({ id: 9 } as unknown as Setting);
  });

  it('convierte displayOptions anidado en columnas planas y preserva language', async () => {
    await patchSettingsById(9, {
      language: 'en',
      displayOptions: { displayEvents: true, displayNotes: false },
    });

    expect(mockedPatchDao).toHaveBeenCalledOnce();
    const [id, payload] = firstDaoCall();

    expect(id).toBe(9);
    // Exactamente columnas planas + language: ni `displayOptions` ni nada extra.
    expect(payload).toEqual({
      language: 'en',
      displayEvents: true,
      displayNotes: false,
    });
    expect(payload).not.toHaveProperty('displayOptions');
  });

  it('despliega las 8 columnas de display cuando llegan todas', async () => {
    await patchSettingsById(9, {
      displayOptions: {
        displayEvents: true,
        displayNotes: true,
        displayNews: false,
        displayProfile: true,
        displayLanguage: true,
        displayReports: false,
        displayPayroll: false,
        displayStock: true,
      },
    });

    const [, payload] = firstDaoCall();

    expect(payload).toEqual({
      displayEvents: true,
      displayNotes: true,
      displayNews: false,
      displayProfile: true,
      displayLanguage: true,
      displayReports: false,
      displayPayroll: false,
      displayStock: true,
    });
    expect(Object.keys(payload)).toHaveLength(8);
  });

  it('PATCH solo de language: el payload no incluye ninguna columna de display', async () => {
    await patchSettingsById(9, { language: 'es' });

    const [, payload] = firstDaoCall();

    expect(payload).toEqual({ language: 'es' });
    expect(payload).not.toHaveProperty('displayEvents');
  });

  it('PATCH solo de display: el payload no incluye language', async () => {
    await patchSettingsById(9, {
      displayOptions: { displayStock: false },
    });

    const [, payload] = firstDaoCall();

    expect(payload).toEqual({ displayStock: false });
    expect(payload).not.toHaveProperty('language');
  });

  it('no setea updatedOn (follow-up registrado, fuera de alcance)', async () => {
    await patchSettingsById(9, { displayOptions: { displayStock: true } });

    const [, payload] = firstDaoCall();

    expect(payload).not.toHaveProperty('updatedOn');
  });
});
