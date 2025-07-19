import {
  PerformanceEvaluationFiltersForm,
  PerformanceEvaluationDialog,
  PerformanceEvaluationDatatable
} from '../components' // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllPerformanceEvaluationsQuery,
  useUpdatePerformanceEvaluationByIdMutation,
  useCreatePerformanceEvaluationMutation,
  useDeletePerformanceEvaluationByIdMutation
} from '../api/performanceEvaluationApi' // Adjusted import path
import { useGetAllEmployeesQuery } from '@/modules/employees/api/employeesApi' // Import employee query

import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const PerformanceEvaluation = () => {
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
    getAllEvaluations, // Renamed for clarity
    {
      data: dataEvaluations = { data: [] },
      isLoading: isLoadingEvaluations,
      isFetching: isFetchingEvaluations,
      refetch
    }
  ] = useLazyGetAllPerformanceEvaluationsQuery()

  const [
    updateEvaluationById, // Renamed
    { isLoading: isLoadingPut }
  ] = useUpdatePerformanceEvaluationByIdMutation()

  const [
    createEvaluation, // Renamed
    { isLoading: isLoadingPost }
  ] = useCreatePerformanceEvaluationMutation()

  const [
    deleteEvaluationById, // Renamed
    { isLoading: isLoadingDelete }
  ] = useDeletePerformanceEvaluationByIdMutation()

  // Fetch initial data
  useEffect(() => {
    getAllEvaluations({}) // Fetch all initially
  }, [getAllEvaluations])

  const handleSubmitFilters = filters => {
    getAllEvaluations(filters)
  }

  const handleSubmit = async (values, evaluationId) => {
    try {
      const action = evaluationId ? updateEvaluationById : createEvaluation
      const payload = evaluationId
        ? {
            id: evaluationId,
            data: {
              employeeId: values.employeeId,
              date: values.date,
              calification: values.calification,
              comments: values.comments
            }
          }
        : values

      await action(payload).unwrap()

      setAlertProps({
        alertTitle: t(evaluationId ? 'update_record' : 'add_record'),
        alertMessage: t(
          evaluationId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_evaluation')) // Adjust key
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_evaluation')) // Adjust key
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
            await deleteEvaluationById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('performance_evaluation')} />
      {/* Adjust module name */}
      <div className='relative'>
        {/* Spinner */}
        {(isLoadingEvaluations ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingEmployees ||
          isFetchingEmployees ||
          isFetchingEvaluations) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <PerformanceEvaluationFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              dataEmployees={dataEmployees.data} // Pass employee data
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <PerformanceEvaluationDatatable
              dataEvaluations={dataEvaluations} // Pass evaluation data
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <PerformanceEvaluationDialog
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

export default PerformanceEvaluation
