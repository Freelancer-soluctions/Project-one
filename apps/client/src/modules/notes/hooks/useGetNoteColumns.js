import { useGetAllNotesColumnsQuery } from '../api/notesAPI';

/**
 * Custom hook to fetch note status columns.
 *
 * RTK Query automatically caches and deduplicates:
 * - Multiple components using this hook share the same request.
 * - Data is shared via RTK Query's global cache.
 *
 * @returns {{ dataColumns: Array<{id: number, code: string, title: string}>, isLoadingColumns: boolean, isFetchingColumns: boolean }}
 */
export function useGetNoteColumns() {
  const {
    data: dataColumns = { data: [] },
    isLoading: isLoadingColumns,
    isFetching: isFetchingColumns,
  } = useGetAllNotesColumnsQuery();

  return {
    dataColumns: dataColumns?.data ?? [],
    isLoadingColumns,
    isFetchingColumns,
  };
}