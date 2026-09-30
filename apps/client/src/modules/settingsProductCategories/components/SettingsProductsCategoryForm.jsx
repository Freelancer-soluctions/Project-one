import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import {
  useUpdateCategoryByIdMutation,
  useCreateCategoryMutation,
  useDeleteCategoryByIdMutation,
} from '../api/SettingsProductCategoriesAPI';
import { Spinner } from '@/components/loader/Spinner';
import { SettingsProductCategoriesBasicInfo } from './SettingsProductCategoriesBasicInfo';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { useState } from 'react';
import PropTypes from 'prop-types';

/** Success alert props for the create/update flow (closes on OK). */
const buildSuccessAlertProps = ({ t, isEdit, onClose }) => ({
  alertTitle: t(isEdit ? 'update_record' : 'add_record'),
  alertMessage: t(isEdit ? 'updated_successfully' : 'added_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    onClose();
  },
  variantSuccess: 'info',
});

/** Success alert props after a record is deleted. */
const buildDeletedAlertProps = ({ t, onClose }) => ({
  alertTitle: '',
  alertMessage: t('deleted_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    onClose();
  },
  variantSuccess: 'info',
});

/** Save handler: create or update the category, then show the alert. */
const makeSaveHandler =
  ({
    t,
    updateCategoryById,
    createCategory,
    setAlertProps,
    setOpenAlertDialog,
    onClose,
  }) =>
  async (data) => {
    if (!data) return;

    if (data.id) {
      await updateCategoryById({
        id: data.id,
        data: {
          description: data.description,
          code: data.code,
        },
      }).unwrap();
    } else {
      await createCategory({
        description: data.description,
        code: data.code,
      }).unwrap();
    }

    setOpenAlertDialog(true);
    setAlertProps(buildSuccessAlertProps({ t, isEdit: !!data.id, onClose }));
  };

/** Delete-confirmation handler for a product category. */
const makeDeleteHandler =
  ({ t, deleteCategoryById, setAlertProps, setOpenAlertDialog, onClose }) =>
  async (id) => {
    if (!id) return;
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
            await deleteCategoryById(id).unwrap();

            setAlertProps(buildDeletedAlertProps({ t, onClose }));
            setOpenAlertDialog(true); // Open alert dialog
          } catch (err) {
            console.error('Error deleting:', err);
          }
        },
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

/**
 * Page state: category mutations and alert state for the category
 * form inside the settings product tab.
 */
function useCategoryFormPageState({ onClose }) {
  const { t } = useTranslation();
  const [openAlertDialog, setOpenAlertDialog] = useState(false); //alert dialog open/close
  const [alertProps, setAlertProps] = useState({});

  const [updateCategoryById, { isLoading: isLoadingPut }] =
    useUpdateCategoryByIdMutation();

  const [createCategory, { isLoading: isLoadingPost }] =
    useCreateCategoryMutation();

  const [deleteCategoryById, { isLoading: isLoadingDelete }] =
    useDeleteCategoryByIdMutation();

  const isLoadingPage = isLoadingPost || isLoadingPut || isLoadingDelete;

  return {
    t,
    onClose,
    openAlertDialog,
    setOpenAlertDialog,
    alertProps,
    setAlertProps,
    isLoadingPage,
    updateCategoryById,
    createCategory,
    deleteCategoryById,
  };
}

/** Static layout for the product category form. */
const buildCategoryFormLayout = ({ t, page, saveHandler, deleteHandler }) => (
  <>
    <div className="relative">
      {page.isLoadingPage && <Spinner />}

      <div className="container flex flex-col min-h-screen">
        <main className="container flex-1 py-6">
          <Tabs defaultValue="info" className="mb-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="info">{t('basic_information')}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <SettingsProductCategoriesBasicInfo
                onSubmitCreateEdit={saveHandler}
                onDelete={deleteHandler}
                selectedRow={page.selectedRow}
                onClose={page.onClose}
              />
            </TabsContent>
          </Tabs>
          <AlertDialogComponent
            openAlertDialog={page.openAlertDialog}
            setOpenAlertDialog={page.setOpenAlertDialog}
            alertProps={page.alertProps}
          />
        </main>
      </div>
    </div>
  </>
);

export function SettingsProductsCategoryForm({ onClose, selectedRow }) {
  const page = useCategoryFormPageState({ onClose });

  const saveHandler = makeSaveHandler({
    t: page.t,
    updateCategoryById: page.updateCategoryById,
    createCategory: page.createCategory,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    onClose: page.onClose,
  });
  const deleteHandler = makeDeleteHandler({
    t: page.t,
    deleteCategoryById: page.deleteCategoryById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    onClose: page.onClose,
  });

  return buildCategoryFormLayout({
    t: page.t,
    page: { ...page, selectedRow },
    saveHandler,
    deleteHandler,
  });
}

SettingsProductsCategoryForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  selectedRow: PropTypes.object.isRequired,
};
