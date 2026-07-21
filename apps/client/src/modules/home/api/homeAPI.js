/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Define a service using a base URL and expected endpoints
const homeApi = createApi({
  reducerPath: 'homeApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  endpoints: (builder) => ({
    // getAllCountNotes moved to @/modules/notes/api/notesAPI
    // NotesSummary uses useGetAllCountNotesQuery from notesAPI directly.
    // Keep this file for future home-scoped endpoints.
  }),
});

// Export hooks for usage in functional components — add new endpoints here as needed
export default homeApi;
