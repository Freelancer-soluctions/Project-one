import {
  PermissionFiltersForm,
  PermissionDialog,
  PermissionDatatable
} from '../components' // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllPermissionsQuery,
  useUpdatePermissionByIdMutation,
  useCreatePermissionMutation,
  useDeletePermissionByIdMutation
} from '../api/permissionApi' // Adjusted import path
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Permission = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')
  const [currentFilters, setCurrentFilters] = useState({}) // State to hold current filters

  const [
    getAllPermissions,
    {
      data: dataPermissions = { data: [] },
      isLoading: isLoadingPermissions,
      isFetching: isFetchingPermissions,
      refetch
    }
  ] = useLazyGetAllPermissionsQuery()

  const [
    updatePermissionById,
    { isLoading: isLoadingPut }
  ] = useUpdatePermissionByIdMutation()

  const [
    createPermission,
    { isLoading: isLoadingPost }
  ] = useCreatePermissionMutation()

  const [
    deletePermissionById,
    { isLoading: isLoadingDelete }
  ] = useDeletePermissionByIdMutation()

  // Fetch initial data
  useEffect(() => {
    getAllPermissions({}) // Fetch all initially
  }, [getAllPermissions])

  const handleSubmitFilters = (filters) => {
    setCurrentFilters(filters)
    getAllPermissions(filters)
  }

  const handleSubmit = async (values, permissionId) => {
    try {
      const action = permissionId ? updatePermissionById : createPermission
      const payload = permissionId ? { id: permissionId, data: values } : values

      await action(payload).unwrap()

      setAlertProps({
        alertTitle: t(permissionId ? 'update_record' : 'add_record'),
        alertMessage: t(
          permissionId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_permission')) // Adjust key
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_permission')) // Adjust key
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
            await deletePermissionById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('permission')} /> {/* Adjust module name */}
      <div className='relative'>
        {/* Spinner */}
        {(isLoadingPermissions ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingPermissions) && <Spinner />}

        <div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-1 md:col-span-5'>
            <PermissionFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='w-full col-span-1 md:col-span-5'>
            <PermissionDatatable
              dataPermissions={dataPermissions} // Pass permission data
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <PermissionDialog
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

export default Permission 