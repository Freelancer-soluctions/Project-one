import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header';

describe('Header - UI snapshot', () => {
  it('renders the header heading', () => {
    const { container } = render(<Header />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <h1>
        Header
      </h1>
    `,
      'layout header heading'
    );
  });
});
