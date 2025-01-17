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

import Filter from './Filter'
import Pagination from './Pagination'
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
      <Table className='rounded-lg '>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <TableHead key={header.id} className='p-3 border '>
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
                          ? 'cursor-pointer select-none text-center'
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
                      <div className='pt-2 '>
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
                    className='p-2 text-center border cursor-pointer select-none'
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
              <TableCell
                colSpan={columns.length}
                className='h-full text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination table={table} />
      {/* <pre>{JSON.stringify(table.getState().pagination, null, 2)}</pre> */}
    </div>
  )
}

export default Datatable
