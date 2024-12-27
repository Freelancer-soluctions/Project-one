import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import Filter from './Filter'
import { useState } from 'react'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { MdOutlineArrowDropDown, MdOutlineArrowDropUp } from 'react-icons/md'

const Datatable = ({ columns, data = [], setSelectedRow, handleRow }) => {
  const [columnFilters, setColumnFilters] = useState([]) //column filters
  const [sorting, setSorting] = useState([]) //sorting
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20
  }) //pagination
  const [density, setDensity] = useState('lg')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    //column filters
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(), //client side filtering
    // sorting
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // pagination
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,

    //state
    state: {
      columnFilters, //column filters
      sorting, // sorting
      pagination // pagination
    }
  })

  const handleDataRow = row => {
    setSelectedRow(row.original)
    handleRow()
  }

  return (
    <div className='flex-1 max-w-full '>
      <Table className='rounded-lg border max-h-[25vh] h-svh'>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <TableHead key={header.id} className='p-3'>
                    {/* {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {
                      {
                        asc: <CaretSortIcon className='w-4 h-3 ml-1' />,
                        desc: <CaretSortIcon className='w-4 h-4 ml-2' />
                      }[header.column.getIsSorted() ?? null]
                    }
                    {header.column.getCanFilter() ? (
                      <div>
                        <Filter column={header.column} />
                      </div>
                    ) : null} */}

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
                      {{
                        asc: <MdOutlineArrowDropUp className='inline-block' />,
                        desc: (
                          <MdOutlineArrowDropDown className='inline-block' />
                        ),
                        false: <CaretSortIcon className='inline-block' />
                      }[header.column.getIsSorted()] ?? null}
                    </div>
                    {header.column.getCanFilter() ? (
                      <div className='pt-2'>
                        <Filter column={header.column} table={table} />
                      </div>
                    ) : null}
                  </TableHead>
                )
              })}
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
                      handleDataRow(row)
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
            min='1'
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
      {/* <pre>{JSON.stringify(table.getState().pagination, null, 2)}</pre> */}
    </div>
  )
}

export default Datatable
