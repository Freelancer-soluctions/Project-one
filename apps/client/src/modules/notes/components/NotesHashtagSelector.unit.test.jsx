import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HashtagsSelector } from './NotesHashtagSelector';

const hashtags = [
  { id: 'alpha', name: 'alpha' },
  { id: 'beta', name: 'beta' },
];

const rowFor = (name) => screen.getByRole('button', { name });

const isChecked = (name) =>
  Boolean(rowFor(name).querySelector('.lucide-check'));

describe('HashtagsSelector', () => {
  it('renders the selection it receives', () => {
    render(<HashtagsSelector hashtags={hashtags} selectedIds={['alpha']} />);

    expect(isChecked('alpha')).toBe(true);
    expect(isChecked('beta')).toBe(false);
  });

  it('replaces the local selection when the selectedIds prop changes', () => {
    const { rerender } = render(
      <HashtagsSelector hashtags={hashtags} selectedIds={['alpha']} />
    );
    expect(isChecked('alpha')).toBe(true);

    rerender(<HashtagsSelector hashtags={hashtags} selectedIds={['beta']} />);

    expect(isChecked('alpha')).toBe(false);
    expect(isChecked('beta')).toBe(true);
  });

  it('reports the selection without the item when a selected one is toggled off', () => {
    const onSelectionChange = vi.fn();
    render(
      <HashtagsSelector
        hashtags={hashtags}
        selectedIds={['alpha', 'beta']}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(rowFor('alpha'));

    expect(onSelectionChange).toHaveBeenCalledWith(['beta']);
    expect(isChecked('alpha')).toBe(false);
  });

  it('keeps toggles made locally while selectedIds is unchanged', () => {
    const selectedIds = ['alpha'];
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <HashtagsSelector
        hashtags={hashtags}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(rowFor('beta'));
    rerender(
      <HashtagsSelector
        hashtags={hashtags}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(onSelectionChange).toHaveBeenCalledWith(['alpha', 'beta']);
    expect(isChecked('beta')).toBe(true);
  });
});
