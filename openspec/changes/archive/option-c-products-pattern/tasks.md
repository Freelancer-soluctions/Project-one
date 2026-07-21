# Tasks: Products Module — RTK Query Pattern Standardization

## Group 1: Products Filter Hook

- [ ] 1.1 Create `modules/products/hooks/useProductsFilterData.js` wrapping 3 shared queries
- [ ] 1.2 Create `modules/products/hooks/index.js` and export the hook

## Group 2: Products.jsx Migration (children first)

- [ ] 2.1 Update ProductsFiltersForm.jsx: PropTypes array, remove .data access
- [ ] 2.2 Update ProductsDatatable.jsx: remove .data access
- [ ] 2.3 Update Products.jsx: use useProductsFilterData + useQueryData + useLoadingState

## Group 3: ProductsForms.jsx Migration (children first)

- [ ] 3.1 Update ProductBasicInfo.jsx: PropTypes array, remove .data access
- [ ] 3.2 Update ProductsForms.jsx: use useProductsFilterData + useQueryData + useLoadingState
- [ ] 3.3 Add useEffect to sync dataAttributes → attributes (replaces lost onQueryStarted callback)

## Group 4: Verification

- [ ] 4.1 Verify npm run build passes
