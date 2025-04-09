import {
  VacationFiltersForm,
  VacationDialog,
  VacationDatatable
} from '../components' // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllVacationsQuery,
  useUpdateVacationByIdMutation,
  useCreateVacationMutation,
  useDeleteVacationByIdMutation
} from '../api/vacationApi' // Adjusted import path
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Vacation = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')
  const [currentFilters, setCurrentFilters] = useState({}) // State to hold current filters

  const [
    getAllVacations,
    {
      data: dataVacations = { data: [] },
      isLoading: isLoadingVacations,
      isFetching: isFetchingVacations,
      refetch
    }
  ] = useLazyGetAllVacationsQuery()

  const [
    updateVacationById,
    { isLoading: isLoadingPut }
  ] = useUpdateVacationByIdMutation()

  const [
    createVacation,
    { isLoading: isLoadingPost }
  ] = useCreateVacationMutation()

  const [
    deleteVacationById,
    { isLoading: isLoadingDelete }
  ] = useDeleteVacationByIdMutation()

  // Fetch initial data
  useEffect(() => {
    getAllVacations({}) // Fetch all initially
  }, [getAllVacations])

  const handleSubmitFilters = (filters) => {
    setCurrentFilters(filters)
    getAllVacations(filters)
  }

  const handleSubmit = async (values, vacationId) => {
    try {
      const action = vacationId ? updateVacationById : createVacation
      const payload = vacationId ? { id: vacationId, data: values } : values

      await action(payload).unwrap()

      setAlertProps({
        alertTitle: t(vacationId ? 'update_record' : 'add_record'),
        alertMessage: t(
          vacationId ? 'updated_successfully' : 'added_successfully'
        ),
        cancel: false,
        success: true,
        onSuccess: () => {
          setOpenDialog(false)
          refetch()
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
    setActionDialog(t('add_vacation')) // Adjust key
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_vacation')) // Adjust key
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
            await deleteVacationById(id).unwrap()

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                setOpenDialog(false)
                refetch()
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
      <BackDashBoard link={'/home'} moduleName={t('vacation')} /> {/* Adjust module name */}
      <div className='relative'>
        {/* Spinner */}
        {(isLoadingVacations ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingVacations) && <Spinner />}

        <div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-1 md:col-span-5'>
            <VacationFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='w-full col-span-1 md:col-span-5'>
            <VacationDatatable
              dataVacations={dataVacations} // Pass vacation data
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <VacationDialog
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

export default Vacation 