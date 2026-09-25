import { useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { pickDirty } from '@/utils/pickDirty';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuTrash2, LuShoppingCart } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { SaleSchema } from '../utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

/** Sums price × quantity across the detail rows. */
const sumDetailsTotal = (details) =>
  details.reduce((sum, detail) => {
    const price = Number(detail.price) || 0;
    const quantity = Number(detail.quantity) || 0;
    return sum + price * quantity;
  }, 0);

/** Clears the form and closes the dialog. */
const makeCloseHandler =
  ({ clearDialog, onCloseDialog }) =>
  () => {
    clearDialog();
    onCloseDialog();
  };

/** Submit handler: PATCH dirty fields on edit, full payload on create. */
const makeSubmitHandler =
  ({ id, dirtyFields, onSubmit }) =>
  (data) => {
    if (id) {
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id, body: changes });
    } else {
      onSubmit(data);
    }
  };

/** Normalizes a raw row to form values (details as strings). */
const mapRowToFormValues = (row) => ({
  clientId: row.clientId.toString(),
  total: row.total.toString(),
  createdOn: new Date(row.createdOn).toISOString().split('T')[0],
  updatedOn: row.updatedOn
    ? new Date(row.updatedOn).toISOString().split('T')[0]
    : '',
  userSaleCreatedName: row.userSaleCreated?.name,
  userSaleUpdatedName: row.userSaleUpdated?.name || '',
  details: row.saleDetail.map((detail) => ({
    productId: detail.productId.toString(),
    quantity: detail.quantity.toString(),
    price: detail.price.toString(),
  })),
});

/** Client select field. */
function SaleClientSelectField({ control, clients }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="clientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('client')}*</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_client')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

SaleClientSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  clients: PropTypes.array,
};

/** Disabled total field (calculated from the details). */
function SaleTotalField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="total"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="total">{t('total')}</FormLabel>
          <FormControl>
            <Input
              id="total"
              name="total"
              type="number"
              placeholder="0.00"
              autoComplete="off"
              disabled={true}
              {...field}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

