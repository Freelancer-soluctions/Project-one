import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../modules/auth/slice/authSlice'
import newsApi from '../modules/news/slice/newsSlice'

// export default configureStore({
//   reducer: {
//     unValor: origenSlice.reducer
//   }
// })

// import { configureStore } from "@reduxjs/toolkit";
// import todoReducer from "./slice/todo";

const store = configureStore({
  reducer: {
    auth: authSlice,
    [newsApi.reducerPath]: newsApi.reducer
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(newsApi.middleware),
})

export default store
