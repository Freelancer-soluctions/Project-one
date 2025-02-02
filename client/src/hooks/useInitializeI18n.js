
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetTranslation } from "@/hooks/useGetTranslation";
import i18n from "@/config/i18n"; // Importamos la instancia de i18n

export const useInitializeI18n = () => {
    const user = useSelector(state => state.auth.user)
    const { response } = useGetTranslation(user?.data?.user?.id)

    useEffect(() => {
        if (response?.data?.language) {
          i18n.changeLanguage(response.data.language); 
        }
      }, [response]);
 // Se ejecuta cuando cambia la respuesta de la API
};