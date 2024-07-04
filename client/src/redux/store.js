import { configureStore } from '@reduxjs/toolkit'
import { origenSlice } from './slices/authSlice'

export default configureStore({
  reducer: {
    unValor: origenSlice.reducer
  }
})

// import { configureStore } from "@reduxjs/toolkit";
// import todoReducer from "./slice/todo";

// export const store = configureStore({
//   reducer: {
//     todo: todoReducer,
//   },
// });
