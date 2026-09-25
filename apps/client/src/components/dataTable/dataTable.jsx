import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CellWithTooltip } from './cellWithTooltip';

import { Filter } from './Filter';
import { Pagination } from './Pagination';
import { useState } from 'react';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { MdOutlineArrowDropDown, MdOutlineArrowDropUp } from 'react-icons/md';
import PropTypes from 'prop-types';

/**
 * Encabezado de columna: título ordenable + icono de dirección + filtro.
 *
 * @param {Object} p - Props del encabezado.
 * @param {Object} p.header - Header de TanStack Table.
 * @param {Object} p.table - Instancia de la tabla (para el filtro).
 * @returns {JSX.Element} Contenido del TableHead.
 */
const SortableHeaderContent = ({ header, table }) => (
  <>
    <div
      {...{
        className: header.column.getCanSort()
          ? 'cursor-pointer select-none text-center'
          : '',
        onClick: header.column.getToggleSortingHandler(),
      }}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {{
        asc: <MdOutlineArrowDropUp className="inline-block" />,
        desc: <MdOutlineArrowDropDown className="inline-block" />,
        false: <CaretSortIcon className="inline-block" />,
      }[header.column.getIsSorted()] ?? null}
    </div>
    {header.column.getCanFilter() ? (
      <div className="pt-2 ">
        <Filter column={header.column} table={table} />
      </div>
    ) : null}
  </>
);

SortableHeaderContent.propTypes = {
  header: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
};

/**
 * Fila de datos: celdas clickeables con tooltip.
 *
 * @param {Object} p - Props de la fila.
 * @param {Object} p.row - Row de TanStack Table.
 * @param {Function} p.handleDataRow - Callback al hacer click en una celda.
 * @returns {JSX.Element} TableRow.
 */
const DataRow = ({ row, handleDataRow }) => (
  <TableRow
    key={row.id}
    className=""
    data-state={row.getIsSelected() && 'selected'}
  >
    {row.getVisibleCells().map((cell) => (
      <TableCell
        key={cell.id}
        className="p-2 text-center border cursor-pointer select-none "
        onClick={() => {
          handleDataRow(row);
        }}
      >
        <CellWithTooltip cell={cell} />
      </TableCell>
    ))}
  </TableRow>
);

DataRow.propTypes = {
  row: PropTypes.object.isRequired,
  handleDataRow: PropTypes.func.isRequired,
};

export const DataTable = ({
  columns,
  data = [],
  totalRows,
  handleRow,
  pagination,
  onPaginationChange,
}) => {
  const [columnFilters, setColumnFilters] = useState([]); //column filters
  const [sorting, setSorting] = useState([]); //sorting
  // se translada al componente contenedor (Page) para cumplir con el envio de limit y page cumpliendo con A03 OWASP INJECTION
  // const [pagination, setPagination] = useState({
  //   pageIndex: 0,
  //   pageSize: 20
  // }) //pagination
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    //override default column sizing
    // defaultColumn: {
    //   size: 200, //starting column size
    //   minSize: 50, //enforced during column resizing
    //   maxSize: 500 //enforced during column resizing
    // },
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
    //getPaginationRowModel: getPaginationRowModel(), // If only doing manual pagination, you don't need this
    // onPaginationChange: setPagination,
    onPaginationChange,
    manualPagination: true,
    rowCount: totalRows,
    // pageCount: Math.ceil(totalRows / pageSize),
    //state
    state: {
      columnFilters, //column filters
      sorting, // sorting
      pagination, // pagination
    },
  });

  const handleDataRow = (row) => {
    handleRow(row.original);
  };

  return (
    <div className="flex-1 max-w-full max-h-[50vh] ">
      <TooltipProvider>
        {' '}
        <Table className="overflow-auto rounded-lg">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="p-3 border ">
                    <SortableHeaderContent header={header} table={table} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.map((row) => (
                  <DataRow
                    key={row.id}
                    row={row}
                    handleDataRow={handleDataRow}
                  />
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-full text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>

      <Pagination table={table} />
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array,
  totalRows: PropTypes.number.isRequired,
  handleRow: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};
