import DataTable from '../../../components/dataTable/DataTable'
import { columnDefNews } from '../utils'
import { useMemo } from 'react'

export const NewsDatatable = ({
  dataNews,
  setSelectedRow,
  setOpenDialog,
  setActionDialog
}) => {
  const columns = useMemo(() => columnDefNews, [])

  const handleEditDialog = () => {
    setActionDialog('Edit')
    setOpenDialog(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={dataNews?.data}
        setSelectedRow={setSelectedRow}
        handleRow={handleEditDialog}
      />
    </>
  )
}
