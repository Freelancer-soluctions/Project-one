import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import {
  useLazyGetAllProductAttributesQuery,
  useCreateProductMutation,
  useUpdateProductByIdMutation,
  useDeleteProductByIdMutation,
  useDeleteProductAttributeByIdMutation,
  useSaveProductAttributesMutation,
} from '../api/productsAPI';
import { useLoadingState } from '@/hooks';
import { useProductsFilterData } from '../hooks';

import { Spinner } from '@/components/loader/Spinner';
import { ProductBasicInfo, ProductAttributes } from '../components';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { useNavigate, useLocation } from 'react-router';
import { useState, useEffect, useMemo } from 'react';

/** Success alert props for the create/update flow (navigates on OK). */
const buildSuccessAlertProps = ({ t, isEdit, navigate }) => ({
  alertTitle: t(isEdit ? 'update_record' : 'add_record'),
  alertMessage: t(isEdit ? 'updated_successfully' : 'added_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    navigate('/home/products');
  },
  variantSuccess: 'info',
});

/** Success alert props after a record is deleted. */
const buildDeletedAlertProps = ({ t, navigate }) => ({
  alertTitle: '',
  alertMessage: t('deleted_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    navigate('/home/products');
  },
  variantSuccess: 'info',
});

/** Success alert props after attributes are saved. */
const buildSavedAlertProps = ({ t, navigate }) => ({
  alertTitle: t('save_record'),
  alertMessage: t('saved_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    navigate('/home/products');
  },
  variantSuccess: 'info',
});

/** Delete-confirmation alert props. */
const buildDeleteConfirmAlertProps = ({ t, onDelete }) => ({
  alertTitle: t('delete_record'),
  alertMessage: t('request_delete_record'),
  cancel: true,
  success: false,
  destructive: true,
  variantSuccess: '',
  variantDestructive: 'destructive',
  onSuccess: () => {},
  onDelete,
});

/** Maps form data to the product payload (catalog objects → ids). */
const toProductPayload = (data) => ({
  cost: data.cost,
  name: data.name,
  price: data.price,
  sku: data.sku,
  description: data.description,
  barCode: data.barCode,
  productCategoryId: data.category.id,
  productStatusId: data.status.id,
  productProviderId: data.provider.id,
});

/** Save handler: create or update the product, then navigate back. */
const makeSaveHandler =
  ({
    t,
    updateProductById,
    saveProduct,
    setAlertProps,
    setOpenAlertDialog,
    navigate,
  }) =>
  async (data) => {
    if (!data) return;

    if (data.id) {
      await updateProductById({
        id: data.id,
        data: toProductPayload(data),
      }).unwrap();
    } else {
      await saveProduct(toProductPayload(data)).unwrap();
    }

    setOpenAlertDialog(true);
    setAlertProps(buildSuccessAlertProps({ t, isEdit: !!data.id, navigate }));
  };

