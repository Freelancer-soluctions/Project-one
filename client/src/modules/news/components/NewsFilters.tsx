import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatISO } from 'date-fns';
import columnDefNews from '../utils/column';
import {
  useLazyGetAllNewsQuery,
  useGetAllNewsStatusQuery,
} from '../slice/newsSlice';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import Datatable from '@/components/dataTable/dataTable';
import { ColumnDef } from '@tanstack/react-table';

interface FormData {
  description: string;
  fdate: string;
  tdate: string;
  status: string;
}

type GetAllNewsParams = {
  description?: string;
  fromDate?: string; // Usamos string aquí para el formato ISO
  toDate?: string;
  status?: string;
};

interface Data {
  name: string;
  age: number;
}

const NewsFilters = () => {
  const columns = useMemo(() => columnDefNews, []);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const formFilter = useForm<FormData>();
  const formDialog = useForm<FormData>();
  const [formData, setFormData] = useState<FormData>({
    description: '',
    fdate: '',
    tdate: '',
    status: '',
  });

  const { data: datastatus } = useGetAllNewsStatusQuery();
  const [trigger, { data: dataNews }] = useLazyGetAllNewsQuery();

  const onSubmit = (data: FormData) => {
    const { description, fdate, tdate, status } = data;
    const fromDate = fdate ? formatISO(new Date(fdate)) : undefined;
    const toDate = tdate ? formatISO(new Date(tdate)) : undefined;

    const params: GetAllNewsParams = { description, fromDate, toDate, status };
    // trigger(params);
  };

  return (
    <>
      <div className="col-span-2 row-span-1 md:col-span-4">
        <Form {...formFilter}>
          <form onSubmit={formFilter.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField
              control={formFilter.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formFilter.control}
              name="fdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" placeholder="Select start date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formFilter.control}
              name="tdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" placeholder="Select end date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formFilter.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter status" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="info">
              Search
            </Button>
          </form>
        </Form>
      </div>

      <Datatable 
        columns={columns as ColumnDef<Data>[]}
        data={dataNews?.data as unknown as Data[]}
        setSelectedRow2={setSelectedRow}
        setOpenDialog={setOpenDialog} setSelectedRow={function (row: Data): void {
          throw new Error('Function not implemented.');
        } }              
      />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit News</DialogTitle>
          </DialogHeader>
          <Form {...formDialog}>
            <form onSubmit={formDialog.handleSubmit(onSubmit)}>
              <Button type="submit">Save</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewsFilters;
