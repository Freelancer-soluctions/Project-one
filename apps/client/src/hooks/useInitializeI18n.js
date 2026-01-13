import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import {getLanguageByUserIdFetch} from '@/modules/settings/slice/settingsSlice'
// import { useGetTranslation } from "@/hooks/useGetTranslation";
import i18n from '@/config/i18n'; // Importamos la instancia de i18n

export const useInitializeI18n = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.data?.user?.id);
  const response = useSelector((state) => state.settings.dataSettings);

  // ⚡️ Mover el dispatch dentro de useEffect para que se ejecute solo una vez
  useEffect(() => {
    if (userId) {
      dispatch(getLanguageByUserIdFetch(userId));
    }
  }, [dispatch, userId]); // Solo se ejecuta si userId cambia

  // ⚡️ Asegurar que el cambio de idioma solo ocurra cuando haya un valor válido
  useEffect(() => {
    if (response?.language?.data?.language && !response.language?.error) {
      i18n.changeLanguage(response.language.data.language);
    }
  }, [response?.language?.data?.language]); // Se ejecuta solo cuando cambia el idioma obtenido
};
