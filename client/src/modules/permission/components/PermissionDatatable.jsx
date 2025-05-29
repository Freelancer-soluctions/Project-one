import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { Badge } from '@/components/ui/badge' // Import Badge for status

export const PermissionDatatable = ({
  dataPermissions,
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

  const columnDefPermissions = [
    {
      accessorKey: 'employeeName',
      header: t('employee'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'type',
      header: t('type'),
      cell: info => {
        const type = info.getValue();
        return type ? t(`permission_type.${type}`) : ''; // Assuming translations
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
      accessorKey: 'reason',
      header: t('reason'),
      // Optional: Truncate long reasons
      cell: info => {
          const reason = info.getValue();
          return reason || ''
      }
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
      accessorKey: 'userPermissionCreatedName',
      header: t('created_by'),
      cell: info => {
        const userPerformanceCreatedName =
          info.row.original.userPerformanceCreatedName // Accede al dato original de la fila
        return userPerformanceCreatedName
          ? userPerformanceCreatedName.toUpperCase()
          : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'userPermissionUpdatedName',
      header: t('created_by'),
      cell: info => {
        const userPerformanceUpdatedName =
          info.row.original.userPerformanceUpdatedName // Accede al dato original de la fila
        return userPerformanceUpdatedName
          ? userPerformanceUpdatedName.toUpperCase()
          : null // Retorna null para mantener la celda vacía
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
      columns={columnDefPermissions}
      data={dataPermissions.data }
      handleRow={row => handleEditDialog(row)}
    />
  )
}

PermissionDatatable.propTypes = {
  dataPermissions: PropTypes.array.isRequired,
  onEditDialog: PropTypes.func.isRequired
} 