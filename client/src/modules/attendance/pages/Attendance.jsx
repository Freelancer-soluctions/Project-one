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
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Attendance = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')
  const [currentFilters, setCurrentFilters] = useState({}) // State to hold current filters

  const [
    getAllAttendance,
    {
      data: dataAttendance = { data: [] },
      isLoading: isLoadingAttendance,
      isFetching: isFetchingAttendance,
      refetch // Add refetch to manually trigger data fetching
    }
  ] = useLazyGetAllAttendanceQuery()

  const [
    updateAttendanceById,
    { isLoading: isLoadingPut }
  ] = useUpdateAttendanceByIdMutation()

  const [
    createAttendance,
    { isLoading: isLoadingPost }
  ] = useCreateAttendanceMutation()

  const [
    deleteAttendanceById,
    { isLoading: isLoadingDelete }
  ] = useDeleteAttendanceByIdMutation()

  // Fetch initial data on component mount
  useEffect(() => {
    getAllAttendance({}) // Fetch all attendance records initially
  }, [getAllAttendance])

  const handleSubmitFilters = (filters) => {
    setCurrentFilters(filters) // Store filters
    getAllAttendance(filters) // Fetch data with new filters
  }

  const handleSubmit = async (values, attendanceId) => {
    try {
      const action = attendanceId ? updateAttendanceById : createAttendance
      const payload = attendanceId ? { id: attendanceId, data: values } : values

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
          refetch() // Refetch data after successful operation
        },
        variantSuccess: 'info'
      })
      setOpenAlertDialog(true)
    } catch (err) {
      console.error('Error:', err)
      // Optionally, show an error alert
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: t('operation_failed'), // Add a generic error message translation
        cancel: false,
        success: false,
        destructive: true, // Use destructive variant for errors
        variantDestructive: 'destructive'
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
                refetch() // Refetch data after successful delete
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
      <BackDashBoard link={'/home'} moduleName={t('attendance')} /> {/* Adjust module name */}
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingAttendance ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingAttendance) && <Spinner />}

        <div className='grid grid-cols-1 gap-4 md:grid-cols-5'> {/* Adjusted grid layout for potentially more filters */}
          {/* filters */}
          <div className='col-span-1 md:col-span-5'> {/* Span full width */}
            <AttendanceFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='w-full col-span-1 md:col-span-5'> {/* Span full width */}
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