# Proposal: Products Module — RTK Query Pattern Standardization

## Why
The Products module has 3 filter queries (`useGetAllProductsStatusQuery`, `useGetAllProductCategoriesQuery`, `useGetAllProvidersFiltersQuery`) duplicated identically across 2 pages (`Products.jsx` and `ProductsForms.jsx`). This causes:
- Code duplication (3 query declarations × 2 files = 6 declarations for the same data)
- Inconsistent `.data` extraction (sometimes in page, sometimes in child component)
- Manual spinner aggregation with 11+ boolean flags chained with `||`
- Prop drilling passing full response objects to children

## What
1. Create `modules/products/hooks/useProductsFilterData.js` — wraps 3 shared filter queries, returns unwrapped arrays + aggregated loading state
2. Migrate Products.jsx: use new hook + useQueryData + useLoadingState from foundation utilities
3. Migrate ProductsForms.jsx: use new hook + useQueryData + useLoadingState
4. Update child components to receive direct arrays instead of wrapped response objects

## Capabilities

### New Capabilities
- `products-filter-data`: Shared hook wrapping 3 filter queries (status, categories, providers) with unwrapped array returns and aggregated loading states

### Modified Capabilities
- None

## Impact
- Zero behavioral changes
- Products module only (no cross-module changes)
- Build must pass cleanly
