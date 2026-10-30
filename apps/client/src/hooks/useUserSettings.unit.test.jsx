import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserSettings } from './useUserSettings';

const { dispatch, selectors, changeLanguage } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  selectors: { user: null, settings: null },
  changeLanguage: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (selector) =>
    selector({
      auth: { user: { data: { user: selectors.user } } },
      settings: {
        dataSettings: { userSettings: { data: selectors.settings } },
      },
    }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { changeLanguage } }),
}));

vi.mock('@/modules/settings/slice/settingsSlice', () => ({
  getSettingsByUserIdFetch: (userId) => ({
    type: 'settings/fetch',
    payload: userId,
  }),
}));

describe('useUserSettings', () => {
  beforeEach(() => {
    dispatch.mockClear();
    changeLanguage.mockClear();
    selectors.user = null;
    selectors.settings = null;
  });

  it('fetches settings for an authenticated user and applies the returned language', () => {
    selectors.user = { id: 42 };
    selectors.settings = { language: 'fr' };

    const { result } = renderHook(() => useUserSettings());

    expect(dispatch).toHaveBeenCalledWith({
      type: 'settings/fetch',
      payload: 42,
    });
    expect(changeLanguage).toHaveBeenCalledWith('fr');
    expect(result.current.settings).toEqual({ language: 'fr' });
  });

  it('does not fetch settings or change language when the user has no settings', () => {
    const { rerender } = renderHook(() => useUserSettings());

    expect(dispatch).not.toHaveBeenCalled();
    expect(changeLanguage).not.toHaveBeenCalled();

    selectors.user = { id: 42 };
    act(() => rerender());

    expect(dispatch).toHaveBeenCalledWith({
      type: 'settings/fetch',
      payload: 42,
    });
    expect(changeLanguage).not.toHaveBeenCalled();
  });
});
