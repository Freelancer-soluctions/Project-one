import {
  PayrollFiltersForm,
  PayrollDialog,
  PayrollDatatable
} from '../components' // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllPayrollQuery,
  useUpdatePayrollByIdMutation,
  useCreatePayrollMutation,
  useDeletePayrollByIdMutation
} from '../api/payrollApi' // Adjusted import path
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Payroll = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')
  const [currentFilters, setCurrentFilters] = useState({}) // State to hold current filters

  const [
    getAllPayroll,
    {
      data: dataPayroll = { data: [] },
      isLoading: isLoadingPayroll,
      isFetching: isFetchingPayroll,
      refetch // Add refetch to manually trigger data fetching
    }
  ] = useLazyGetAllPayrollQuery()

  const [
    updatePayrollById,
    { isLoading: isLoadingPut }
  ] = useUpdatePayrollByIdMutation()

  const [
    createPayroll,
    { isLoading: isLoadingPost }
  ] = useCreatePayrollMutation()

  const [
    deletePayrollById,
    { isLoading: isLoadingDelete }
  ] = useDeletePayrollByIdMutation()

  // Fetch initial data on component mount
  useEffect(() => {
    getAllPayroll({}) // Fetch all payroll records initially
  }, [getAllPayroll])

  const handleSubmitFilters = (filters) => {
    setCurrentFilters(filters) // Store filters
    getAllPayroll(filters) // Fetch data with new filters
  }

  const handleSubmit = async (values, payrollId) => {
    try {
      const action = payrollId ? updatePayrollById : createPayroll
      const payload = payrollId ? { id: payrollId, data: values } : values

      await action(payload).unwrap()

      setAlertProps({
        alertTitle: t(payrollId ? 'update_record' : 'add_record'),
        alertMessage: t(
          payrollId ? 'updated_successfully' : 'added_successfully'
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
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: t('operation_failed'),
        cancel: false,
        success: false,
        destructive: true,
        variantDestructive: 'destructive'
      })
      setOpenAlertDialog(true)
    }
  }

  const handleAddDialog = () => {
    setActionDialog(t('add_payroll')) // Adjust translation key
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_payroll')) // Adjust translation key
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
            await deletePayrollById(id).unwrap()

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
             setAlertProps({
               alertTitle: t('error'),
               alertMessage: t('delete_failed'),
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
      <BackDashBoard link={'/home'} moduleName={t('payroll')} /> {/* Adjust module name */}
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingPayroll ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingPayroll) && <Spinner />}

        <div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-1 md:col-span-5'>
            <PayrollFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='w-full col-span-1 md:col-span-5'>
            <PayrollDatatable
              dataPayroll={dataPayroll} // Pass payroll data
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <PayrollDialog
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

export default Payroll 