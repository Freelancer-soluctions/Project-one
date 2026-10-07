import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Main from './Main';

describe('Main - UI snapshot', () => {
  it('renders the main region', () => {
    const { container } = render(<Main />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div>
        Main
      </div>
    `,
      'layout main region'
    );
  });
});