/** Delete-confirmation handler for a product. */
const makeDeleteProductHandler =
  ({ t, deleteProductById, setAlertProps, setOpenAlertDialog, navigate }) =>
  async (id) => {
    if (!id) return;
    try {
      setAlertProps(
        buildDeleteConfirmAlertProps({
          t,
          onDelete: async () => {
            try {
              await deleteProductById(id).unwrap();

              setAlertProps(buildDeletedAlertProps({ t, navigate }));
              setOpenAlertDialog(true); // Open alert dialog
            } catch (err) {
              console.error('Error deleting:', err);
            }
          },
        })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

/** Add a new empty attribute row. */
const makeAddAttributeHandler =
  ({ setAttributes, selectedRow }) =>
  () => {
    setAttributes((prev) => [
      ...prev,
      {
        createdOn: new Date(),
        name: '',
        description: '',
        save: true,
        productId: selectedRow?.id,
      },
    ]);
  };

/** Removes the attribute at `index` from state. */
const updateAttributes = (setAttributes) => (index) => {
  setAttributes((prev) => {
    const newAttributes = [...prev];
    if (index !== -1) {
      newAttributes.splice(index, 1); // Elimina el atributo en el índice encontrado
    }
    return newAttributes;
  });
};

/** Delete-confirmation handler for a product attribute. */
const makeRemoveAttributeHandler =
  ({
    t,
    deleteProductAttributeById,
    setAttributes,
    setAlertProps,
    setOpenAlertDialog,
    navigate,
  }) =>
  async (index, item) => {
    //Eliminacion logica
    if (item.id) {
      setAlertProps(
        buildDeleteConfirmAlertProps({
          t,
          onDelete: async () => {
            try {
              await deleteProductAttributeById(item.id).unwrap();
              updateAttributes(setAttributes)(index);
              setAlertProps(buildDeletedAlertProps({ t, navigate }));
              setOpenAlertDialog(true); // Open alert dialog
            } catch (err) {
              console.error('Error deleting:', err);
            }
          },
        })
      );
      setOpenAlertDialog(true);
    } else {
      updateAttributes(setAttributes)(index);
    }
  };

/** Mirrors attribute edits into state (marks the row dirty). */
const makeEditAttributeHandler =
  ({ setAttributes }) =>
  (index, field, value) => {
    setAttributes((prev) =>
      prev.map((attr, i) =>
        i === index ? { ...attr, [field]: value, save: true } : attr
      )
    );
  };

/** Save handler for the attributes list (only dirty rows). */
const makeSaveAttributesHandler =
  ({ t, saveProductAttributes, setAlertProps, setOpenAlertDialog, navigate }) =>
  async (data) => {
    // Filtrar solo los atributos con save: true
    const attributesToSend = data
      .filter((attr) => attr.save) // Solo los que tienen save: true
      .map(({ ...rest }) => rest); // Eliminar 'save' del objeto

    if (attributesToSend.length > 0) {
      await saveProductAttributes(attributesToSend).unwrap();

      setOpenAlertDialog(true);
      setAlertProps(buildSavedAlertProps({ t, navigate }));
    }
  };

/**
 * Page state: catalogs, mutations, attributes list and alert state.
 * The selected row comes from the router location state.
 */
function useProductsFormsPageState() {
  const navigate = useNavigate();
  const [openAlertDialog, setOpenAlertDialog] = useState(false); //alert dialog open/close
  const [alertProps, setAlertProps] = useState({});
  const location = useLocation();
  const [attributes, setAttributes] = useState([]);

  const selectedRow = useMemo(() => {
    return location.state?.row ?? null;
  }, [location.state?.row]);

  const {
    datastatus,
    dataCategory,
    dataProviders,
    isLoadingFilters,
    isFetchingFilters,
  } = useProductsFilterData();

  const [saveProduct, { isLoading: isLoadingPost }] =
    useCreateProductMutation();
  const [updateProductById, { isLoading: isLoadingPut }] =
    useUpdateProductByIdMutation();
  const [deleteProductById, { isLoading: isLoadingDelete }] =
    useDeleteProductByIdMutation();

  const [
    getProductAttributes,
    { isLoading: isLoadingAttributes, isFetching: isFetchingAttributes },
  ] = useLazyGetAllProductAttributesQuery();
  const [deleteProductAttributeById, { isLoading: isLoadingDeleteAttribute }] =
    useDeleteProductAttributeByIdMutation();

  const [saveProductAttributes, { isLoading: isLoadingSaveAttributes }] =
    useSaveProductAttributesMutation();

  const { isLoading: isLoadingQueries, isFetching: isFetchingQueries } =
    useLoadingState([
      { isLoading: isLoadingFilters, isFetching: isFetchingFilters },
      { isLoading: isLoadingAttributes, isFetching: isFetchingAttributes },
    ]);

  const isLoadingMutations =
    isLoadingPost ||
    isLoadingPut ||
    isLoadingDelete ||
    isLoadingDeleteAttribute ||
    isLoadingSaveAttributes;

  useEffect(() => {
    if (selectedRow?.id) {
      getProductAttributes(selectedRow.id)
        .unwrap()
        .then((result) => {
          const items = result?.data ?? [];
          if (items.length > 0) {
            setAttributes(items);
          }
        })
        .catch(() => {});
    }
  }, [selectedRow, getProductAttributes]);

  return {
    navigate,
    selectedRow,
    openAlertDialog,
    setOpenAlertDialog,
    alertProps,
    setAlertProps,
    attributes,
    setAttributes,
    datastatus,
    dataCategory,
    dataProviders,
    isLoadingQueries,
    isFetchingQueries,
    isLoadingMutations,
    saveProduct,
    updateProductById,
    deleteProductById,
    deleteProductAttributeById,
    saveProductAttributes,
  };
}

/** Static page layout for the product edit/create form. */
const buildProductsFormsLayout = ({ t, page, handlers }) => (
  <>
    <BackDashBoard
      link={'/home/products'}
      moduleName={page.selectedRow?.id ? t('edit_product') : t('new_product')}
    />
    <div className="relative">
      {(page.isLoadingQueries ||
        page.isFetchingQueries ||
        page.isLoadingMutations) && <Spinner />}

      <div className="container flex flex-col min-h-screen">
        <main className="container flex-1 py-6">
          <Tabs defaultValue="info" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">{t('basic_information')}</TabsTrigger>
              <TabsTrigger value="attributes">{t('attributes')}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <ProductBasicInfo
                onSubmitCreateEdit={handlers.saveHandler}
                onDelete={handlers.deleteProductHandler}
                dataCategory={page.dataCategory}
                dataProviders={page.dataProviders}
                datastatus={page.datastatus}
                selectedRow={page.selectedRow}
              />
            </TabsContent>

            <TabsContent value="attributes" className="mt-4">
              <ProductAttributes
                onRemoveAttribute={handlers.removeAttributeHandler}
                onAddAttribute={handlers.addAttributeHandler}
                onEditAttribute={handlers.editAttributeHandler}
                attributes={page.attributes}
                onSubmitFormAttributes={handlers.saveAttributesHandler}
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

function ProductsForms() {
  const { t } = useTranslation();
  const page = useProductsFormsPageState();

  const handlers = {
    saveHandler: makeSaveHandler({
      t,
      updateProductById: page.updateProductById,
      saveProduct: page.saveProduct,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      navigate: page.navigate,
    }),
    deleteProductHandler: makeDeleteProductHandler({
      t,
      deleteProductById: page.deleteProductById,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      navigate: page.navigate,
    }),
    addAttributeHandler: makeAddAttributeHandler({
      setAttributes: page.setAttributes,
      selectedRow: page.selectedRow,
    }),
    removeAttributeHandler: makeRemoveAttributeHandler({
      t,
      deleteProductAttributeById: page.deleteProductAttributeById,
      setAttributes: page.setAttributes,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      navigate: page.navigate,
    }),
    editAttributeHandler: makeEditAttributeHandler({
      setAttributes: page.setAttributes,
    }),
    saveAttributesHandler: makeSaveAttributesHandler({
      t,
      saveProductAttributes: page.saveProductAttributes,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      navigate: page.navigate,
    }),
  };

  return buildProductsFormsLayout({ t, page, handlers });
}
export default ProductsForms;
