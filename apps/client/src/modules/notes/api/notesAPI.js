/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Define a service using a base URL and expected endpoints
const notesApi = createApi({
  reducerPath: 'notesApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Notes', 'Hashtags'],
  endpoints: (builder) => ({
    getAllCountNotes: builder.query({
      query: () => ({
        url: `/notes/notesCount`,
        method: 'GET',
      }),
      providesTags: ['Notes'],
    }),

    getAllNotes: builder.query({
      query: (args) => ({
        url: `/notes`,
        method: 'GET',
        params: { ...args },
      }),
      providesTags: ['Notes'],
    }),
    getAllNotesColumns: builder.query({
      query: () => ({
        url: `/notes/notesColumns`,
        method: 'GET',
      }),
    }),
    updateNoteColumId: builder.mutation({
      query: (body) => ({
        url: `/notes/noteColumn`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
    updateNoteById: builder.mutation({
      query: ({ id, body }) => ({
        url: `/notes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
    createNote: builder.mutation({
      query: (body) => ({
        url: `/notes/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
    deleteNoteById: builder.mutation({
      query(id) {
        return {
          url: `/notes/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Notes'],
    }),
    getMentionsByNoteId: builder.query({
      query: (noteId) => ({
        url: `/notes/${noteId}/mentions`,
        method: 'GET',
      }),
    }),

    // === HASHTAG ENDPOINTS ===

    getAllHashtags: builder.query({
      query: () => ({
        url: `/notes/hashtags`,
        method: 'GET',
      }),
      providesTags: ['Hashtags'],
    }),
    createHashtag: builder.mutation({
      query: (body) => ({
        url: `/notes/hashtags`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Hashtags'],
    }),
    updateHashtag: builder.mutation({
      query: ({ id, body }) => ({
        url: `/notes/hashtags/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Hashtags'],
    }),
    deleteHashtag: builder.mutation({
      query(id) {
        return {
          url: `/notes/hashtags/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Hashtags'],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllNotesQuery,
  useGetAllNotesColumnsQuery,
  useCreateNoteMutation,
  useUpdateNoteColumIdMutation,
  useUpdateNoteByIdMutation,
  useDeleteNoteByIdMutation,
  useGetAllCountNotesQuery,
  useGetMentionsByNoteIdQuery,
  useGetAllHashtagsQuery,
  useCreateHashtagMutation,
  useUpdateHashtagMutation,
  useDeleteHashtagMutation,
} = notesApi;

export default notesApi;
