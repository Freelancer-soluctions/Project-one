// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import enJSON from "@/locale/en.json";
// import esJSON from "@/locale/es.json";



// i18n.use(initReactI18next).init({
//  resources: { 
//     en: { ...enJSON },
//     es: { ...esJSON },
// }, // Where we're gonna put translations' files
//  lng: "es",     // Set the initial language of the App
//  fallbackLng: 'en', // If the language is not found, it will use this one
//  interpolation: {
//     escapeValue: false, // React ya maneja escapar caracteres
//   },
// });

// export default i18n;



import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enJSON from "@/locale/en.json";
import esJSON from "@/locale/es.json";
import { useLazyGetSettingLanguageById } from '@/modules/settings/slice/settingsSlice';

// Función asíncrona para obtener el idioma
const getLanguageFromAPI = async () => {
  const { id } = useSelector(state => state.auth.user)
  // Suponiendo que usas `useLazyGetSettingLanguageById` para obtener el idioma
  const [getLanguage, { data, isLoading, isError }] = useLazyGetSettingLanguageById();

  // Llamada a la API para obtener el idioma preferido del usuario
  await getLanguage({ id });  // Asegúrate de pasar el ID del usuario correctamente
  
  // Devuelve el idioma preferido, o 'es' como fallback
  return data ? data.language : 'es'; // Ajusta según la respuesta de la API
};

// Configuración de i18next con el idioma dinámico
const initializeI18n = async () => {
  const language = await getLanguageFromAPI();

  i18n.use(initReactI18next).init({
    resources: { 
      en: { ...enJSON },
      es: { ...esJSON },
    },
    lng: language,  // Usamos el idioma obtenido desde la API
    fallbackLng: 'en', // Idioma de respaldo
    interpolation: {
      escapeValue: false, // React ya maneja escapar caracteres
    },
  });
};

// Ejecutar la inicialización de i18n
initializeI18n();

export default i18n;
