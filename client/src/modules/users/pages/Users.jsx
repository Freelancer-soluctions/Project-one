import {
  UsersFiltersForm,
  UsersDialog,
  UsersDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllUsersQuery,
  useUpdateUserByIdMutation,
  useCreateUserMutation,
  useDeleteUserByIdMutation
} from '../api/usersApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Users = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllUsers,
    {
      data: dataUsers = { data: [] },
      isLoading: isLoadingUsers,
      isFetching: isFetchingUsers
    }
  ] = useLazyGetAllUsersQuery()

  const [
    updateUserById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateUserByIdMutation()

  const [
    createUser,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateUserMutation()

  const [
    deleteUserById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteUserByIdMutation()

  const handleSubmitFilters = data => {
    getAllUsers({
      ...data
    })
  }

  const handleSubmit = async (values, userId) => {
    try {
      const result = userId
        ? await updateUserById({
            id: userId,
            data: {
              name: values.name,
              email: values.email,
              telephone: values.telephone,
              address: values.address,
              birthday: values.birthday,
              startDate: values.startDate,
              socialSecurity: values.socialSecurity,
              zipcode: values.zipcode,
              state: values.state,
              city: values.city,
              isAdmin: values.isAdmin,
              picture: values.picture,
              document: values.document,
              roleId: values.roleId,
              statusId: values.statusId,
              userPermitId: values.userPermitId
            }
          }).unwrap()
        : await createUser({
            name: values.name,
            email: values.email,
            telephone: values.telephone,
            address: values.address,
            birthday: values.birthday,
            startDate: values.startDate,
            socialSecurity: values.socialSecurity,
            zipcode: values.zipcode,
            state: values.state,
            city: values.city,
            isAdmin: values.isAdmin,
            picture: values.picture,
            document: values.document,
            roleId: values.roleId,
            statusId: values.statusId,
            userPermitId: values.userPermitId
          }).unwrap()

      setAlertProps({
        alertTitle: t(userId ? 'update_record' : 'add_record'),
        alertMessage: t(
          userId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_user'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_user'))
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
            await deleteUserById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('users')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingUsers ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingUsers) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <UsersFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <UsersDatatable
              dataUsers={dataUsers}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <UsersDialog
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

export default Users