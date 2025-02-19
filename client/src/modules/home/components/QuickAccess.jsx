import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

export function QuickAccessButton({
  icon: Icon,
  label,
  content: ContentComponent,
  contentProps,
  className
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size='lg' variant='quickAccess' className={`${className}`}>
          {Icon && <Icon className='w-5 h-5' />}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-80'
        side='right'
        align='start'
        sideOffset={20}>
        {ContentComponent && <ContentComponent {...contentProps} />}
      </PopoverContent>
    </Popover>
  )
}
