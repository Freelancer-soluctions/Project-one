import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnDef } from '@tanstack/react-table'
import Datatable from '@/components/dataTable/dataTable'
import '@testing-library/jest-dom'

interface Data {
  name: string
  age: number
}

const mockColumns: ColumnDef<Data>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: info => info.getValue(),
  },
]

const mockData: Data[] = [
  { name: 'John', age: 25 },
  { name: 'Jane', age: 30 },
  { name: 'Doe', age: 35 },
]

const mockSetSelectedRow = vi.fn()
const mockSetOpenDialog = vi.fn()

describe('Datatable Component', () => {
  it('renders the table with data', () => {
    render(
      <Datatable
            columns={mockColumns}
            data={mockData}
            setSelectedRow={mockSetSelectedRow}
            setOpenDialog={mockSetOpenDialog} setSelectedRow2={function (): void {
                throw new Error('Function not implemented.')
            } }      />
    )

    // Verifica que las celdas se muestran correctamente
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
  })

  it('handles pagination correctly', () => {
    render(
      <Datatable
            columns={mockColumns}
            data={mockData}
            setSelectedRow={mockSetSelectedRow}
            setOpenDialog={mockSetOpenDialog} setSelectedRow2={function (): void {
                throw new Error('Function not implemented.')
            } }      />
    )

    // Verifica que el botón de siguiente página está deshabilitado al inicio (por poca data)
    const nextButton = screen.getByText('>')
    expect(nextButton).toBeDisabled()
  })

  it('opens dialog on row click', () => {
    render(
      <Datatable
            columns={mockColumns}
            data={mockData}
            setSelectedRow={mockSetSelectedRow}
            setOpenDialog={mockSetOpenDialog} setSelectedRow2={function (): void {
                throw new Error('Function not implemented.')
            } }      />
    )

    // Simula un click en una fila
    const row = screen.getByText('John')
    fireEvent.click(row)

    expect(mockSetSelectedRow).toHaveBeenCalledWith({ name: 'John', age: 25 })
    expect(mockSetOpenDialog).toHaveBeenCalledWith(true)
  })
})
