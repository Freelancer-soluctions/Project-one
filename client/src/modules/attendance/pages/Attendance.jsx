import {
  AttendanceFiltersForm,
  AttendanceDialog,
  AttendanceDatatable
} from '../components' // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllAttendanceQuery,
  useUpdateAttendanceByIdMutation,
  useCreateAttendanceMutation,
  useDeleteAttendanceByIdMutation
} from '../api/attendanceApi' // Adjusted import path
import { useGetAllEmployeesQuery } from '@/modules/employees/api/employeesApi' // Assuming employee API exists

import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Attendance = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const {
    data: dataEmployees = { data: [] },
    isLoading: isLoadingEmployees,
    isFetching: isFetchingEmployees
  } = useGetAllEmployeesQuery()
  console.log('dataEmployees', dataEmployees) // Debugging line to check employee data
  const [
    getAllAttendance,
    {
      data: dataAttendance = { data: [] },
      isLoading: isLoadingAttendance,
      isFetching: isFetchingAttendance,
      refetch // Add refetch to manually trigger data fetching
    }
  ] = useLazyGetAllAttendanceQuery()

  const [updateAttendanceById, { isLoading: isLoadingPut }] =
    useUpdateAttendanceByIdMutation()

  const [createAttendance, { isLoading: isLoadingPost }] =
    useCreateAttendanceMutation()

  const [deleteAttendanceById, { isLoading: isLoadingDelete }] =
    useDeleteAttendanceByIdMutation()

  // Fetch initial data on component mount
  useEffect(() => {
    getAllAttendance({}) // Fetch all attendance records initially
  }, [getAllAttendance])

  const handleSubmitFilters = filters => {
    getAllAttendance(filters) // Fetch data with new filters
  }

  const handleSubmit = async (values, attendanceId) => {
    try {
      const action = attendanceId ? updateAttendanceById : createAttendance
      const payload = attendanceId
        ? {
            id: attendanceId,
            data: {
              employeeId: values.employeeId,
              date: values.date,
              entryTime: values.entryTime,
              exitTime: values.exitTime,
              workedHours: values.workedHours,
            }
          }
        : values

      await action(payload).unwrap()

      setAlertProps({
        alertTitle: t(attendanceId ? 'update_record' : 'add_record'),
        alertMessage: t(
          attendanceId ? 'updated_successfully' : 'added_successfully'
        ),
        cancel: false,
        success: true,
        onSuccess: () => {
          setOpenDialog(false)
        },
        variantSuccess: 'info'
      })
      setOpenAlertDialog(true)
    } catch (err) {
      // Handle error display, perhaps another AlertDialog
      setAlertProps({
        alertTitle: t('error_occurred_message'),
        alertMessage:
          err.data?.message || err.message || t('operation_failed_message'),
        cancel: false,
        success: true, // To show only one button "OK"
        onSuccess: () => {
          /* stay on dialog or close if needed */
        },
        variantSuccess: 'destructive' // Show error styling
      })
      setOpenAlertDialog(true)
    }
  }

  const handleAddDialog = () => {
    setActionDialog(t('add_attendance')) // Adjust translation key
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_attendance')) // Adjust translation key
    setOpenDialog(true)
    setSelectedRow(row)
  }

  const handleCloseDialog = () => {
    setSelectedRow({})
    setOpenDialog(false)
  }

  const handleDelete = async id => {
    try {
      setAlertProps({
        alertTitle: t('delete_record'),
        alertMessage: t('request_delete_record'),
        cancel: true,
        success: false,
        destructive: true,
        variantSuccess: '',
        variantDestructive: 'destructive',
        onSuccess: () => {},
        onDelete: async () => {
          try {
            await deleteAttendanceById(id).unwrap()

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                setOpenDialog(false)
              },
              variantSuccess: 'info'
            })
            setOpenAlertDialog(true)
          } catch (err) {
            console.error('Error deleting:', err)
            // Optional: Show error alert on delete failure
            setAlertProps({
              alertTitle: t('error'),
              alertMessage: t('delete_failed'), // Add translation
              cancel: false,
              success: false,
              destructive: true,
              variantDestructive: 'destructive'
            })
            setOpenAlertDialog(true)
          }
        }
      })
      setOpenAlertDialog(true)
    } catch (err) {
      console.error('Error initiating delete:', err)
    }
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('attendance')} />
      {/* Adjust module name */}
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingAttendance ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingEmployees ||
          isFetchingEmployees ||
          isFetchingAttendance) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          <div className='col-span-2 row-span-1 md:col-span-5'>
            {/* Span full width */}
            <AttendanceFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              dataEmployees={dataEmployees.data} // Pass employee data for filters
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <AttendanceDatatable
              dataAttendance={dataAttendance} // Pass attendance data
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <AttendanceDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
            dataEmployees={dataEmployees.data} // Pass employee data for filters
          />
          <AlertDialogComponent
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
            alertProps={alertProps}
          />
        </div>
      </div>
    </>
  )
}

export default Attendance
