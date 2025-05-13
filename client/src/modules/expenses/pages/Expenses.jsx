import {
  ExpensesFiltersForm, // Changed
  ExpensesDialog,      // Changed
  ExpensesDatatable    // Changed
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react' // Removed useEffect as it wasn't used for initial fetch in Clients.jsx
import {
  useLazyGetAllExpensesQuery,  // Changed
  useUpdateExpenseByIdMutation, // Changed
  useCreateExpenseMutation,    // Changed
  useDeleteExpenseByIdMutation // Changed
} from '../api/expensesApi'     // Changed
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Expenses = () => { // Changed component name
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllExpenses, // Changed
    {
      data: dataExpenses = { data: [] }, // Changed
      isLoading: isLoadingExpenses,      // Changed
      isFetching: isFetchingExpenses     // Changed
    }
  ] = useLazyGetAllExpensesQuery() // Changed

  const [
    updateExpenseById, // Changed
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateExpenseByIdMutation() // Changed

  const [
    createExpense, // Changed
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateExpenseMutation() // Changed

  const [
    deleteExpenseById, // Changed
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteExpenseByIdMutation() // Changed

  const handleSubmitFilters = data => {
    getAllExpenses({ // Changed
      ...data
      // Ensure backend handles empty strings as "no filter" or adjust here
    })
  }

  const handleSubmit = async (values, expenseId) => { // Changed expenseId
    try {
      // values already contains { description, total, category, status }
      // total is already a float from ExpensesDialog
      const result = expenseId // Changed
        ? await updateExpenseById({ // Changed
            id: expenseId, // Changed
            data: values // Sending all values from dialog form
          }).unwrap()
        : await createExpense(values).unwrap() // Changed, sending all values

      setAlertProps({
        alertTitle: t(expenseId ? 'update_record' : 'add_record'), // Changed expenseId
        alertMessage: t(
          expenseId ? 'updated_successfully' : 'added_successfully' // Changed expenseId
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
      // Handle error display, perhaps another AlertDialog
      setAlertProps({
        alertTitle: t('error_occurred'),
        alertMessage: err.data?.message || err.message || t('operation_failed'),
        cancel: false,
        success: true, // To show only one button "OK"
        onSuccess: () => { /* stay on dialog or close if needed */ },
        variantSuccess: 'destructive' // Show error styling
      });
      setOpenAlertDialog(true);
    }
  }

  const handleAddDialog = () => {
    setActionDialog(t('add_expense')) // Changed
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_expense')) // Changed
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
            await deleteExpenseById(id).unwrap() // Changed

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
            // No need to call setOpenAlertDialog(true) here again if already open for confirmation
            // If the confirmation dialog closes itself, then we might need to show a new success alert.
            // Assuming the current AlertDialogComponent handles closing and then this sets new props for a new one.
             setOpenAlertDialog(true)
          } catch (err) {
            console.error('Error deleting:', err)
            setAlertProps({
              alertTitle: t('error_occurred'),
              alertMessage: err.data?.message || err.message || t('delete_failed'),
              cancel: false,
              success: true,
              onSuccess: () => {},
              variantSuccess: 'destructive'
            });
            setOpenAlertDialog(true);
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
      <BackDashBoard link={'/home'} moduleName={t('expenses')} /> {/* Changed */}
      <div className='relative'>
        {(isLoadingExpenses || // Changed
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingExpenses) && <Spinner />} {/* Changed */}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ExpensesFiltersForm // Changed
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ExpensesDatatable // Changed
              dataExpenses={dataExpenses} // Changed
              onEditDialog={handleEditDialog}
            />
          </div>
          <ExpensesDialog // Changed
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

export default Expenses // Changed