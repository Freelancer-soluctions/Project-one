import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  GetSettingsByUserIdFetch,
  SaveLanguage,
  SaveDisplaySettings,
} from '@/modules/settings/api/settingsAPI';

export const getSettingsByUserIdFetch = createAsyncThunk(
  'settings/getSettingsByUserIdFetch',
  async (args, { rejectWithValue }) => {
    try {
      const response = await GetSettingsByUserIdFetch(args);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const saveSettingLanguageFetch = createAsyncThunk(
  'settings/saveLanguage',
  async (args, { rejectWithValue }) => {
    try {
      const response = await SaveLanguage(args);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
export const saveSettingDisplayFetch = createAsyncThunk(
  'settings/display',
  async (args, { rejectWithValue }) => {
    try {
      const response = await SaveDisplaySettings(args);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    isLoading: false,
    dataSettings: { userSettings: null },
    isError: false,
    errorMessage: '',
  },
  // reducers: {

  // },
  extraReducers: (builder) => {
    // getSettingsByUserId
    // eslint-disable-next-line no-unused-vars
    builder.addCase(getSettingsByUserIdFetch.pending, (state, action) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(getSettingsByUserIdFetch.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.dataSettings.userSettings = action.payload;
    });
    builder.addCase(getSettingsByUserIdFetch.rejected, (state, action) => {
      console.log('Error', action.error.message);
      state.isError = true;
      state.isLoading = false;
      state.errorMessage = action.error.message;
    });

    // saveSettingLanguageFetch
    builder.addCase(saveSettingLanguageFetch.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(saveSettingLanguageFetch.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      // // ✅ Actualizar la configuración del usuario correctamente
      if (state.dataSettings.userSettings) {
        state.dataSettings.userSettings = action.payload;
      }
    });
    builder.addCase(saveSettingLanguageFetch.rejected, (state, action) => {
      console.log('Error', action.error.message);
      state.isError = true;
      state.isLoading = false;
      state.errorMessage = action.error.message;
    });

    // saveSettingDisplayFetch
    builder.addCase(saveSettingDisplayFetch.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(saveSettingDisplayFetch.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      // ✅ Actualizar la configuración del usuario correctamente,
      // Los cambios se reflejan de inmediato en Redux.
      // No haces una petición extra al backend, lo que mejora la eficiencia.
      if (state.dataSettings.userSettings) {
        state.dataSettings.userSettings = action.payload;
      }
    });
    builder.addCase(saveSettingDisplayFetch.rejected, (state, action) => {
      console.log('Error', action.error.message);
      state.isError = true;
      state.isLoading = false;
      state.errorMessage = action.error.message;
    });
  },
});

// export const { } = settingsSlice.actions

export default settingsSlice.reducer;
