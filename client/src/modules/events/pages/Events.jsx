import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EventDialog, EventList, EventFiltersForm } from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { Spinner } from '@/components/loader/Spinner'
import {
  useCreateEventMutation,
  useGetAllEventTypesQuery,
  useGetAllEventsQuery,
  useUpdateEventByIdMutation,
  useDeleteEventByIdMutation
} from '../slice/eventsSlice'

export default function Events() {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [event, setEvent] = useState({})

  const [
    createEvent,
    {
      isLoading: isLoadingPost,
      isError: isErrorPost,
      isSuccess: isSuccessPost,
      error: errorPost
    }
  ] = useCreateEventMutation()

  const [
    updateEvent,
    {
      isLoading: isLoadingPut,
      isError: isErrorPut,
      isSuccess: isSuccessPut,
      error: errorPut
    }
  ] = useUpdateEventByIdMutation()
  const [
    deleteEventById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete,
      error: errorDelete
    }
  ] = useDeleteEventByIdMutation()

  const {
    data: dataTypes = { data: [] },
    isLoading: isLoadingTypes,
    isError: isErrorTypes,
    isSuccess: isSuccessTypes,
    isFetching: isFetchingTypes,
    error: errorTypes
  } = useGetAllEventTypesQuery()

  const {
    data: dataEvents = { data: [] },
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
    isSuccess: isSuccessEvents,
    isFetching: isFetchingEvents,
    error: errorEvents
  } = useGetAllEventsQuery(searchQuery)

  const handleAddEvent = async data => {
    data.id
      ? await updateEvent({
          id: data.id,
          data: {
            title: data.title,
            speaker: data.speaker,
            description: data.description,
            type: data.type,
            eventDate: data.eventDate,
            startTime: data.startTime,
            endTime: data.endTime
          }
        }).unwrap()
      : await createEvent({
          title: data.title,
          speaker: data.speaker,
          description: data.description,
          type: data.type,
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime
        }).unwrap()
    setIsDialogOpen(false)
  }

  const handleEditEvent = updatedEvent => {
    setEvent(updatedEvent)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = async id => {
    await deleteEventById(id).unwrap()
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('events')} />
      <div className='relative flex flex-col h-screen'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingEvents ||
          isLoadingPost ||
          isLoadingPut ||
          isLoadingTypes ||
          isLoadingDelete ||
          isFetchingTypes ||
          isFetchingEvents) && <Spinner />}
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
            events={dataEvents.data}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        </div>

        <EventDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddEvent}
          event={event}
          dataTypes={dataTypes?.data}
        />
      </div>
    </>
  )
}
