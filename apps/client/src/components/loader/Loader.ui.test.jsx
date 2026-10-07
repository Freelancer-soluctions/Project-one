import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader - UI snapshot', () => {
  it('renders the loading message', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div>
        Loading ...
      </div>
    `,
      'plain loading text block'
    );
  });
});
