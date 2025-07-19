import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const AttendanceDatatable = ({
  dataAttendance,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefAttendance = [
 
       {
      accessorKey: 'employeeName',
      header: t('employee'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'date',
      header: t('date'),
      cell: info => format(new Date(info.getValue()), 'PPP') // Format date
    },
    {
      accessorKey: 'entryTime',
      header: t('entry_time'),
      cell: info => info.getValue()
    },
    {
      accessorKey: 'exitTime',
      header: t('exit_time'),
      cell: info => info.getValue()
    },
    {
      accessorKey: 'workedHours',
      header: t('worked_hours'),
      cell: info => {
        const hours = info.getValue()
        // Format to 2 decimal places if it's a number
        return typeof hours === 'number' ? hours.toFixed(2) : hours
      }
    },
    {
      accessorKey: 'userAttendanceCreatedName',
      header: t('created_by'),
      cell: info => {
        const userAttendanceCreatedName = info.row.original.userAttendanceCreatedName // Accede al dato original de la fila
        return userAttendanceCreatedName ? userAttendanceCreatedName.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'userAttendanceUpdatedName',
      header: t('created_by'),
      cell: info => {
        const userAttendanceUpdatedName = info.row.original.userAttendanceUpdatedName // Accede al dato original de la fila
        return userAttendanceUpdatedName ? userAttendanceUpdatedName.toUpperCase() : null // Retorna null para mantener la celda vacía
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
      columns={columnDefAttendance}
      data={dataAttendance.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

AttendanceDatatable.propTypes = {
  dataAttendance: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
} 