import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authSlice from '../modules/auth/slice/authSlice'
import newsApi from '../modules/news/api/newsAPI'
import notesApi from '../modules/notes/api/notesAPI'
import eventsApi from '@/modules/events/api/eventsAPI'
import homeApi from '@/modules/home/api/homeAPI'
import productsApi from '@/modules/products/api/productsAPI'
import providersApi from '@/modules/providers/api/providersAPI'
import settingsSlice from '@/modules/settings/slice/settingsSlice'
import settingsProductCategoriesApi from '@/modules/settingsProductCategories/api/SettingsProductCategoriesAPI'
import warehouseApi from '@/modules/warehouse/api/warehouseAPI'
import stockApi from '@/modules/stock/api/stockAPI'
import clientsApi from '@/modules/clients/api/clientsApi'
import salesApi from '@/modules/sales/api/salesAPI'
import purchaseApi from '@/modules/purchase/api/purchaseAPI'
import storageSession from 'redux-persist/lib/storage/session'
import { persistStore, persistReducer } from 'redux-persist'
import inventoryMovementApi from '@/modules/inventoryMovement/api/inventoryMovementAPI'
import usersApi from '@/modules/users/api/usersApi'
import expensesApi from '@/modules/expenses/api/expensesApi'
import attendanceApi from '@/modules/attendance/api/attendanceApi'
import employeesApi from '@/modules/employees/api/employeesApi'

const persistConfig = {
  key: 'root',
  storage: storageSession,
  whitelist: ['auth', 'settings'] // Agregar 'settings' para persistirlo
  // blacklist: ['settingsApi'], // Mantener la exclusión de settingsApi
}

// const persistConfig = {
//   key: 'auth',
//   storage: storageSession,
//    whitelist: ['auth'], // Solo persistir el slice 'auth'
//   //  blacklist: ['settingsApi'], // Excluir el slice de settingsApi de la persistencia
// };

const rootReducer = combineReducers({
  auth: authSlice,
  settings: settingsSlice,
  [homeApi.reducerPath]: homeApi.reducer,
  [newsApi.reducerPath]: newsApi.reducer,
  [notesApi.reducerPath]: notesApi.reducer,
  [eventsApi.reducerPath]: eventsApi.reducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [providersApi.reducerPath]: providersApi.reducer,
  [settingsProductCategoriesApi.reducerPath]:
  settingsProductCategoriesApi.reducer,
  [warehouseApi.reducerPath]: warehouseApi.reducer,
  [stockApi.reducerPath]: stockApi.reducer,
  [clientsApi.reducerPath]: clientsApi.reducer,
  [salesApi.reducerPath]: salesApi.reducer,
  [purchaseApi.reducerPath]: purchaseApi.reducer,
  [inventoryMovementApi.reducerPath]: inventoryMovementApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [expensesApi.reducerPath]: expensesApi.reducer,
  [attendanceApi.reducerPath]: attendanceApi.reducer,
  [employeesApi.reducerPath]: employeesApi.reducer
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  // reducer: {
  //   auth: authSlice,
  //   [newsApi.reducerPath]: newsApi.reducer,
  //   [settingsApi.reducerPath]: settingsApi.reducer
  // },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false // Necesario para redux-persist
    }).concat(
      newsApi.middleware,
      notesApi.middleware,
      eventsApi.middleware,
      homeApi.middleware,
      productsApi.middleware,
      providersApi.middleware,
      settingsProductCategoriesApi.middleware,
      warehouseApi.middleware,
      stockApi.middleware,
      clientsApi.middleware,
      salesApi.middleware,
      purchaseApi.middleware,
      inventoryMovementApi.middleware,
      usersApi.middleware,
      expensesApi.middleware,
      attendanceApi.middleware,
      employeesApi.middleware
    )
})
// store.subscribe(() => {
//   console.log('Estado persistido:', store.getState());
// });
const persistor = persistStore(store)

export { store, persistor }
