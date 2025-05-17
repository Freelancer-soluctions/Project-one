import { UsersFiltersForm, UsersDatatable } from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import {
  useLazyGetAllUsersQuery,
  useGetAllUsersStatusQuery
} from '../api/usersApi'
import { Spinner } from '@/components/loader/Spinner'
import { useNavigate } from 'react-router'

const Users = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [
    getAllUsers,
    {
      data: dataUsers = { data: [] },
      isLoading: isLoadingUsers,
      isFetching: isFetchingUsers
    }
  ] = useLazyGetAllUsersQuery()

  const {
    data: dataUsersStatus = { data: [] },
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus
  } = useGetAllUsersStatusQuery()

  const handleSubmitFilters = data => {
    console.log('data', data)
    getAllUsers({
      ...data
    })
  }

  const handleUsersForms = row => {
    navigate('/home/userForm', { state: { row } })
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('users')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingUsers ||
          isFetchingUsers ||
          isLoadingStatus ||
          isFetchingStatus) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <UsersFiltersForm
              onSubmit={handleSubmitFilters}
              dataStatus={dataUsersStatus}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <UsersDatatable
              dataUsers={dataUsers}
              onOpenUsersForms={handleUsersForms}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Users
