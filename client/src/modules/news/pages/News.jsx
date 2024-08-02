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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { BsCalendar3 } from 'react-icons/bs'
import { FaSort, FaCheck } from 'react-icons/fa'
import {
  useLazyGetAllNewsQuery,
  useGetAllNewsStatusQuery
} from '../slice/newsSlice'
import { useState } from 'react'
const News = () => {
  const form = useForm()
  const [open, setOpen] = useState(false)
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
    { data, isError, isLoading, isFetching, isSuccess, error },
    lastPromiseInfo
  ] = useLazyGetAllNewsQuery()

  //form event
  const onSubmit = ({ description, fdate, tdate }) => {
    const fromDate = formatISO(new Date(fdate), 'yyyy-MM-dd')
    const toDate = formatISO(new Date(tdate), 'yyyy-MM-dd')
    trigger({ description, fromDate, toDate })
  }

  // pass to utils file
  const uppercaseFunction = e => {
    const value = e.target.value.toUpperCase()
  }

  return (
    <div className='container mx-auto border-8'>
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
                        <BsCalendar3 className='w-4 h-4 ml-auto opacity-50' />
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
                        <BsCalendar3 className='w-4 h-4 ml-auto opacity-50' />
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
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'w-[200px] justify-between',
                              !field.value && 'text-muted-foreground'
                            )}>
                            {field.value
                              ? datastatus?.data.find(
                                  status => status.description === field.value
                                )?.description
                              : 'Select status'}
                            <FaSort className='w-4 h-4 ml-2 opacity-50 shrink-0' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-[200px] p-0'>
                        <Command>
                          <CommandInput
                            placeholder='Select status...'
                            className='h-9'
                          />
                          <CommandList>
                            <CommandEmpty>No status found.</CommandEmpty>
                            <CommandGroup>
                              {datastatus?.data.map(status => (
                                <CommandItem
                                  value={status.description}
                                  key={status.id}
                                  onSelect={() => {
                                    form.setValue('statusCode', status.id)
                                  }}>
                                  {status.description}
                                  <FaCheck
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      status.description === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <div className='flex items-center justify-center'>
            <Button type='submit' className='flex-1'>
              Sign in
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
export default News
