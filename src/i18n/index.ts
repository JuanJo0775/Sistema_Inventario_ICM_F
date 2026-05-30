import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

const storedLanguage =
  typeof window === 'undefined'
    ? 'es'
    : localStorage.getItem('icm-language') ?? 'es'

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: storedLanguage,
  fallbackLng: 'es',
  supportedLngs: ['es', 'en'],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('icm-language', language)
  }
})

export default i18n
