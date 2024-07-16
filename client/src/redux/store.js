import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../modules/auth/slice/authSlice'

// export default configureStore({
//   reducer: {
//     unValor: origenSlice.reducer
//   }
// })

// import { configureStore } from "@reduxjs/toolkit";
// import todoReducer from "./slice/todo";

const store = configureStore({
  reducer: {
    auth: authSlice
  }
})

export default store
