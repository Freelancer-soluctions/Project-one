import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authSlice from '../modules/auth/slice/authSlice'
import newsApi from '../modules/news/slice/newsSlice'
import settingsApi from '../modules/settings/slice/settingsSlice'
import storageSession from 'redux-persist/lib/storage/session';
import { persistStore, persistReducer } from 'redux-persist';


// const persistConfig = {
//   key: 'auth',
//   storage: storageSession,
//    whitelist: ['auth'], // Solo persistir el slice 'auth'
//    blacklist: ['settingsApi'], // Excluir el slice de settingsApi de la persistencia
// };

// const rootReducer = combineReducers({
//   auth: authSlice,
//   [newsApi.reducerPath]: newsApi.reducer,
//   [settingsApi.reducerPath]: settingsApi.reducer
// });

// const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  // reducer: persistedReducer,
  reducer: {
    auth: authSlice,
    [newsApi.reducerPath]: newsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ 
      // serializableCheck: false, // Necesario para redux-persist
    }).concat(newsApi.middleware, settingsApi.middleware),
})
store.subscribe(() => {
  console.log('Estado persistido:', store.getState());
});
// const persistor = persistStore(store);

export { store };
