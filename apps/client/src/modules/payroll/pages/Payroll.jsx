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
import { useGetAllEmployeesFiltersQuery } from '@/modules/employees/api/employeesApi' // Assuming employee API exists

import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Payroll = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20
  })
  const [filters, setFilters] = useState({})

  const {
    data: dataEmployees = { data: [] },
    isLoading: isLoadingEmployees,
    isFetching: isFetchingEmployees
  } = useGetAllEmployeesFiltersQuery()

  const [
    getAllPayroll,
    {
      data: dataPayroll = { data: [] },
      isLoading: isLoadingPayroll,
      isFetching: isFetchingPayroll,
      refetch // Add refetch to manually trigger data fetching
    }
  ] = useLazyGetAllPayrollQuery()

  const [updatePayrollById, { isLoading: isLoadingPut }] =
    useUpdatePayrollByIdMutation()

  const [createPayroll, { isLoading: isLoadingPost }] =
    useCreatePayrollMutation()

  const [deletePayrollById, { isLoading: isLoadingDelete }] =
    useDeletePayrollByIdMutation()

  /**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend.
   *
   * Se ejecuta automáticamente:
   * - Al montar el componente (primer render)
   * - Cuando cambia la página
   * - Cuando cambia el tamaño de página
   * - Cuando cambian los filtros
   *
   * No se realizan llamadas manuales al backend desde handlers
   * para evitar duplicación de lógica y estados inconsistentes.
   */
  useEffect(() => {
    getAllPayroll({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters
    })
  }, [pagination.pageIndex, pagination.pageSize, filters])

  /**
   * Al aplicar nuevos filtros:
   * - Se resetea la página a la primera (pageIndex = 0)
   * - Se actualiza el estado de filtros
   *
   * No se llama directamente al backend aquí.
   * El cambio de estado dispara el useEffect, manteniendo
   * un flujo reactivo y predecible.
   */
  const handleSubmitFilters = newFilters => {
    setPagination(prev => ({
      ...prev,
      pageIndex: 0
    }))

    setFilters(newFilters)
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
      <BackDashBoard link={'/home'} moduleName={t('payroll')} />{' '}
      {/* Adjust module name */}
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingPayroll ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingEmployees ||
          isFetchingEmployees ||
          isFetchingPayroll) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <PayrollFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              dataEmployees={dataEmployees.data} // Pass employee data for filters
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <PayrollDatatable
              dataPayroll={dataPayroll} // Pass payroll data
              onEditDialog={handleEditDialog}
              pagination={pagination}
              onPaginationChange={setPagination}
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
            dataEmployees={dataEmployees.data} // Pass employee data for dialog
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
