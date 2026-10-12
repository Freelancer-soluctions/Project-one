import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AttendeeStatus } from './AttendeeStatus';

describe('AttendeeStatus - UI snapshot', () => {
  it('renders the confirmed status badge', () => {
    const { container } = render(<AttendeeStatus status="CONFIRMED" />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
      >
        confirmed
      </span>
    `,
      `<span\n  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"\n>\n  Confirmado\n</span>`
    );
  });

  it('renders the waitlist status badge', () => {
    const { container } = render(<AttendeeStatus status="WAITLIST" />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
      >
        waitlist
      </span>
    `,
      `<span\n  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"\n>\n  Lista de espera\n</span>`
    );
  });

  it('renders the cancelled status badge', () => {
    const { container } = render(<AttendeeStatus status="CANCELLED" />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
      >
        cancelled
      </span>
    `,
      `<span\n  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"\n>\n  Cancelado\n</span>`
    );
  });

  it('returns null for empty status', () => {
    const { container } = render(<AttendeeStatus status={null} />);
    expect(container.firstChild).toMatchInlineSnapshot(`null`, 'null');
  });
});
