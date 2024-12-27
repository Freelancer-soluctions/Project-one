import { useState } from 'react'
import { NewsFiltersForm, NewsDialog, NewsDatatable } from '../components/index'
import { Spinner } from '@/components/loader/Spinner'
import {
  useLazyGetAllNewsQuery,
  useGetAllNewsStatusQuery
} from '../slice/newsSlice'

const News = () => {
  const [selectedRow, setSelectedRow] = useState({}) //data from datatable
  const [openDialog, setOpenDialog] = useState(false) //dialog open/close
  const [actionDialog, setActionDialog] = useState('') //actionDialog edit / add

  // filter form
  const [
    trigger,
    {
      data: dataNews = { data: [] },
      isError,
      isLoading,
      isFetching,
      isSuccess,
      error
    },
    lastPromiseInfo
  ] = useLazyGetAllNewsQuery()

  const {
    data: datastatus,
    isError: isErrorStatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    isSuccess: isSuccessStatus,
    error: errorStatus
  } = useGetAllNewsStatusQuery()

  // pass to utils file
  const uppercaseFunction = e => {
    const value = e.target.value.toUpperCase()
  }

  return (
    <div className='relative'>
      {/* Show spinner when loading or fetching */}
      {(isLoading || isFetching) && <Spinner />}

      <div className='grid grid-cols-2 grid-rows-3 gap-4 md:grid-cols-5'>
        {/* filters */}
        <div className='col-span-2 row-span-1 md:col-span-4'>
          <NewsFiltersForm
            trigger={trigger}
            setActionDialog={setActionDialog}
            setOpenDialog={setOpenDialog}
            datastatus={datastatus}
          />
        </div>
        {/* Datatable */}
        <div className='flex flex-wrap w-full col-span-2 row-span-2 row-start-2 md:col-span-5'>
          <NewsDatatable
            dataNews={dataNews}
            setSelectedRow={setSelectedRow}
            setOpenDialog={setOpenDialog}
            setActionDialog={setActionDialog}
          />
        </div>
        {/* Dialog */}
        <NewsDialog
          openDialog={openDialog}
          setSelectedRow={setSelectedRow}
          selectedRow={selectedRow}
          setOpenDialog={setOpenDialog}
          actionDialog={actionDialog}
          datastatus={datastatus}
        />
      </div>
    </div>
  )
}
export default News
