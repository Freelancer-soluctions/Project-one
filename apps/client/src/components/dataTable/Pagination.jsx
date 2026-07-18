import { Button } from '../ui/button';
import PropTypes from 'prop-types';

export const Pagination = ({ table }) => {
  return (
    <>
      <div className="h-2" />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="p-1 border rounded"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </Button>
        <Button
          className="p-1 border rounded"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </Button>
        <Button
          className="p-1 border rounded"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </Button>
        <Button
          className="p-1 border rounded"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </Button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount().toLocaleString()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          {/* <Input
            type='number'
            min='1'
            max={table.getPageCount()}
            value={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              // const page = e.target.value ? Number(e.target.value) - 1 : 0
              // table.setPageIndex(page)
              const rawValue = Number(e.target.value)

              if (Number.isNaN(rawValue)) return

              const maxPage = table.getPageCount()
            console.log({
  pageIndex: table.getState().pagination.pageIndex,
  pageCount: table.getPageCount(),
})
              const clampedPage = Math.min(Math.max(rawValue, 1), maxPage)

              table.setPageIndex(clampedPage - 1)
            }}
            className='w-16 p-1 border rounded'
          /> */}
          <input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>

        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>
        Showing {table.getRowModel().rows.length.toLocaleString()} of{' '}
        {table.getRowCount().toLocaleString()} Rows
      </div>
      {/* <pre>{JSON.stringify(table.getState().pagination, null, 2)}</pre> */}
    </>
  );
};
Pagination.propTypes = {
  table: PropTypes.object.isRequired,
};
