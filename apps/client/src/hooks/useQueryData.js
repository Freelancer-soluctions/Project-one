import { useMemo } from 'react';

const DEFAULT_VALUE = [];

/**
 * Standardizes extraction of RTK Query response data.
 *
 * Backend wraps all responses in { error, statusCode, data }.
 * This hook unwraps `.data` and provides consistent defaults.
 *
 * @template T
 * @param {{ data?: { data?: T }, isLoading: boolean, isFetching: boolean, isError: boolean, error?: unknown } | undefined | null} queryResult - RTK Query hook result
 * @param {T} [defaultValue=DEFAULT_VALUE] - Default value when data is undefined
 * @returns {{ data: T, isLoading: boolean, isFetching: boolean, isError: boolean, error?: unknown }}
 *
 * @example
 * const products = useQueryData(useGetAllProductsQuery());
 * // products.data  → array (not { data: [...] })
 * // products.isLoading → boolean
 */
export function useQueryData(queryResult, defaultValue = DEFAULT_VALUE) {
  return useMemo(() => {
    const { data, isLoading, isFetching, isError, error } = queryResult ?? {};
    return {
      data: data?.data ?? defaultValue,
      isLoading: isLoading ?? false,
      isFetching: isFetching ?? false,
      isError: isError ?? false,
      error,
    };
  }, [queryResult, defaultValue]);
}