SaleTotalField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled audit field pair: user name + date (created/updated). */
function SaleAuditFieldPair({
  control,
  nameKey,
  dateKey,
  labelKey,
  dateLabelKey,
}) {
  const { t } = useTranslation();
  return (
    <>
      <FormField
        control={control}
        name={nameKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor={nameKey}>{t(labelKey)}</FormLabel>
            <FormControl>
              <Input id={nameKey} name={nameKey} disabled {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={dateKey}
        render={({ field }) => (
          <FormItem className="flex flex-col flex-auto">
            <FormLabel htmlFor={dateKey}>{t(dateLabelKey)}</FormLabel>
            <FormControl>
              <Input
                id={dateKey}
                name={dateKey}
                disabled
                type="date"
                {...field}
                value={field.value}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

SaleAuditFieldPair.propTypes = {
  control: PropTypes.object.isRequired,
  nameKey: PropTypes.string.isRequired,
  dateKey: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  dateLabelKey: PropTypes.string.isRequired,
};

/** Detail product select with duplicate/auto-price handling. */
function DetailProductSelectField({
  control,
  products,
  index,
  onProductChange,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={`details.${index}.productId`}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={`detail-product-${index}`}>
            {t('product')}*
          </FormLabel>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onProductChange(index, value);
            }}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_product')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {products?.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

DetailProductSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  products: PropTypes.array,
  index: PropTypes.number.isRequired,
  onProductChange: PropTypes.func.isRequired,
};

/** Detail quantity input (min 1, mirrors to state). */
function DetailQuantityField({ control, index, onQuantityChange }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={`details.${index}.quantity`}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={`detail-quantity-${index}`}>
            {t('quantity')}*
          </FormLabel>
          <FormControl>
            <Input
              id={`detail-quantity-${index}`}
              name={`details.${index}.quantity`}
              placeholder={t('quantity_placeholder')}
              type="number"
              min="1"
              autoComplete="off"
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                onQuantityChange(index, value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

DetailQuantityField.propTypes = {
  control: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onQuantityChange: PropTypes.func.isRequired,
};

/** Detail price input (disabled: set by product selection). */
function DetailPriceField({ control, index }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={`details.${index}.price`}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={`detail-price-${index}`}>{t('price')}*</FormLabel>
          <FormControl>
            <Input
              id={`detail-price-${index}`}
              type="number"
              placeholder="0.00"
              name={`details.${index}.price`}
              autoComplete="off"
              disabled={true}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

DetailPriceField.propTypes = {
  control: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

/** One detail row: product + quantity + price and the remove button. */
function buildDetailRow({
  form,
  products,
  detail,
  index,
  hasMultipleDetails,
  onProductChange,
  onQuantityChange,
  onRemoveDetail,
}) {
  return (
    <div
      key={index}
      className="flex flex-wrap items-end gap-4 pb-4 mb-4 border-b border-gray-200"
    >
      <DetailProductSelectField
        control={form.control}
        products={products}
        index={index}
        onProductChange={onProductChange}
      />
      <DetailQuantityField
        control={form.control}
        index={index}
        onQuantityChange={onQuantityChange}
      />
      <DetailPriceField control={form.control} index={index} />

      {/* Botón de eliminación */}
      {hasMultipleDetails && (
        <Button
          className="flex flex-col flex-auto"
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemoveDetail(index, detail)}
        >
          <LuTrash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

/** Scrollable list of sale detail rows. */
function buildDetailsList({
  form,
  products,
  details,
  onProductChange,
  onQuantityChange,
  onRemoveDetail,
}) {
  return (
    <div className="space-y-4 overflow-y-auto max-h-80">
      {details?.map((detail, index) =>
        buildDetailRow({
          form,
          products,
          detail,
          index,
          hasMultipleDetails: details.length > 1,
          onProductChange,
          onQuantityChange,
          onRemoveDetail,
        })
      )}
    </div>
  );
}

/** Audit pairs gated on createdOn/updatedOn presence. */
function buildAuditFields({ form, selectedRow }) {
  return (
    <>
      {selectedRow?.createdOn && (
        <SaleAuditFieldPair
          control={form.control}
          nameKey="userSaleCreatedName"
          dateKey="createdOn"
          labelKey="created_by"
          dateLabelKey="created_on"
        />
      )}
      {selectedRow?.updatedOn && (
        <SaleAuditFieldPair
          control={form.control}
          nameKey="userSaleUpdatedName"
          dateKey="updatedOn"
          labelKey="updated_by"
          dateLabelKey="updated_on"
        />
      )}
    </>
  );
}

/** Header fields: client + total + audit pairs. */
function buildHeaderFields({ form, clients, selectedRow }) {
  return (
    <div className="grid grid-cols-1 gap-6 py-4 auto-rows-auto md:grid-cols-2">
      <SaleClientSelectField control={form.control} clients={clients} />

      <SaleTotalField control={form.control} />

      {buildAuditFields({ form, selectedRow })}
    </div>
  );
}

/** Dialog header: cart icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, saleId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuShoppingCart className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {saleId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, add detail, delete (edit only) and submit. */
function buildDialogFooter({ t, saleId, onAddDetail, handleDelete }) {
  return (
    <DialogFooter className="flex flex-wrap justify-between gap-3 mt-5 md:justify-end">
      <DialogClose asChild>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 md:flex-initial md:w-24"
        >
          {t('cancel')}
        </Button>
      </DialogClose>
      <Button
        className="flex-1 md:flex-initial md:w-24"
        type="button"
        variant="success"
        onClick={onAddDetail}
      >
        {t('add_detail')}
      </Button>
      {saleId && (
        <Button
          type="button"
          variant="destructive"
          className="flex-1 md:flex-initial md:w-24"
          onClick={handleDelete}
        >
          {t('delete')}
        </Button>
      )}
      <Button
        type="submit"
        variant="info"
        className="flex-1 md:flex-initial md:w-24"
      >
        {saleId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Product-change handler factory: duplicate check, auto-price from the
 * product price, auto-total.
 */
const makeProductChangeHandler =
  ({ t, toast, products, details, setDetails, form, calculateTotal }) =>
  (index, value) => {
    if (details?.length > 0) {
      const productExist = details.filter(
        (detail) => detail.productId === value
      );
      if (productExist?.length > 0) {
        toast({
          title: t('product_already_exists'),
          description: t('product_already_exists_message'),
          variant: 'destructive',
        });
        return;
      }

      const selectedProduct = products.find(
        (product) => product.id.toString() === value
      );

      if (selectedProduct) {
        // Actualizar el detalle
        const updatedDetails = [...details];
        updatedDetails[index] = {
          ...updatedDetails[index],
          productId: value,
          price: selectedProduct.price,
        };
        setDetails(updatedDetails);

        // Actualizar el formulario
        form.setValue(`details.${index}.price`, selectedProduct.price);

        // Calcular el total
        calculateTotal();
      }
    }
  };

/** Quantity-change handler factory: min 1, mirror to state, auto-total. */
const makeQuantityChangeHandler =
  ({ details, setDetails, form, calculateTotal }) =>
  (index, value) => {
    if (details?.length > 0) {
      const quantity = Number(value) || 0;
      if (quantity < 1) return;

      // Actualizar el detalle
      const updatedDetails = [...details];
      updatedDetails[index] = {
        ...updatedDetails[index],
        quantity: quantity,
      };
      setDetails(updatedDetails);

      // Actualizar el formulario
      form.setValue(`details.${index}.quantity`, quantity.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Calcular el total
      calculateTotal();
    }
  };

/** Default form values for a fresh sale. */
const SALE_DEFAULT_VALUES = {
  clientId: '',
  total: '',
  createdOn: '',
  updatedOn: '',
  details: [
    {
      productId: '',
      quantity: 0,
      price: 0,
    },
  ],
};

/**
 * Dialog form state: reset from the selected row, auto-total from
 * details, duplicate-product toast, dirty-field PATCH payloads on edit.
 */
function useSaleDialogForm({
  selectedRow,
  onSubmit,
  onDeleteById,
  onCloseDialog,
  products,
  details,
  setDetails,
}) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(SaleSchema),
    defaultValues: SALE_DEFAULT_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;

  const clearDialog = useCallback(() => {
    form.reset();
  }, [form]);

  const saleId = useMemo(() => selectedRow?.id ?? null, [selectedRow]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = mapRowToFormValues(selectedRow);

      form.reset(mappedValues);
      setDetails(mappedValues.details);
    } else {
      // Reset form when selectedRow is null
      clearDialog();
    }
  }, [selectedRow, clearDialog, form, setDetails]);

  const calculateTotal = useCallback(() => {
    if (details?.length > 0) {
      form.setValue('total', sumDetailsTotal(details).toFixed(2).toString());
    }
  }, [details, form]);

  const handleProductChange = makeProductChangeHandler({
    t,
    toast,
    products,
    details,
    setDetails,
    form,
    calculateTotal,
  });

  const handleQuantityChange = makeQuantityChangeHandler({
    details,
    setDetails,
    form,
    calculateTotal,
  });

  // Calcular el total cuando cambian los detalles
  useEffect(() => {
    calculateTotal();
  }, [details, calculateTotal]);

  const handleCloseDialog = makeCloseHandler({ clearDialog, onCloseDialog });

  const handleSubmit = makeSubmitHandler({ id: saleId, dirtyFields, onSubmit });

  const handleDelete = () => {
    onDeleteById(saleId);
    // Reset form and details state
    handleCloseDialog();
  };

  return {
    form,
    saleId,
    handleSubmit,
    handleDelete,
    handleCloseDialog,
    handleProductChange,
    handleQuantityChange,
  };
}

export const SalesDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  onAddDetail,
  onRemoveDetail,
  products,
  details,
  clients,
  setDetails,
}) => {
  const { t } = useTranslation();
  const {
    form,
    saleId,
    handleSubmit,
    handleDelete,
    handleCloseDialog,
    handleProductChange,
    handleQuantityChange,
  } = useSaleDialogForm({
    selectedRow,
    onSubmit,
    onDeleteById,
    onCloseDialog,
    products,
    details,
    setDetails,
  });

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        handleCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[800px]">
        {buildDialogHeader({ t, actionDialog, saleId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="sale-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5 px-4"
          >
            {buildHeaderFields({ form, clients, selectedRow })}

            <Separator className="my-4" />

            {buildDetailsList({
              form,
              products,
              details,
              onProductChange: handleProductChange,
              onQuantityChange: handleQuantityChange,
              onRemoveDetail,
            })}

            {buildDialogFooter({ t, saleId, onAddDetail, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

SalesDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  onAddDetail: PropTypes.func.isRequired,
  onRemoveDetail: PropTypes.func.isRequired,
  onEditDetail: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  details: PropTypes.array,
  clients: PropTypes.array.isRequired,
  setDetails: PropTypes.func,
};
