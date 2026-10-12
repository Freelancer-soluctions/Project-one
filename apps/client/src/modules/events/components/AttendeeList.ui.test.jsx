import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AttendeeList } from './AttendeeList';

// Radix `Select.Item` throws on `value=""` (the "all" option of the status
// filter row, rendered outside the snapshotted table). Remap the empty value
// to a stable token for render-only purposes; closed selects only paint their
// trigger, so the `table` snapshots below are unaffected.
vi.mock('@/components/ui/select', async (importOriginal) => {
  const actual = await importOriginal();
  // eslint-disable-next-line react/prop-types
  const SelectItem = ({ value, ...props }) => (
    <actual.SelectItem value={value === '' ? 'all' : value} {...props} />
  );
  return { ...actual, SelectItem };
});

// Precedent NotesCard.ui.test.jsx: the test lives inside `components/` so
// `vi.mock('../api/eventsAPI')` resolves exactly as the component's import.
vi.mock('../api/eventsAPI', () => ({
  useLazyListAttendeesQuery: () => [
    vi.fn(),
    {
      // Real query shape: `data?.data` is the paginated payload whose own
      // `data` holds the attendee rows (`result.data`, `result.totalPages`).
      data: {
        data: {
          data: [
            {
              id: 1,
              status: 'CONFIRMED',
              createdAt: '2026-01-10T12:00:00.000Z',
              user: { name: 'Ana Ruiz', email: 'ana@example.com' },
            },
            {
              id: 2,
              status: 'WAITLIST',
              createdAt: '2026-02-20T12:00:00.000Z',
              user: { name: 'Bruno Diaz', email: 'bruno@example.com' },
            },
            {
              id: 3,
              status: 'CANCELLED',
              createdAt: '2026-03-30T12:00:00.000Z',
              user: { name: 'Carla Gil', email: 'carla@example.com' },
            },
          ],
          total: 3,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
      isLoading: false,
    },
  ],
  useUpdateAttendeeStatusMutation: () => [vi.fn(), { isLoading: false }],
}));

// B3: L71 formats fixture dates with
// `new Date(attendee.createdAt).toLocaleDateString()`. The clock is irrelevant
// (dates come from the fixture), so NO `vi.setSystemTime` is used. The real
// risk is the ICU locale mismatch (Windows es-ES prints `10/01/2026` while CI
// en-US prints `01/10/2026`), so `Date.prototype.toLocaleDateString` is
// normalized to fixed labels. Allowed by the "freeze or normalize" scenario.
const DATE_LABELS = {
  '2026-01-10': '10/01/2026',
  '2026-02-20': '20/02/2026',
  '2026-03-30': '30/03/2026',
};

beforeAll(() => {
  vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(
    function () {
      const isoDay = this.toISOString().slice(0, 10);
      return DATE_LABELS[isoDay] ?? isoDay;
    }
  );
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('AttendeeList - UI snapshot', () => {
  it('renders the table head and the three fixed rows', () => {
    const { container } = render(<AttendeeList eventId={7} />);
    // D5 segmentation: the whole table serializes to ~235 lines, so head and
    // rows are snapshotted separately — scope stays table-only, never the
    // page tree (no filter row, pagination or alert dialog).
    const table = container.querySelector('table');
    expect(table.querySelector('thead')).toMatchInlineSnapshot(
      `
      <thead>
        <tr
          class="border-b"
        >
          <th
            class="text-left py-2 px-3"
          >
            user
          </th>
          <th
            class="text-left py-2 px-3"
          >
            Email
          </th>
          <th
            class="text-left py-2 px-3"
          >
            Status
          </th>
          <th
            class="text-left py-2 px-3"
          >
            registered_date
          </th>
          <th
            class="text-left py-2 px-3"
          >
            actions
          </th>
        </tr>
      </thead>
    `,
      'attendee list table head with translated columns'
    );
    const [firstRow, secondRow, thirdRow] = table.querySelectorAll('tbody tr');
    expect(firstRow).toMatchInlineSnapshot(
      `
      <tr
        class="border-b hover:bg-gray-50"
      >
        <td
          class="py-2 px-3"
        >
          Ana Ruiz
        </td>
        <td
          class="py-2 px-3"
        >
          ana@example.com
        </td>
        <td
          class="py-2 px-3"
        >
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            confirmed
          </span>
        </td>
        <td
          class="py-2 px-3"
        >
          10/01/2026
        </td>
        <td
          class="py-2 px-3"
        >
          <button
            aria-autocomplete="none"
            aria-controls="radix-:r1:"
            aria-expanded="false"
            class="flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-32"
            data-placeholder=""
            data-state="closed"
            dir="ltr"
            role="combobox"
            type="button"
          >
            <span
              style="pointer-events: none;"
            >
              change_status
            </span>
            <svg
              aria-hidden="true"
              class="h-4 w-4 opacity-50"
              fill="none"
              height="15"
              viewBox="0 0 15 15"
              width="15"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clip-rule="evenodd"
                d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z"
                fill="currentColor"
                fill-rule="evenodd"
              />
            </svg>
          </button>
        </td>
      </tr>
    `,
      'attendee list first row ana ruiz confirmed'
    );
    expect(secondRow).toMatchInlineSnapshot(
      `
      <tr
        class="border-b hover:bg-gray-50"
      >
        <td
          class="py-2 px-3"
        >
          Bruno Diaz
        </td>
        <td
          class="py-2 px-3"
        >
          bruno@example.com
        </td>
        <td
          class="py-2 px-3"
        >
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
          >
            waitlist
          </span>
        </td>
        <td
          class="py-2 px-3"
        >
          20/02/2026
        </td>
        <td
          class="py-2 px-3"
        >
          <button
            aria-autocomplete="none"
            aria-controls="radix-:r2:"
            aria-expanded="false"
            class="flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-32"
            data-placeholder=""
            data-state="closed"
            dir="ltr"
            role="combobox"
            type="button"
          >
            <span
              style="pointer-events: none;"
            >
              change_status
            </span>
            <svg
              aria-hidden="true"
              class="h-4 w-4 opacity-50"
              fill="none"
              height="15"
              viewBox="0 0 15 15"
              width="15"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clip-rule="evenodd"
                d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z"
                fill="currentColor"
                fill-rule="evenodd"
              />
            </svg>
          </button>
        </td>
      </tr>
    `,
      'attendee list second row bruno diaz waitlist'
    );
    expect(thirdRow).toMatchInlineSnapshot(
      `
      <tr
        class="border-b hover:bg-gray-50"
      >
        <td
          class="py-2 px-3"
        >
          Carla Gil
        </td>
        <td
          class="py-2 px-3"
        >
          carla@example.com
        </td>
        <td
          class="py-2 px-3"
        >
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
          >
            cancelled
          </span>
        </td>
        <td
          class="py-2 px-3"
        >
          30/03/2026
        </td>
        <td
          class="py-2 px-3"
        >
          <button
            aria-autocomplete="none"
            aria-controls="radix-:r3:"
            aria-expanded="false"
            class="flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-32"
            data-placeholder=""
            data-state="closed"
            dir="ltr"
            role="combobox"
            type="button"
          >
            <span
              style="pointer-events: none;"
            >
              change_status
            </span>
            <svg
              aria-hidden="true"
              class="h-4 w-4 opacity-50"
              fill="none"
              height="15"
              viewBox="0 0 15 15"
              width="15"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clip-rule="evenodd"
                d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z"
                fill="currentColor"
                fill-rule="evenodd"
              />
            </svg>
          </button>
        </td>
      </tr>
    `,
      'attendee list third row carla gil cancelled'
    );
  });
});
