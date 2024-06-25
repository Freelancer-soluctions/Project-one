import {createSlice} from "@reduxjs/toolkit"

export const origenSlice = createSlice({
    name: 'unValor',
    initialState:{miNombre:'JAM'},
    reducers:{
       guardarMiNombre:(state, action)=>{
        state.miNombre = action.payload
       } 
    }
})

export const {guardarMiNombre} = origenSlice.actions