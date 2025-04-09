import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const PayrollDatatable = ({
  dataPayroll,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  // Function to format currency
  const formatCurrency = (value) => {
    const number = Number(value);
    if (isNaN(number)) return value; // Return original value if not a number
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(number);
    // Adjust 'es-ES' and 'EUR' based on your locale and currency needs
  }

  const columnDefPayroll = [
    {
      accessorKey: 'employee',
      header: t('employee'),
      cell: info => {
        const employee = info.getValue()
        return employee ? `${employee.name} ${employee.lastName}` : ''
      }
    },
    {
      accessorKey: 'month',
      header: t('month'),
      cell: info => {
        const monthNumber = info.getValue();
        return monthNumber ? t(`months.${monthNumber}`) : ''; // Use translation key
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
      cell: info => formatCurrency(info.getValue()) // Format as currency
    },
    {
      accessorKey: 'extraHours',
      header: t('extra_hours'),
      cell: info => formatCurrency(info.getValue()) // Format as currency
    },
    {
      accessorKey: 'deductions',
      header: t('deductions'),
      cell: info => formatCurrency(info.getValue()) // Format as currency
    },
    {
      accessorKey: 'totalPayment',
      header: t('total_payment'),
      cell: info => formatCurrency(info.getValue()) // Format as currency
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
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

  const payrollData = Array.isArray(dataPayroll?.data) ? dataPayroll.data : [];

  return (
    <DataTable
      columns={columnDefPayroll}
      data={payrollData}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

PayrollDatatable.propTypes = {
  dataPayroll: PropTypes.shape({
    data: PropTypes.array
  }),
  onEditDialog: PropTypes.func.isRequired
} 