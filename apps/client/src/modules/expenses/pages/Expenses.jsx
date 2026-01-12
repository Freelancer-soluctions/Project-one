import {
  ExpensesFiltersForm,
  ExpensesDialog,
  ExpensesDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react' // Removed useEffect as it wasn't used for initial fetch in Clients.jsx
import {
  useLazyGetAllExpensesQuery,
  useUpdateExpenseByIdMutation,
  useCreateExpenseMutation,
  useDeleteExpenseByIdMutation
} from '../api/expensesApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Expenses = () => {
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

  const [
    getAllExpenses,
    {
      data: dataExpenses = { data: [] },
      isLoading: isLoadingExpenses,
      isFetching: isFetchingExpenses
    }
  ] = useLazyGetAllExpensesQuery()

  const [
    updateExpenseById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateExpenseByIdMutation()

  const [
    createExpense,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateExpenseMutation()

  const [
    deleteExpenseById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteExpenseByIdMutation()

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
    getAllExpenses({
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

  const handleSubmit = async (values, expenseId) => {
    try {
      // values already contains { description, total, category, status }
      // total is already a float from ExpensesDialog
      const result = expenseId
        ? await updateExpenseById({
            id: expenseId,
            data: {
              description: values.description,
              total: values.total,
              category: values.category
            } // Sending all values from dialog form
          }).unwrap()
        : await createExpense(values).unwrap()

      setAlertProps({
        alertTitle: t(expenseId ? 'update_record' : 'add_record'),
        alertMessage: t(
          expenseId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_expense'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_expense'))
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
            await deleteExpenseById(id).unwrap()

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                setOpenDialog(false) // Close main dialog if delete was from there
              },
              variantSuccess: 'info'
            })
            setOpenAlertDialog(true)
          } catch (err) {
            console.error('Error deleting:', err)
            setAlertProps({
              alertTitle: t('error_occurred_message'),
              alertMessage:
                err.data?.message || err.message || t('delete_failed_message'),
              cancel: false,
              success: true,
              onSuccess: () => {},
              variantSuccess: 'destructive'
            })
            setOpenAlertDialog(true)
          }
        }
      })
      setOpenAlertDialog(true)
    } catch (err) {
      // This catch is unlikely to be hit if the main action is in onDelete,
      // but kept for safety.
      console.error('Error preparing delete confirmation:', err)
    }
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('expenses')} />
      {/* Changed */}
      <div className='relative'>
        {(isLoadingExpenses ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingExpenses) && <Spinner />}
        {/* Changed */}
        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ExpensesFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ExpensesDatatable
              dataExpenses={dataExpenses}
              onEditDialog={handleEditDialog}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
          <ExpensesDialog
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

export default Expenses
