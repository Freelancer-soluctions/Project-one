import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from '@radix-ui/react-icons';
import { LuPackagePlus } from 'react-icons/lu';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { StockSchema } from '../utils';
import { useEffect, useMemo } from 'react';

export const StockDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  unitMeasures,
  products,
  warehouses,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(StockSchema),
    defaultValues: {
      quantity: '',
      price: '',
      totalCost: '',
      minimum: '',
      maximum: '',
      lot: '',
      unitMeasure: 'PIECES',
      expirationDate: null,
      productId: '',
      warehouseId: '',
    },
  });

  const stockId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);
  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        ...selectedRow,
        productId: selectedRow.productId.toString(),
        warehouseId: selectedRow.warehouseId.toString(),
        quantity: selectedRow.quantity.toString(),
        minimum: selectedRow.minimum.toString(),
        maximum: selectedRow.maximum.toString(),
        price: selectedRow.productPrice.toString(),
        cost: selectedRow.productCost.toString(),
        totalCost: selectedRow.totalCost.toString(),
        expirationDate: selectedRow.expirationDate
          ? new Date(selectedRow.expirationDate)
          : null,
      };

      form.reset(mappedValues);
    }

    if (!openDialog) {
      form.reset({
        quantity: '',
        price: '',
        totalCost: '',
        minimum: '',
        maximum: '',
        lot: '',
        unitMeasure: 'PIECES',
        expirationDate: null,
        productId: '',
        warehouseId: '',
      });
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    onSubmit(data, selectedRow?.id);
  };

  const handleDeleteById = () => {
    onDeleteById(selectedRow?.id);
  };

  const handleCloseDialog = () => {
    form.reset();
    onCloseDialog();
  };
  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        handleCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuPackagePlus className="inline mr-3 w-7 h-7" />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {selectedRow ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="warehouse-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="flex flex-col flex-wrap gap-5"
          >
            <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('product')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_product')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('warehouse')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_warehouse')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses?.map((warehouse) => (
                          <SelectItem
                            key={warehouse.id}
                            value={warehouse.id.toString()}
                          >
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('expiration_date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>{t('pick_date')}</span>
                            )}
                            <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {t('expiration_date_description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('unit_measure')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_unit_measure')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitMeasures.map((measure) => (
                          <SelectItem key={measure.value} value={measure.value}>
                            {measure.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="quantity">{t('quantity')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="quantity"
                          name="quantity"
                          placeholder={t('quantity_placeholder')}
                          type="number"
                          autoComplete="off"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {selectedRow?.productId && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor="price">{t('price')}*</FormLabel>
                        <FormControl>
                          <Input
                            id="price"
                            name="price"
                            placeholder={t('price_placeholder')}
                            type="number"
                            autoComplete="off"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
              {selectedRow?.productId && (
                <FormField
                  control={form.control}
                  name="totalCost"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor="totalCost">
                          {t('total_cost')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="totalCost"
                            name="totalCost"
                            placeholder={t('total_cost_placeholder')}
                            type="number"
                            autoComplete="off"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
              <FormField
                control={form.control}
                name="minimum"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="minimum">{t('minimum')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="minimum"
                          name="minimum"
                          placeholder={t('minimum_placeholder')}
                          type="number"
                          autoComplete="off"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="maximum"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="maximum">{t('maximum')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="maximum"
                          name="maximum"
                          placeholder={t('maximum_placeholder')}
                          type="number"
                          autoComplete="off"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="lot"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="lot">{t('lot')}</FormLabel>
                      <FormControl>
                        <Input
                          id="lot"
                          name="lot"
                          placeholder={t('lot_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={50}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {selectedRow?.createdOn && (
                <>
                  <FormField
                    control={form.control}
                    name="userStockCreatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userStockCreatedName">
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userStockCreatedName"
                            name="userStockCreatedName"
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="createdOn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-auto">
                        <FormLabel htmlFor="createdOn">
                          {t('created_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id="createdOn"
                                disabled={true}
                                readOnly={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value && format(field.value, 'PPP')}
                                <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date('1900-01-01')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {selectedRow?.updatedOn && (
                <>
                  <FormField
                    control={form.control}
                    name="userStockUpdatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userStockUpdatedName">
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userStockUpdatedName"
                            name="userStockUpdatedName"
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="updatedOn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-auto">
                        <FormLabel htmlFor="updatedOn">
                          {t('updated_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id="updatedOn"
                                disabled={true}
                                readOnly={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value && format(field.value, 'PPP')}
                                <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date('1900-01-01')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 md:flex-initial md:w-24"
                >
                  {t('cancel')}
                </Button>
              </DialogClose>

              {stockId && (
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 md:flex-initial md:w-24"
                  onClick={() => {
                    handleDeleteById();
                  }}
                >
                  {t('delete')}
                </Button>
              )}
              <Button
                type="submit"
                variant="info"
                className="flex-1 md:flex-initial md:w-24"
              >
                {stockId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

StockDialog.propTypes = {
  openDialog: PropTypes.bool,
  onCloseDialog: PropTypes.func,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func,
  onDeleteById: PropTypes.func,
  actionDialog: PropTypes.string,
  unitMeasures: PropTypes.array,
  products: PropTypes.array,
  warehouses: PropTypes.array,
};
