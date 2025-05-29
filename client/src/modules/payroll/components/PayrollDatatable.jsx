import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const PayrollDatatable = ({ dataPayroll, onEditDialog }) => {
  const { t } = useTranslation()
console.log('dataPayroll', dataPayroll)
  const columnDefPayroll = [
    {
      accessorKey: 'employeeName',
      header: t('employee'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'month',
      header: t('month'),
      cell: info => {
        const monthNumber = info.getValue()
        return monthNumber
      }
    },
    {
      accessorKey: 'year',
      header: t('year'),
      cell: info => info.getValue()
    },
    {
      accessorKey: 'baseSalary',
      header: t('base_salary'),
      cell: info => info.getValue() // Format as currency
    },
    {
      accessorKey: 'extraHours',
      header: t('extra_hours'),
      cell: info => info.getValue() // Format as currency
    },
    {
      accessorKey: 'deductions',
      header: t('deductions'),
      cell: info => info.getValue() // Format as currency
    },
    {
      accessorKey: 'totalPayment',
      header: t('total_payment'),
      cell: info => info.getValue() // Format as currency
    },
     {
      accessorKey: 'userPayrollCreatedName',
      header: t('created_by'),
      cell: info => {
        const userPayrollCreatedName = info.row.original.userPayrollCreatedName // Accede al dato original de la fila
        return userPayrollCreatedName ? userPayrollCreatedName.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
     {
      accessorKey: 'userPayrollUpdatedName',
      header: t('created_by'),
      cell: info => {
        const userPayrollUpdatedName = info.row.original.userPayrollUpdatedName // Accede al dato original de la fila
        return userPayrollUpdatedName ? userPayrollUpdatedName.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: info => {
        const date = info.getValue()
        return date ? format(new Date(date), 'PPP') : null
      }
    }
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  return (
    <DataTable
      columns={columnDefPayroll}
      data={dataPayroll.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

PayrollDatatable.propTypes = {
  dataPayroll: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
}
