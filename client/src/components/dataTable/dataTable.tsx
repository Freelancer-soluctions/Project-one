import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  Row,
  ColumnDef,
  PaginationState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Input } from '../ui/input'
import Filter from './Filter'
import { useState } from 'react'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { MdOutlineArrowDropDown, MdOutlineArrowDropUp } from 'react-icons/md'
import { Button } from '../ui/button'

interface Data {
  name: string;
  age: number;
}

interface PropsDatatable {
  columns: ColumnDef<Data>[];
  data: Data[];
  setSelectedRow: (row: Data) => void;
  setOpenDialog: (isOpen: boolean) => void;
  setSelectedRow2: React.Dispatch<React.SetStateAction<null>>;
}

const Datatable = ({
  columns,
  data = [],
  setSelectedRow,
  setOpenDialog
}: PropsDatatable) => {
  const [columnFilters, setColumnFilters] = useState<any[]>([]) // Column filters
  const [sorting, setSorting] = useState<any[]>([]) // Sorting
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20
  }) // Pagination

  const table = useReactTable<Data>({
    data, // Use `data` passed as prop
    columns,
    state: {
      columnFilters,
      sorting,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  const handleDialog = (row: Row<Data>) => {
    setSelectedRow(row.original)
    setOpenDialog(true)
  }

  return (
    <div className='flex-1 max-w-full'>
      <Table className='rounded-lg border max-h-[25vh] h-svh'>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className='p-3'>
                  <div
                    {...{
                      className: header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                      onClick: header.column.getToggleSortingHandler()
                    }}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                   {header.column.getIsSorted() === 'asc' ? (
                      <MdOutlineArrowDropUp className='inline-block' />
                    ) : header.column.getIsSorted() === 'desc' ? (
                      <MdOutlineArrowDropDown className='inline-block' />
                    ) : (
                      <CaretSortIcon className='inline-block' />
                    )}
                  </div>
                  {header.column.getCanFilter() ? (
                    <div className='pt-2'>
                      <Filter column={header.column} table={table} />
                    </div>
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className='p-1 text-center'
                    onClick={() => {
                      handleDialog(row)
                    }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className='h-2' />
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          className='p-1 border rounded'
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}>
          {'<<'}
        </Button>
        <Button
          className='p-1 border rounded'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}>
          {'<'}
        </Button>
        <Button
          className='p-1 border rounded'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}>
          {'>'}
        </Button>
        <Button
          className='p-1 border rounded'
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}>
          {'>>'}
        </Button>
        <span className='flex items-center gap-1'>
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount().toLocaleString()}
          </strong>
        </span>
        <span className='flex items-center gap-1'>
          | Go to page:
          <Input
            type='number'
            min='2'
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className='w-16 p-1 border rounded'
          />
        </span>

        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}>
          {[10, 20, 30, 40, 50].map(pageSize => (
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
    </div>
  )
}

export default Datatable
