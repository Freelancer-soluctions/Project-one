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
  CommandItem
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { BsCalendar3 } from 'react-icons/bs'
import { useGetAllNewsQuery } from '../slice/newsSlice'
import { skipToken } from '@reduxjs/toolkit/query/react'

import { useEffect, useState } from 'react'
const News = () => {
  const form = useForm()
  const [open, setOpen] = useState(false)
  const [isNotSettingfilters, setSettingfilters] = useState(true) //flag to skip redux hook query
  const [filters, setFilters] = useState({
    description: '',
    tdate: '',
    fdate: ''
  })
  const { data, isError, isLoading, isFetching, isSuccess, error } =
    useGetAllNewsQuery(filters, {
      skip: isNotSettingfilters
    })
  //form event
  const onSubmit = ({ description, tdate, fdate }) => {
    setFilters({ description, tdate, fdate })
    console.log('323232', isNotSettingfilters)
    setSettingfilters(false)
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
                      type='Description'
                      autoComplete='false'
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
                      disabled={date =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
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
                      disabled={date =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
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
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    {/* <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          role='combobox'
                          aria-expanded={open}
                          className='w-[200px] justify-between'>
                          {value
                            ? frameworks.find(
                                framework => framework.value === value
                              )?.label
                            : 'Select framework...'}
                          <CaretSortIcon className='w-4 h-4 ml-2 opacity-50 shrink-0' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-[200px] p-0'>
                        <Command>
                          <CommandInput
                            placeholder='Search framework...'
                            className='h-9'
                          />
                          <CommandEmpty>No framework found.</CommandEmpty>
                          <CommandGroup>
                            {frameworks.map(framework => (
                              <CommandItem
                                key={framework.value}
                                value={framework.value}
                                onSelect={currentValue => {
                                  setValue(
                                    currentValue === value ? '' : currentValue
                                  )
                                  setOpen(false)
                                }}>
                                {framework.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    value === framework.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover> */}
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
