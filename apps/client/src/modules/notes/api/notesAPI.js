/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Note endpoint definitions (each value is an (builder) => endpoint fn)
const notesEndpoints = {
  getAllCountNotes: (builder) =>
    builder.query({
      query: (args) => ({
        url: `/notes/notesCount`,
        method: 'GET',
        params: { ...args },
      }),
      providesTags: ['Notes'],
    }),
  getAllNotes: (builder) =>
    builder.query({
      query: (args) => ({
        url: `/notes`,
        method: 'GET',
        params: { ...args },
      }),
      providesTags: ['Notes'],
    }),
  getAllNotesColumns: (builder) =>
    builder.query({
      query: () => ({
        url: `/notes/notesColumns`,
        method: 'GET',
      }),
    }),
  updateNoteColumId: (builder) =>
    builder.mutation({
      query: (body) => ({
        url: `/notes/noteColumn`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
  updateNoteById: (builder) =>
    builder.mutation({
      query: ({ id, body }) => ({
        url: `/notes/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
  createNote: (builder) =>
    builder.mutation({
      query: (body) => ({
        url: `/notes/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
  deleteNoteById: (builder) =>
    builder.mutation({
      query(id) {
        return {
          url: `/notes/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Notes'],
    }),
  getMentionsByNoteId: (builder) =>
    builder.query({
      query: (noteId) => ({
        url: `/notes/${noteId}/mentions`,
        method: 'GET',
      }),
    }),

  // === FAVORITE ENDPOINTS ===
  toggleFavorite: (builder) =>
    builder.mutation({
      query: (noteId) => ({
        url: `/notes/${noteId}/fav`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notes'],
    }),
};

// === HASHTAG ENDPOINTS ===
const hashtagEndpoints = {
  getAllHashtags: (builder) =>
    builder.query({
      query: () => ({
        url: `/notes/hashtags`,
        method: 'GET',
      }),
      providesTags: ['Hashtags'],
    }),
  createHashtag: (builder) =>
    builder.mutation({
      query: (body) => ({
        url: `/notes/hashtags`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Hashtags'],
    }),
  updateHashtag: (builder) =>
    builder.mutation({
      query: ({ id, body }) => ({
        url: `/notes/hashtags/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Hashtags'],
    }),
  deleteHashtag: (builder) =>
    builder.mutation({
      query(id) {
        return {
          url: `/notes/hashtags/${id}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['Hashtags'],
    }),
};

// Resolve { name: (builder) => definition } maps into RTK endpoint defs
const resolveEndpoints = (builder, endpointDefs) =>
  Object.fromEntries(
    Object.entries(endpointDefs).map(([name, define]) => [
      name,
      define(builder),
    ])
  );

// Define a service using a base URL and expected endpoints
const notesApi = createApi({
  reducerPath: 'notesApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Notes', 'Hashtags'],
  endpoints: (builder) => ({
    ...resolveEndpoints(builder, notesEndpoints),
    ...resolveEndpoints(builder, hashtagEndpoints),
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
  useToggleFavoriteMutation,
} = notesApi;

export default notesApi;
