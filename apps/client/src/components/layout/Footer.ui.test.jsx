import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer - UI snapshot', () => {
  it('renders the footer heading', () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <h1>
        Footer
      </h1>
    `,
      'layout footer heading'
    );
  });
});
