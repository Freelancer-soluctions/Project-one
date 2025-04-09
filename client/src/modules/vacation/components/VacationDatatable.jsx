import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { Badge } from '@/components/ui/badge' // Import Badge for status

export const VacationDatatable = ({
  dataVacations,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning'
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'destructive'
      default: return 'secondary'
    }
  }

  const columnDefVacations = [
    {
      accessorKey: 'employee',
      header: t('employee'),
      cell: info => {
        const employee = info.getValue()
        return employee ? `${employee.name} ${employee.lastName}` : ''
      }
    },
    {
      accessorKey: 'startDate',
      header: t('start_date'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'endDate',
      header: t('end_date'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: info => {
        const status = info.getValue();
        return (
          <Badge variant={getStatusVariant(status)}>
            {t(`status.${status}`)} {/* Assuming status translations */}
          </Badge>
        )
      }
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

  const vacationData = Array.isArray(dataVacations?.data) ? dataVacations.data : [];

  return (
    <DataTable
      columns={columnDefVacations}
      data={vacationData}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

VacationDatatable.propTypes = {
  dataVacations: PropTypes.shape({
    data: PropTypes.array
  }),
  onEditDialog: PropTypes.func.isRequired
} 