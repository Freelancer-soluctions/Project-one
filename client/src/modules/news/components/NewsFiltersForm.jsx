import { useForm } from 'react-hook-form'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import {
  CalendarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EraserIcon
} from '@radix-ui/react-icons'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { cn } from '@/lib/utils'

export const NewsFiltersForm = ({
  trigger,
  setActionDialog,
  setOpenDialog,
  datastatus
}) => {
  // Configura el formulario
  const formFilter = useForm({
    defaultValues: {
      description: '',
      fdate: '',
      tdate: '',
      statusNews: ''
    }
  })

  //form event
  const onSubmitFilter = ({
    description,
    fdate,
    tdate,
    statusNews: statusCode
  }) => {
    const fromDate = fdate && formatISO(new Date(fdate), 'yyyy-MM-dd')
    const toDate = tdate && formatISO(new Date(tdate), 'yyyy-MM-dd')

    trigger({ description, fromDate, toDate, statusCode })
  }

  const handleAddDialog = () => {
    setActionDialog('Add')
    setOpenDialog(true)
  }

  const handleResetFilter = () => {
    formFilter.reset()
  }

  return (
    <>
      <Form {...formFilter}>
        <form
          method='post'
          action=''
          id='profile-info-form'
          noValidate
          onSubmit={formFilter.handleSubmit(onSubmitFilter)}
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
                        maxLength={50}
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
              name='statusNews'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
              Sarch
              <MagnifyingGlassIcon className='w-4 h-4 ml-auto opacity-50' />
            </Button>
            <Button
              type='button'
              className='flex-1 md:flex-initial md:w-24'
              variant='success'
              onClick={() => handleAddDialog()}>
              Add <PlusIcon className='w-4 h-4 ml-auto opacity-50' />
            </Button>
            <Button
              type='button'
              className='flex-1 md:flex-initial md:w-24'
              variant='outline'
              onClick={() => handleResetFilter()}>
              Clear <EraserIcon className='w-4 h-4 ml-auto opacity-50' />
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
