import DataTable from '../../../components/dataTable/DataTable'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'

export const NewsDatatable = ({
  dataNews,
  setSelectedRow,
  setOpenDialog,
  setActionDialog
}) => {
  const { t } = useTranslation()
  const columnDefNews = [
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(info.getValue(), 'dd/MM/yyyy')
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: info => {
        const value = info.getValue()
        return value.length > 30 ? `${value.slice(0, 30)}...` : value
      }
    },
    {
      accessorKey: 'status.description',
      header: t('status')
    },
    {
      accessorKey: 'userNewsCreated.name',
      header: t('created_by'),
      cell: info => {
        const userNewsCreated = info.row.original.userNewsCreated // Accede al dato original de la fila
        return userNewsCreated?.name ? userNewsCreated.name.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'userNewsPending.name',
      header: t('pending_by'),
      cell: info => {
        const userNewsPending = info.row.original.userNewsPending // Accede al dato original de la fila
        return userNewsPending?.name ? userNewsPending.name.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'pendingOn',
      header: t('pending_on'),
      cell: info =>
        info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : ''
    },
    {
      accessorKey: 'userNewsClosed.name',
      header: t('closed_by'),
      cell: info => {
        const userNewsClosed = info.row.original.userNewsClosed // Accede al dato original de la fila
        return userNewsClosed?.name ? userNewsClosed.name.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'closedOn',
      header: t('closed_on'),
      cell: info =>
        info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : ''
    }
  ]
  const columns = useMemo(() => columnDefNews, [])

  const handleEditDialog = () => {
    setActionDialog(t('edit_new'))
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
