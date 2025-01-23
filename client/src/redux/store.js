import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../modules/auth/slice/authSlice'
import newsApi from '../modules/news/slice/newsSlice'
import storageSession from 'redux-persist/lib/storage/session';
import { persistStore, persistReducer } from 'redux-persist';


const persistConfig = {
  key: 'auth',
  storage: storageSession,
  // whitelist: ['auth'], // Solo persistir el slice 'auth'
};

const persistedReducer = persistReducer(persistConfig, authSlice);

const store = configureStore({
  reducer: {
    auth: persistedReducer,
    [newsApi.reducerPath]: newsApi.reducer
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ 
      serializableCheck: false, // Necesario para redux-persist}
    }).concat(newsApi.middleware),
})
store.subscribe(() => {
  console.log('Estado persistido:', store.getState());
});
const persistor = persistStore(store);

export { store, persistor };
