import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enJSON from '@/locale/en.json';
import esJSON from '@/locale/es.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { ...enJSON },
    es: { ...esJSON },
  }, // Where we're gonna put translations' files
  lng: 'es', // Set the initial language of the App
  fallbackLng: 'en', // If the language is not found, it will use this one
  interpolation: {
    escapeValue: false, // React ya maneja escapar caracteres
  },
});

export default i18n;
