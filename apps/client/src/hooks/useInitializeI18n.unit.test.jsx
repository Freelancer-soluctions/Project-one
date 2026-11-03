import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInitializeI18n } from './useInitializeI18n';

const { selected, changeLanguage } = vi.hoisted(() => ({
  selected: { current: null },
  changeLanguage: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: (selector) =>
    selector({ settings: { dataSettings: selected.current } }),
}));

vi.mock('@/config/i18n', () => ({
  default: { changeLanguage },
}));

describe('useInitializeI18n', () => {
  beforeEach(() => {
    selected.current = null;
    changeLanguage.mockClear();
  });

  it('changes language when a valid setting is present', () => {
    selected.current = { language: { data: { language: 'fr' }, error: null } };

    renderHook(() => useInitializeI18n());

    expect(changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('does not change language for missing or errored settings', () => {
    selected.current = {
      language: { data: { language: 'fr' }, error: 'failed' },
    };

    renderHook(() => useInitializeI18n());

    expect(changeLanguage).not.toHaveBeenCalled();
  });
});
