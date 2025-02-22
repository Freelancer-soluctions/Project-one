import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LuCalendar, LuClock, LuMapPin, LuChevronDown } from 'react-icons/lu'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import Autoplay from 'embla-carousel-autoplay'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useGetAllEventsQuery } from '@/modules/events/api/eventsAPI'
import { sortedEvents, getEventTypeColor } from '@/modules/events/utils'
import { useTranslation } from 'react-i18next'

export function UpcomingEventsAlert() {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))

  const {
    data: dataEvents = { data: [] },
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
    isSuccess: isSuccessEvents,
    isFetching: isFetchingEvents,
    error: errorEvents
  } = useGetAllEventsQuery()

  useEffect(() => {
    if (dataEvents.data.length > 0) {
      // Ordenar eventos por fecha y hora
      const sorted = sortedEvents(dataEvents.data, true)
      setUpcomingEvents(sorted)
    }
  }, [dataEvents])

  if (upcomingEvents.length === 0) return null // cargar configuracion de settings para no ver notificaciones

  return (
    <div className='w-full h-full mx-auto mb-5 max-w-dvh'>
      <div className='w-full'>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className='border-b '>
            <CollapsibleTrigger asChild>
              <Button
                variant='ghost'
                className='flex items-center justify-between w-full h-auto py-2'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-lg font-semibold tracking-tight'>
                    {t('next_events')}
                  </h2>
                  <span className='text-sm text-muted-foreground'>
                    ({upcomingEvents.length})
                  </span>
                </div>
                <LuChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    isOpen && 'transform rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className='py-4 '>
              <Carousel
                opts={{
                  align: 'start',
                  loop: true
                }}
                plugins={[plugin.current]}
                className='w-full'>
                <CarouselContent className='-ml-2'>
                  {upcomingEvents.map(event => (
                    <CarouselItem
                      key={event.id}
                      className='pl-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5'>
                      <Card
                        className={cn(
                          'relative overflow-hidden transition-colors hover:bg-muted/50',
                          'h-[140px]',
                          getEventTypeColor(event.eventTypeCode)
                        )}>
                        <CardContent className='p-3'>
                          <div className='space-y-2'>
                            <div>
                              <div
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getEventTypeColor(event.eventTypeCode)}`}>
                                {event.eventTypeDescription
                                  .charAt(0)
                                  .toUpperCase() +
                                  event.eventTypeDescription.slice(1)}
                              </div>
                              <h3 className='mt-1 font-medium leading-tight line-clamp-1'>
                                {event.title}
                              </h3>
                            </div>

                            <div className='space-y-1 text-xs'>
                              <div className='flex items-center text-muted-foreground'>
                                <LuCalendar className='mr-1.5 h-3.5 w-3.5 shrink-0' />
                                <span className='line-clamp-1'>
                                  {format(
                                    new Date(event.eventDate),
                                    "EEEE d 'de' MMMM",
                                    { locale: es }
                                  )}
                                </span>
                              </div>
                              <div className='flex items-center text-muted-foreground'>
                                <LuClock className='mr-1.5 h-3.5 w-3.5 shrink-0' />
                                <span>
                                  {event.startTime} - {event.endTime}
                                </span>
                              </div>
                              <div className='flex items-center font-medium'>
                                <LuMapPin className='mr-1.5 h-3.5 w-3.5 shrink-0' />
                                <span className='line-clamp-1'>
                                  {event.speaker}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className='hidden sm:flex -left-3 h-7 w-7' />
                <CarouselNext className='hidden sm:flex -right-3 h-7 w-7' />
              </Carousel>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
