import { configureStore} from "@reduxjs/toolkit";
import { origenSlice } from "./slices";

export default configureStore({
    reducer:{
        unValor:origenSlice.reducer
    }
})