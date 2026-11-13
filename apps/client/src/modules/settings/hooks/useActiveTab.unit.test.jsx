import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';
import PropTypes from 'prop-types';
import { useActiveTab } from './useActiveTab';

function withRouter(initialEntries) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
  }

  Wrapper.propTypes = { children: PropTypes.node };

  return Wrapper;
}

const renderActiveTab = (defaultTab, initialEntries) =>
  renderHook(
    () => ({ tab: useActiveTab(defaultTab), navigate: useNavigate() }),
    { wrapper: withRouter(initialEntries) }
  );

describe('useActiveTab', () => {
  it('uses the tab from the URL and falls back to the default', () => {
    const fromUrl = renderActiveTab('profile', ['/settings?tab=security']);
    expect(fromUrl.result.current.tab.activeTab).toBe('security');

    const fallback = renderActiveTab('profile', ['/settings']);
    expect(fallback.result.current.tab.activeTab).toBe('profile');
  });

  it('follows the tab query param when it changes', () => {
    const { result } = renderActiveTab('profile', ['/settings?tab=security']);
    expect(result.current.tab.activeTab).toBe('security');

    act(() => result.current.navigate('/settings?tab=billing'));

    expect(result.current.tab.activeTab).toBe('billing');
  });

  it('keeps a locally selected tab until the URL changes again', () => {
    const { result } = renderActiveTab('profile', ['/settings?tab=security']);

    act(() => result.current.tab.setActiveTab('notifications'));

    expect(result.current.tab.activeTab).toBe('notifications');

    act(() => result.current.navigate('/settings?tab=billing'));

    expect(result.current.tab.activeTab).toBe('billing');
  });
});
