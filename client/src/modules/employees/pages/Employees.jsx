import {
  EmployeesFiltersForm,
  EmployeesDialog,
  EmployeesDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllEmployeesQuery,
  useUpdateEmployeeByIdMutation,
  useCreateEmployeeMutation,
  useDeleteEmployeeByIdMutation
} from '../api/employeesApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Employees = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllEmployees,
    {
      data: dataEmployees = { data: [] },
      isLoading: isLoadingEmployees,
      isFetching: isFetchingEmployees
    }
  ] = useLazyGetAllEmployeesQuery()

  const [
    updateEmployeeById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateEmployeeByIdMutation()

  const [
    createEmployee,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateEmployeeMutation()

  const [
    deleteEmployeeById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteEmployeeByIdMutation()

  const handleSubmitFilters = data => {
    getAllEmployees({
      ...data
    })
  }

  const handleSubmit = async (values, employeeId) => {
    try {
      const result = employeeId
        ? await updateEmployeeById({
            id: employeeId,
            data: {
              name: values.name,
              lastName: values.lastName,
              dni: values.dni,
              email: values.email,
              phone: values.phone,
              address: values.address,
              startDate: values.startDate,
              position: values.position,
              department: values.department,
              salary: values.salary
            }
          }).unwrap()
        : await createEmployee({
            name: values.name,
            lastName: values.lastName,
            dni: values.dni,
            email: values.email,
            phone: values.phone,
            address: values.address,
            startDate: values.startDate,
            position: values.position,
            department: values.department,
            salary: values.salary
          }).unwrap()

      setAlertProps({
        alertTitle: t(employeeId ? 'update_record' : 'add_record'),
        alertMessage: t(
          employeeId ? 'updated_successfully' : 'added_successfully'
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
    }
  }

  const handleAddDialog = () => {
    setActionDialog(t('add_employee'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_employee'))
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
            await deleteEmployeeById(id).unwrap()

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
          }
        }
      })
      setOpenAlertDialog(true)
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('employees')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingEmployees ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingEmployees) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <EmployeesFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <EmployeesDatatable
              dataEmployees={dataEmployees}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <EmployeesDialog
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

export default Employees 