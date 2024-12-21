import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import DataTable from '../../../components/dataTable/DataTable'
import columnDefNews from '../utils/column'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EraserIcon
} from '@radix-ui/react-icons'
import {
  useLazyGetAllNewsQuery,
  useGetAllNewsStatusQuery
} from '../slice/newsSlice'

import data from '../utils/MOCK_DATA.json'
const NewsFilters = () => {
  const columns = useMemo(() => columnDefNews, [])
  const [openDialog, setOpenDialog] = useState(false) //dialog open/close
  const [selectedRow, setSelectedRow] = useState(null) //data from datatable
  const formFilter = useForm()
  const formDialog = useForm()

  const {
    data: datastatus,
    isError: isErrorStatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    isSuccess: isSuccessStatus,
    error: errorStatus
  } = useGetAllNewsStatusQuery()
  const [
    trigger,
    {
      data: dataNews = { data: [] },
      isError,
      isLoading,
      isFetching,
      isSuccess,
      error
    },
    lastPromiseInfo
  ] = useLazyGetAllNewsQuery()

  //form event
  const onSubmit = ({ description, fdate, tdate, status: statusCode }) => {
    const fromDate = fdate && formatISO(new Date(fdate), 'yyyy-MM-dd')
    const toDate = tdate && formatISO(new Date(tdate), 'yyyy-MM-dd')

    trigger({ description, fromDate, toDate, statusCode })
  }
  // pass to utils file
  const uppercaseFunction = e => {
    const value = e.target.value.toUpperCase()
  }

  return (
    <>
      <div className='col-span-2 row-span-1 md:col-span-4'>
        <Form {...formFilter}>
          <form
            method='post'
            action=''
            id='profile-info-form'
            noValidate
            onSubmit={formFilter.handleSubmit(onSubmit)}
            className='flex flex-col flex-wrap gap-5'>
            {/* inputs */}
            <div className='flex flex-wrap flex-1 gap-3'>
              <FormField
                control={formFilter.control}
                name='description'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          id='description'
                          name='description'
                          placeholder='Enter the description'
                          type='text'
                          autoComplete='false'
                          maxLength={30}
                          // onInput={uppercaseFunction}
                          // onChange={handleChangeEmail(event)}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={formFilter.control}
                name='fdate'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel>From date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}>
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formFilter.control}
                name='tdate'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel>To date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}>
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formFilter.control}
                name='status'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {datastatus?.data.map((item, index) => (
                            <SelectItem value={item.code} key={index}>
                              {item.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            {/* buttons */}
            <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
              <Button
                type='submit'
                className='flex-1 md:flex-initial md:w-24'
                variant='info'>
                Sarch{' '}
                <MagnifyingGlassIcon className='w-4 h-4 ml-auto opacity-50' />
              </Button>
              <Button
                type='submit'
                className='flex-1 md:flex-initial md:w-24'
                variant='success'>
                Add <PlusIcon className='w-4 h-4 ml-auto opacity-50' />
              </Button>
              <Button
                type='submit'
                className='flex-1 md:flex-initial md:w-24'
                variant='outline'>
                Clear <EraserIcon className='w-4 h-4 ml-auto opacity-50' />
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className='flex flex-wrap w-full col-span-2 row-span-2 row-start-2 md:col-span-5'>
        <DataTable
          columns={columns}
          data={dataNews?.data}
          setSelectedRow={setSelectedRow}
          setOpenDialog={setOpenDialog}
        />
        {/* <DataTable columns={columns} data={data} /> */}
      </div>

      <Dialog
        open={openDialog}
        onOpenChange={isOpen => {
          if (isOpen === true) return
          setSelectedRow(null)
          setOpenDialog(false)
        }}>
        {/* <DialogTrigger asChild>
          <Button variant='outline'>Edit Profile</Button>
        </DialogTrigger> */}
        <DialogContent className=''>
          <DialogHeader>
            <DialogTitle>Edit New</DialogTitle>
            <DialogDescription>
              Make changes to new here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...formDialog}>
            <form
              method='post'
              action=''
              id='profile-info-form'
              noValidate
              onSubmit={formDialog.handleSubmit(onSubmit)}>
              <div className='grid grid-cols-2 grid-rows-4 gap-4 py-4'>
                <FormField
                  control={formFilter.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            // onInput={uppercaseFunction}
                            // onChange={handleChangeEmail(event)}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={formFilter.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            // onInput={uppercaseFunction}
                            // onChange={handleChangeEmail(event)}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={formFilter.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            // onInput={uppercaseFunction}
                            // onChange={handleChangeEmail(event)}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={formFilter.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            // onInput={uppercaseFunction}
                            // onChange={handleChangeEmail(event)}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={formFilter.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            // onInput={uppercaseFunction}
                            // onChange={handleChangeEmail(event)}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={formFilter.control}
                  name='description'
                  render={({ selectedRow }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-2'>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          {/* <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            {...field}
                            value={field.value ?? ''}
                          /> */}
                          <Textarea
                            value={selectedRow?.status.description ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              <DialogFooter>
                {/* <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setOpenDialog(false)
                  }}>
                  Close
                </Button> */}
                <DialogClose asChild>
                  <Button type='button' variant='secondary'>
                    Close
                  </Button>
                </DialogClose>
                <Button type='submit' variant='info'>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
export default NewsFilters
