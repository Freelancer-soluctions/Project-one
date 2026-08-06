import { useMemo } from 'react';
import { useGetAllHashtagsQuery } from '@/modules/notes/api/notesAPI';

/**
 * Custom hook to fetch hashtags and transform them into HashtagItem format.
 *
 * RTK Query automatically caches and deduplicates requests:
 * - Multiple components using this hook share the same request.
 * - Data is shared via RTK Query's global cache.
 * - Refetching/revalidation is handled automatically.
 *
 * @returns {{ hashtagItems: Array<{id: string, name: string}> }}
 */
export function useGetHashtagItems() {
  const { data: hashtagsResponse } = useGetAllHashtagsQuery();
  const hashtagsData = hashtagsResponse?.data;

  const hashtagItems = useMemo(() => {
    return Array.isArray(hashtagsData)
      ? hashtagsData.map((h) => ({
          id: String(h.id),
          name: h.name,
        }))
      : [];
  }, [hashtagsData]);

  return {
    hashtagItems,
  };
}
