import {
  useGetAllProductsStatusQuery,
  useGetAllProductCategoriesQuery,
} from '../api/productsAPI';
import { useGetAllProvidersFiltersQuery } from '../../providers/api/providersAPI';
import { useQueryData } from '@/hooks';

/**
 * Shared hook for Products filter dropdown data.
 * Wraps 3 queries used by both Products.jsx and ProductsForms.jsx.
 *
 * @returns {{ datastatus: Array, dataCategory: Array, dataProviders: Array, isLoadingFilters: boolean, isFetchingFilters: boolean }}
 */
export function useProductsFilterData() {
  const datastatus = useQueryData(useGetAllProductsStatusQuery());
  const dataCategory = useQueryData(useGetAllProductCategoriesQuery());
  const dataProviders = useQueryData(useGetAllProvidersFiltersQuery());

  return {
    datastatus: datastatus.data,
    dataCategory: dataCategory.data,
    dataProviders: dataProviders.data,
    isLoadingFilters:
      datastatus.isLoading || dataCategory.isLoading || dataProviders.isLoading,
    isFetchingFilters:
      datastatus.isFetching ||
      dataCategory.isFetching ||
      dataProviders.isFetching,
  };
}
