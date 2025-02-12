import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EventDialog, EventList, EventFiltersForm } from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { Spinner } from '@/components/loader/Spinner'
import {
  useCreateEventMutation,
  useGetAllEventTypesQuery
} from '../slice/eventsSlice'

export default function Events() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [event, setEvent] = useState({})
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Nueva era del Marketing al alcance de todos',
      description: 'Marketing digital y estrategias modernas',
      speaker: 'Lola Sánchez',
      type: 'conference',
      startTime: '9:00',
      endTime: '10:00',
      creationDate: new Date().toISOString()
    },
    // Agregamos más eventos de ejemplo para probar el scroll
    {
      id: '2',
      title: 'Tecnologías portátiles de IA para publicidad',
      description: 'Implementaciones prácticas de IA',
      speaker: 'Bruno Lago',
      type: 'workshop',
      startTime: '10:10',
      endTime: '10:40',
      creationDate: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Aplicaciones de negocio para estar más conectados',
      description: 'Mejorando la conectividad empresarial',
      speaker: 'Lucas Villanueva',
      type: 'session',
      startTime: '11:00',
      endTime: '12:35',
      creationDate: new Date().toISOString()
    }
    // ... más eventos para demostrar el scroll
  ])
  const [
    createEvent,
    {
      isLoading: isLoadingPost,
      isError: isErrorPost,
      isSuccess: isSuccessPost,
      error: errorPost
    }
  ] = useCreateEventMutation()

  const {
    data: dataTypes,
    isLoading: isLoadingTypes,
    isError: isErrorTypes,
    isSuccess: isSuccessType,
    isFetching: isFetchingTypes,
    error: errorTypes
  } = useGetAllEventTypesQuery()

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events
    const searchQueryLower = searchQuery.toLowerCase()

    return events.filter(
      event =>
        event.title.toLowerCase().includes(searchQueryLower.toLowerCase()) ||
        event.speaker.toLowerCase().includes(searchQueryLower.toLowerCase())
    )
  }, [events, searchQuery])

  const handleAddEvent = async newEvent => {
    await createEvent({ ...newEvent })
    setIsDialogOpen(false)
  }

  const handleEditEvent = updatedEvent => {
    setEvent(updatedEvent)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = id => {
    setEvents(events.filter(event => event.id !== id))
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('events')} />
      <div className='relative flex flex-col h-screen'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingPost || isLoadingTypes || isFetchingTypes) && <Spinner />}
        {/* Header fijo */}
        <EventFiltersForm
          setSearchQuery={setSearchQuery}
          searchQuery={searchQuery}
          setIsDialogOpen={setIsDialogOpen}
          setEvent={setEvent}
        />
        {/* Contenedor con scroll */}
        <div className='flex-1 p-4 overflow-y-auto sm:p-6'>
          <EventList
            events={filteredEvents}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        </div>

        <EventDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddEvent}
          event={event}
          dataTypes={dataTypes}
        />
      </div>
    </>
  )
}
