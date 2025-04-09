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
      accessorKey: 'employee',
      header: t('employee'),
      // Access nested property for display
      cell: info => {
        const employee = info.getValue()
        return employee ? `${employee.name} ${employee.lastName}` : ''
      }
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

  // Ensure dataAttendance.data is an array before passing to DataTable
  const attendanceData = Array.isArray(dataAttendance?.data) ? dataAttendance.data : [];

  return (
    <DataTable
      columns={columnDefAttendance}
      data={attendanceData}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

AttendanceDatatable.propTypes = {
  // Allow dataAttendance to be potentially undefined initially
  dataAttendance: PropTypes.shape({
    data: PropTypes.array
  }),
  onEditDialog: PropTypes.func.isRequired
} 