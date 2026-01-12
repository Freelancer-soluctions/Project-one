import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import {
  useUpdateCategoryByIdMutation,
  useCreateCategoryMutation,
  useDeleteCategoryByIdMutation
} from '../api/SettingsProductCategoriesAPI'
import { Spinner } from '@/components/loader/Spinner'
import { SettingsProductCategoriesBasicInfo } from './SettingsProductCategoriesBasicInfo'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { useState } from 'react'
import PropTypes from 'prop-types'

export function SettingsProductsCategoryForm( {onClose, selectedRow } ) {
  const { t } = useTranslation()
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const [alertProps, setAlertProps] = useState({})

  const [
    updateCategoryById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateCategoryByIdMutation()

  const [
    createCategory,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateCategoryMutation()

  const [
    deleteCategoryById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteCategoryByIdMutation()

  const handleSubmitCreateEdit = async data => {
    if (!data) return

    if (data.id) {
      await updateCategoryById({
        id: data.id,
        data: {
          description: data.description,
          code: data.code,
        }
      }).unwrap()
    } else {
      await createCategory({
        description: data.description,
        code: data.code,
      }).unwrap()
    } 

    setOpenAlertDialog(true)
    setAlertProps({
      alertTitle: data.id ? t('update_record') : t('add_record'),
      alertMessage: data.id
        ? t('updated_successfully')
        : t('added_successfully'),
      cancel: false,
      success: true,
      onSuccess: () => {
        onClose()
      },
      variantSuccess: 'info'
    })
  }

  const handleDeleteProductById = async id => {
    if (!id) return
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
            await deleteCategoryById(id).unwrap()

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                onClose()
              },
              variantSuccess: 'info'
            })
            setOpenAlertDialog(true) // Open alert dialog
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
  
      <div className='relative'>
        {(
          isLoadingPost ||
          isLoadingPut ||
          isLoadingDelete 
          ) && <Spinner />}

        <div className='container flex flex-col min-h-screen'>
          <main className='container flex-1 py-6'>
            <Tabs defaultValue='info' className='mb-6'>
              <TabsList className='grid w-full grid-cols-1'>
                <TabsTrigger value='info'>{t('basic_information')}</TabsTrigger>
              </TabsList>

              <TabsContent value='info' className='mt-4'>
                <SettingsProductCategoriesBasicInfo
                  onSubmitCreateEdit={handleSubmitCreateEdit}
                  onDelete={handleDeleteProductById}
                  selectedRow={selectedRow}
                  onClose={onClose}
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

SettingsProductsCategoryForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  selectedRow: PropTypes.object.isRequired
}
