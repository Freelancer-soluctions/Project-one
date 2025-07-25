import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import {
  useUpdateUserByIdMutation,
  useDeleteUserByIdMutation,
  useGetAllUsersStatusQuery,
  useGetAllUsersRolQuery
} from '../api/usersApi'
import { Spinner } from '@/components/loader/Spinner'
import { UsersBasicInfo } from '../components'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { useNavigate, useLocation } from 'react-router'
import { useState, useEffect } from 'react'

function UsersForms() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedRow, setSelectedRow] = useState()
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const [alertProps, setAlertProps] = useState({})
  const location = useLocation()

  useEffect(() => {
    if (location.state?.row) {
      setSelectedRow(location.state.row)
    } else {
      setSelectedRow({})
    }
  }, [location.state])

  const [
    updateUserById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateUserByIdMutation()

  const {
    data: dataUsersStatus = { data: [] },
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus
  } = useGetAllUsersStatusQuery()

  const [
    deleteUserById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteUserByIdMutation()

  const {
    data: dataUsersRol = { data: [] },
    isLoading: isLoadingRol,
    isFetching: isFetchingRol
  } = useGetAllUsersRolQuery()

  const handleSubmit = async values => {
    debugger
    try {
      const result = await updateUserById({
        id: values.id,
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
          roleId: values.roles.id,
          statusId: values.status.id,
          accessConfiguration: values.accessConfiguration,
          accessNews: values.accessNews,
        }
      }).unwrap()

      setAlertProps({
        alertTitle: t('update_record'),
        alertMessage: t('updated_successfully'),
        cancel: false,
        success: true,
        onSuccess: () => {
          navigate('/home/users')
        },
        variantSuccess: 'info'
      })
      setOpenAlertDialog(true)
    } catch (err) {
      console.error('Error:', err)
    }
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
      <BackDashBoard link={'/home/users'} moduleName={t('edit_users')} />
      <div className='relative'>
        {(isLoadingPut ||
          isLoadingDelete ||
          isLoadingStatus ||
          isLoadingRol ||
          isFetchingRol ||
          isFetchingStatus) && <Spinner />}

        <div className='container flex flex-col min-h-screen'>
          <main className='container flex-1 py-6'>
            <Tabs defaultValue='info' className='mb-6'>
              <TabsList className='grid w-full grid-cols-1'>
                <TabsTrigger value='info'>{t('basic_information')}</TabsTrigger>
              </TabsList>

              <TabsContent value='info' className='mt-4'>
                <UsersBasicInfo
                  onSubmit={handleSubmit}
                  onDelete={handleDelete}
                  dataStatus={dataUsersStatus?.data}
                  dataRol={dataUsersRol?.data}
                  selectedRow={selectedRow}
                />
              </TabsContent>
            </Tabs>
            <AlertDialogComponent
              openAlertDialog={openAlertDialog}
              setOpenAlertDialog={setOpenAlertDialog}
              alertProps={alertProps}
            />
          </main>
        </div>
      </div>
    </>
  )
}
export default UsersForms
