import { createI18n } from 'vue-i18n'
import en from './en'
import zh from './zh'

const savedLocale = localStorage.getItem('locale') || 'zh'

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: savedLocale, // Default locale
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
})

export default i18n
