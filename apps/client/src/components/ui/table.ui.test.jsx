import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

describe('Table - UI snapshot', () => {
  it('renders header and one row of fixed data', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="relative w-full h-full overflow-auto border "
      >
        <table
          class="w-full caption-bottom text-sm"
        >
          <thead
            class="sticky top-0 bg-white [&_tr]:border-b"
          >
            <tr
              class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <th
                class="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
              >
                Name
              </th>
              <th
                class="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody
            class="[&_tr:last-child]:border-0"
          >
            <tr
              class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <td
                class="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
              >
                Ada Lovelace
              </td>
              <td
                class="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
              >
                Active
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
      'table with header and one fixed row'
    );
  });
});
