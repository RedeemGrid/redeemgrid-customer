// @ts-nocheck
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ...
const localeModules = import.meta.glob('./locales/*.json', { eager: true });

const resources = {};

export interface Language {
  code: string;
  name: string;
}

export const availableLanguages: Language[] = [];

Object.keys(localeModules).forEach((path) => {
  // Extract language code from filename, e.g., './locales/en.json' -> 'en'
  const langCode = path.replace('./locales/', '').replace('.json', '');
  const data = localeModules[path].default || localeModules[path];
  
  resources[langCode] = { translation: data };
  
  availableLanguages.push({
    code: langCode,
    name: data._name || langCode.toUpperCase()
  });
});

i18n
// ...
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }
  });

export default i18n;

