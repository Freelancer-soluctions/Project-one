import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ProvidersDatatable = ({
  dataProviders,
  isLoadingProviders,
  isFetchingProviders,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation()

  const columnDefProviders = [
    {
      accessorKey: 'description',
      header: t('description')
    },
    {
      accessorKey: 'status.description',
      header: t('status'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'userProvidersCreated.name',
      header: t('created_by'),
      cell: info => {
        const userProvidersCreated = info.row.original.userProvidersCreated
        return userProvidersCreated?.name ? userProvidersCreated.name.toUpperCase() : null
      }
    },
    {
      accessorKey: 'userProvidersPending.name',
      header: t('pending_by'),
      cell: info => {
        const userProvidersPending = info.row.original.userProvidersPending
        return userProvidersPending?.name ? userProvidersPending.name.toUpperCase() : null
      }
    },
    {
      accessorKey: 'pendingOn',
      header: t('pending_on'),
      cell: info => {
        const date = info.getValue()
        return date ? format(new Date(date), 'PPP') : null
      }
    },
    {
      accessorKey: 'userProvidersClosed.name',
      header: t('closed_by'),
      cell: info => {
        const userProvidersClosed = info.row.original.userProvidersClosed
        return userProvidersClosed?.name ? userProvidersClosed.name.toUpperCase() : null
      }
    },
    {
      accessorKey: 'closedOn',
      header: t('closed_on'),
      cell: info => {
        const date = info.getValue()
        return date ? format(new Date(date), 'PPP') : null
      }
    }
  ]

  return (
    <DataTable
      columns={columnDefProviders}
      data={dataProviders.data}
      isLoading={isLoadingProviders}
      isFetching={isFetchingProviders}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

ProvidersDatatable.propTypes = {
  dataProviders: PropTypes.object.isRequired,
  isLoadingProviders: PropTypes.bool,
  isFetchingProviders: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}
