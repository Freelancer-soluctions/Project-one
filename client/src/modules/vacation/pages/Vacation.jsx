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
import { useGetAllEmployeesQuery } from '@/modules/employees/api/employeesApi' // Import employee query

import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Vacation = () => {
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

  const [
    getAllVacations,
    {
      data: dataVacations = { data: [] },
      isLoading: isLoadingVacations,
      isFetching: isFetchingVacations,
      refetch
    }
  ] = useLazyGetAllVacationsQuery()

  const [updateVacationById, { isLoading: isLoadingPut }] =
    useUpdateVacationByIdMutation()

  const [createVacation, { isLoading: isLoadingPost }] =
    useCreateVacationMutation()

  const [deleteVacationById, { isLoading: isLoadingDelete }] =
    useDeleteVacationByIdMutation()

  // Fetch initial data
  useEffect(() => {
    getAllVacations({}) // Fetch all initially
  }, [getAllVacations])

  const handleSubmitFilters = filters => {
    getAllVacations(filters)
  }

  const handleSubmit = async (values, vacationId) => {
    try {
      const action = vacationId ? updateVacationById : createVacation
      const payload = vacationId
        ? {
            id: vacationId,
            data: {
              employeeId: values.employeeId,
              startDate: values.startDate,
              endDate: values.endDate,
              status: values.status
            }
          }
        : values

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
      <BackDashBoard link={'/home'} moduleName={t('vacation')} />{' '}
      {/* Adjust module name */}
      <div className='relative'>
        {/* Spinner */}
        {(isLoadingVacations ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingEmployees ||
          isFetchingEmployees ||
          isFetchingVacations) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <VacationFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              dataEmployees={dataEmployees.data} // Pass employee data
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
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
            dataEmployees={dataEmployees.data} // Pass employee data
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
