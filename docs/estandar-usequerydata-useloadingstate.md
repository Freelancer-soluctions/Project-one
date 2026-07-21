# Option C: Estándar RTK Query

## 1. Alcance (Scope)

- El proyecto tenía ~25 módulos con acceso inconsistente a datos RTK Query: algunas páginas usaban `.data.dataList`, otras `.data.data`, mezclaban flags de loading de queries y mutations en spinners
- Opción C (híbrida) elegida sobre migración completa (30 hooks) y enfoque selectivo (6 hooks) — 80% beneficio con 20% esfuerzo
- **2 utilidades compartidas** creadas en `apps/client/src/hooks/`:
  - `useQueryData(queryResult, defaultValue?)` - extrae `data?.data ?? defaultValue` del wrapper del backend, estabilizado con useMemo
  - `useLoadingState(queryStates[])` - agrega `isLoading`/`isFetching` de múltiples queries via `Array.some()`
  - Exportadas desde `apps/client/src/hooks/index.js`
- **Módulos migrados**:
  - `option-c-foundation`: Creación de utilidades + fix de 2 bugs (stockAPI mutation→query, inventoryMovementAPI data→body)
  - `option-c-products-pattern`: Products (Products.jsx, ProductsForms.jsx + 3 child components)
  - `option-c-wave-simple`: Clients, Employees, Attendance, Expenses (cada uno: page + datatable + review de filters/dialogs)
- **Total**: 6 módulos, 6 páginas, ~12 componentes hijos actualizados
- **2 bugs corregidos**: stockAPI usaba `builder.mutation` para GET, inventoryMovementAPI usaba `data` en vez de `body`

## 2. Patrón implementado

### Lazy query pattern (módulos con paginación)
```js
const [trigger, queryState] = useLazyGetAllXxxQuery();
const { data: dataItems, isLoading, isFetching } = useQueryData(queryState);

useEffect(() => {
  trigger({ page, limit, ...filters });
}, [page, limit, filters, trigger]);
```

### Loading spinner pattern
```js
// Queries: useLoadingState
const { isLoading: isLoadingAny, isFetching: isFetchingAny } = useLoadingState([{ isLoading, isFetching }]);

// Mutations: se quedan como || chain
const isLoadingMutations = isLoadingPost || isLoadingPut || isLoadingDelete;
```

### Attendance exception (2 queries)
```js
const { data: dataAttendance, isLoading: isLoadingAtt, isFetching: isFetchingAtt } = useQueryData(queryState);
const { data: dataEmployees, isLoading: isLoadingEmp, isFetching: isFetchingEmp } = useQueryData(useGetAllEmployeesFiltersQuery());

const { isLoading: isLoadingAny, isFetching: isFetchingAny } = useLoadingState([
  { isLoading: isLoadingAtt, isFetching: isFetchingAtt },
  { isLoading: isLoadingEmp, isFetching: isFetchingEmp },
]);
```

### Child components reciben datos planos
- Datatables: `PropTypes.shape({ dataList: PropTypes.array, total: PropTypes.number })`
- Filters/Dialogs: `PropTypes.array` (para dropdowns)
- No más `.data.dataList`, `.data.total`, ni `.data` en children

## 3. Beneficios

1. **Consistencia**: Todos los módulos siguen el mismo patrón — mismo import, mismo useEffect trigger, mismo spinner split
2. **Legibilidad**: Child components reciben arrays planos, no response objects anidados
3. **Mantenibilidad**: Cambiar la estructura del backend wrapper requiere cambiar solo `useQueryData`, no 25 módulos
4. **Separación de concerns**: Loading de queries (useLoadingState) separado de mutations (|| chain)
5. **Type safety**: PropTypes actualizados para reflejar la forma real de los datos
6. **80/20**: El enfoque híbrido maximiza beneficio con mínimo esfuerzo

## 4. Decisiones importantes (vital para el proyecto)

### El backend envía datos envueltos
```
{ error: null, statusCode: 200, data: { dataList: [...], total: 100 } }
```
`useQueryData` unwrappy `data?.data` automáticamente. El default es `[]`.

### PropTypes para datatables paginados
Usar `PropTypes.shape({ dataList: PropTypes.array, total: PropTypes.number })` NO `PropTypes.array`.
El valor unwrappped sigue siendo `{ dataList, total }`, no un array plano.

### Mutaciones NO se mueven a hooks
El patrón solo cubre queries. Las mutaciones (create, update, delete) se quedan en page components con su `||` chain de loading.

### Cross-module imports se mantienen
Si Attendance necesita `useGetAllEmployeesFiltersQuery` del módulo Employees, se importa directamente. No se mueve ni se duplica.

### `option-c-foundation` desarchivado como referencia
El cambio base se mantiene accesible en `openspec/changes/option-c-foundation/` para consulta.

### Lint pre-existente
Hay 81 errores de lint pre-existentes no relacionados con estos cambios — no bloquean.

### Chunk size warnings
Notes (592KB) e index (647KB) tienen warnings pre-existentes de tamaño — no introducidos por estos cambios.