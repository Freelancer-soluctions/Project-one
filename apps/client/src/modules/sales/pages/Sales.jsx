import { SalesFiltersForm, SalesDialog, SalesDatatable } from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllSalesQuery,
  useUpdateSaleByIdMutation,
  useCreateSaleMutation,
  useDeleteSaleByIdMutation,
} from '../api/salesAPI';
import { useGetAllProductsFiltersQuery } from '@/modules/products/api/productsAPI';
import { useGetAllClientsFiltersQuery } from '@/modules/clients/api/clientsApi';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';
import { useNavigate } from 'react-router';

const Sales = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [actionDialog, setActionDialog] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [details, setDetails] = useState([
    {
      productId: '',
      quantity: 0,
      price: 0,
    },
  ]);
  const [filters, setFilters] = useState({});

  const [
    getAllSales,
    {
      data: dataSales = { data: [] },
      isLoading: isLoadingSales,
      isFetching: isFetchingSales,
    },
  ] = useLazyGetAllSalesQuery();

  const {
    data: dataClients = { data: [] },
    isLoading: isLoadingClients,
    isFetching: isFetchingClients,
  } = useGetAllClientsFiltersQuery();
  const [updateSaleById, { isLoading: isLoadingPut }] =
    useUpdateSaleByIdMutation();

  const [createSale, { isLoading: isLoadingPost }] = useCreateSaleMutation();

  const [deleteSaleById, { isLoading: isLoadingDelete }] =
    useDeleteSaleByIdMutation();

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useGetAllProductsFiltersQuery();

  /**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend.
   *
   * Se ejecuta automáticamente:
   * - Al montar el componente (primer render)
   * - Cuando cambia la página
   * - Cuando cambia el tamaño de página
   * - Cuando cambian los filtros
   *
   * No se realizan llamadas manuales al backend desde handlers
   * para evitar duplicación de lógica y estados inconsistentes.
   */
  useEffect(() => {
    getAllSales({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, getAllSales]);

  /**
   * Al aplicar nuevos filtros:
   * - Se resetea la página a la primera (pageIndex = 0)
   * - Se actualiza el estado de filtros
   *
   * No se llama directamente al backend aquí.
   * El cambio de estado dispara el useEffect, manteniendo
   * un flujo reactivo y predecible.
   */
  const handleSubmitFilters = (newFilters) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));

    setFilters(newFilters);
  };

  const handleSubmit = async (values, saleId) => {
    try {
      saleId
        ? await updateSaleById({
            id: saleId,
            data: {
              clientId: values.clientId,
              total: values.total,
              details: values.details,
            },
          }).unwrap()
        : await createSale({
            clientId: values.clientId,
            total: values.total,
            details: values.details,
          }).unwrap();

      setAlertProps({
        alertTitle: t(saleId ? 'update_record' : 'add_record'),
        alertMessage: t(saleId ? 'updated_successfully' : 'added_successfully'),
        cancel: false,
        success: true,
        onSuccess: () => {
          setOpenDialog(false);
        },
        variantSuccess: 'info',
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAddDialog = () => {
    setActionDialog(t('add_sale'));
    setOpenDialog(true);
    setSelectedRow({});
    setDetails([
      {
        productId: '',
        quantity: 0,
        price: 0,
      },
    ]);
  };

  const handleEditDialog = (row) => {
    setActionDialog(t('edit_sale'));
    setOpenDialog(true);
    setSelectedRow(row);
    setDetails(
      row.details && row.details.length > 0
        ? row.details
        : [
            {
              productId: '',
              quantity: 0,
              price: 0,
            },
          ]
    );
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
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
            await deleteSaleById(id).unwrap();

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                setOpenDialog(false);
              },
              variantSuccess: 'info',
            });
            setOpenAlertDialog(true);
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

  const handleEditDetail = (index, field, value) => {
    setDetails((prev) =>
      prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value, save: true } : detail
      )
    );
  };

  const handleRemoveDetail = async (index, item) => {
    //Eliminacion logica
    if (item.id) {
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
            await deleteSaleDetailById(item.id).unwrap();
            updateDetails(index);
            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                navigate('/home/products');
              },
              variantSuccess: 'info',
            });
            setOpenAlertDialog(true); // Open alert dialog
          } catch (err) {
            console.error('Error deleting:', err);
          }
        },
      });
      setOpenAlertDialog(true);
    } else {
      updateDetails(index);
    }
  };

  const updateDetails = (index) => {
    setDetails((prev) => {
      const newDetails = [...prev];
      if (index !== -1) {
        newDetails.splice(index, 1); // Elimina el atributo en el índice encontrado
      }
      return newDetails;
    });
  };

  const handleAddDetail = () => {
    setDetails([
      ...details,
      {
        productId: '',
        quantity: 0,
        price: 0,
      },
    ]);
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('sales')} />
      <div className="relative">
        {/* Show spinner when loading or fetching */}
        {(isLoadingSales ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingProducts ||
          isLoadingDelete ||
          isLoadingClients ||
          isFetchingSales ||
          isFetchingClients ||
          isFetchingProducts) && <Spinner />}

        <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
          {/* filters */}
          <div className="col-span-2 row-span-1 md:col-span-5">
            <SalesFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              clients={dataClients.data}
            />
          </div>
          {/* Datatable */}
          <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
            <SalesDatatable
              dataSales={dataSales}
              onEditDialog={handleEditDialog}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
          {/* Dialog */}
          <SalesDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
            onEditDetail={handleEditDetail}
            onAddDetail={handleAddDetail}
            onRemoveDetail={handleRemoveDetail}
            products={dataProducts.data}
            details={details}
            clients={dataClients.data}
            setDetails={setDetails}
          />

          <AlertDialogComponent
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
            alertProps={alertProps}
          />
        </div>
      </div>
    </>
  );
};

export default Sales;
