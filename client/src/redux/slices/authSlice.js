import {createSlice, createAsyncThunk} from "@reduxjs/toolkit"

export const origenSlice = createSlice({
    name: 'unValor',
    initialState:{miNombre:'JAM'},
    reducers:{
       guardarMiNombre:(state, action)=>{
        state.miNombre = action.payload
       } 
    }
})

export const {guardarMiNombre} = origenSlice.actions //Cuando se trabaja con slice se obtine actions que hace referencia a los reducersm, pero estas son acciones
export origenSlice





// Action
export const fetchTodos = createAsyncThunk("fetchTodos", async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos");
  return response.json();
});

const todoSlice = createSlice({
  name: "todo",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTodos.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchTodos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });
    builder.addCase(fetchTodos.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isError = true;
    });
  },
});

// export default todoSlice.reducer;

// // Extract the action creators object and the reducer
// const { actions, reducer } = postsSlice
// // Extract and export each action creator by name
// export const { createPost, updatePost, deletePost } = actions
// // Export the reducer, either as a default or named export
// export default reducer