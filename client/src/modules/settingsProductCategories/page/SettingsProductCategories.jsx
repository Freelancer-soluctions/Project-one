import {
  SettingsProductCategoriesFiltersForm,
  SettingsProductCategoriesDatatable,
  SettingsProductsCategoryForm
} from '../components/index'
import { useLazyGetAllCategoriesQuery } from '../api/SettingsProductCategoriesAPI'
import { Spinner } from '@/components/loader/Spinner'
import { useState } from 'react' 

export const SettingsProductCategories = () => {
  const [showForm, setShowForm] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)

  const [
    getAllCategories,
    {
      data: dataCategories = { data: [] },
      isLoading: isLoadingCategories,
      isFetching: isFetchingCategories
    }
  ] = useLazyGetAllCategoriesQuery()



  const handleSubmitFilters = data => {
    getAllCategories(data)
  }

  const handleCategory = row => {
    setShowForm(true)
    setSelectedRow(row)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedRow(null)
  }

  return (
    <>
      {showForm ? (
        <SettingsProductsCategoryForm
          onClose={handleCloseForm}
          selectedRow={selectedRow}
        />
      ) : (
        <div className='relative p-4'>
          {/* Show spinner when loading or fetching */}
          {(isLoadingCategories || isFetchingCategories) && <Spinner />}

          <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
            {/* filters */}
            <div className='col-span-2 row-span-1 md:col-span-5'>
              <SettingsProductCategoriesFiltersForm
                onSubmit={handleSubmitFilters}
                onAdd={handleCategory}
              />
            </div>
            {/* Datatable */}
            <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
              <SettingsProductCategoriesDatatable
                dataCategories={dataCategories}
                onEdit={handleCategory}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
