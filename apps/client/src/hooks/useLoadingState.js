import { useMemo } from 'react';

/**
 * Aggregates loading and fetching states from multiple query results.
 *
 * Eliminates repetitive `(isLoadingA || isLoadingB || ...) && <Spinner />` patterns.
 *
 * @param {Array<{ isLoading: boolean, isFetching: boolean } | null | undefined>} queryStates - Array of query result states
 * @returns {{ isLoading: boolean, isFetching: boolean }}
 *
 * @example
 * const { isLoading, isFetching } = useLoadingState([products, categories, statuses]);
 * // isLoading → true if ANY query is loading
 * // isFetching → true if ANY query is fetching
 */
export function useLoadingState(queryStates = []) {
  return useMemo(() => ({
    isLoading: queryStates.some(q => q?.isLoading),
    isFetching: queryStates.some(q => q?.isFetching),
  }), [queryStates]);
}