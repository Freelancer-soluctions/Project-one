/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Define a service using a base URL and expected endpoints
const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Events'], // Agrega un tag identificador
  endpoints: (builder) => ({
    getAllEvents: builder.query({
      query: ({ page, limit, search }) => ({
        url: `/events`,
        method: 'GET',
        params: { searchQuery: search, page, limit },
      }),
      providesTags: ['Events'], // Indica que este endpoint usa el tag 'Notes'
    }),
    getAllEventTypes: builder.query({
      query: () => ({
        url: `/events/eventTypes`,
        method: 'GET',
      }),
    }),

    updateEventById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/events/${id}`,
        method: 'PATCH',
        body: { ...data },
      }),
      invalidatesTags: ['Events'], // Invalida el cache de 'Events' para volver a consultar
    }),
    createEvent: builder.mutation({
      query: (body) => ({
        url: `/events/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Events'], // Invalida el cache de 'Events' para volver a consultar
    }),
    deleteEventById: builder.mutation({
      query(id) {
        return {
          url: `/events/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Events'], // Invalida el cache de 'Notes' para volver a consultar
    }),
    // === RSVP Endpoints ===
    registerForEvent: builder.mutation({
      query: (eventId) => ({
        url: `/events/${eventId}/register`,
        method: 'POST',
      }),
      invalidatesTags: ['Events'],
    }),
    cancelRegistration: builder.mutation({
      query: (eventId) => ({
        url: `/events/${eventId}/register`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Events'],
    }),
    listAttendees: builder.query({
      query: ({ eventId, ...params }) => ({
        url: `/events/${eventId}/attendees`,
        method: 'GET',
        params,
      }),
      providesTags: ['Events'],
    }),
    updateAttendeeStatus: builder.mutation({
      query: ({ eventId, attendeeId, data }) => ({
        url: `/events/${eventId}/attendees/${attendeeId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Events'],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllEventsQuery,
  useLazyGetAllEventsQuery,
  useCreateEventMutation,
  useGetAllEventTypesQuery,
  useUpdateEventByIdMutation,
  useDeleteEventByIdMutation,
  useRegisterForEventMutation,
  useCancelRegistrationMutation,
  useLazyListAttendeesQuery,
  useUpdateAttendeeStatusMutation,
} = eventsApi;

export default eventsApi;
