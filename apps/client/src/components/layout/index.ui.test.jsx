import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from './index';

describe('Layout - UI snapshot', () => {
  it('renders header, main and footer in order', () => {
    const { container } = render(<Layout />);
    expect(container).toMatchInlineSnapshot(
      `
      <div>
        <h1>
          Header
        </h1>
        <div>
          Main
        </div>
        <h1>
          Footer
        </h1>
      </div>
    `,
      'layout composition of header, main and footer'
    );
  });
});
