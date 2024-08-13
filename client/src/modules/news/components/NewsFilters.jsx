import { useMemo } from 'react'
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
  const form = useForm()
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
      <div className='col-span-2 row-span-2 md:col-span-5'>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='profile-info-form'
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-wrap gap-5'>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col'>
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
              control={form.control}
              name='fdate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>From date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
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
              control={form.control}
              name='tdate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>To date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
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
              control={form.control}
              name='status'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col'>
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

            <div className='flex items-center justify-center'>
              <Button type='submit' className='flex-1' variant='info'>
                Sarch{' '}
                <MagnifyingGlassIcon className='w-4 h-4 ml-auto opacity-50' />
              </Button>
              <Button type='submit' className='flex-1' variant='success'>
                Add <PlusIcon className='w-4 h-4 ml-auto opacity-50' />
              </Button>
              <Button type='submit' className='flex-1' variant='outline'>
                Clear <EraserIcon className='w-4 h-4 ml-auto opacity-50' />
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className='col-span-2 row-span-3 row-start-3 md:col-span-5'>
        <DataTable columns={columns} data={dataNews?.data} />
        {/* <DataTable columns={columns} data={data} /> */}
      </div>
    </>
  )
}
export default NewsFilters
