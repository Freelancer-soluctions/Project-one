import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authSlice from '../modules/auth/slice/authSlice'
import newsApi from '../modules/news/api/newsAPI'
import notesApi from '../modules/notes/api/notesAPI'
import eventsApi from '@/modules/events/api/eventsAPI'
import homeApi from '@/modules/home/api/homeAPI'
import productsApi from '@/modules/products/api/productsAPI'

import storageSession from 'redux-persist/lib/storage/session'
import { persistStore, persistReducer } from 'redux-persist'
import settingsSlice from '@/modules/settings/slice/settingsSlice'

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
  [productsApi.reducerPath]: productsApi.reducer
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
      productsApi.middleware
    )
})
// store.subscribe(() => {
//   console.log('Estado persistido:', store.getState());
// });
const persistor = persistStore(store)

export { store, persistor }
