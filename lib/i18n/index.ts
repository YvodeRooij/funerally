/**
 * I18N MODULE INDEX - Comprehensive internationalization exports
 * 
 * Purpose: Central export point for all i18n functionality
 * Features: Configuration, hooks, components, utilities
 */

// Configuration exports
export { 
  locales, 
  defaultLocale, 
  rtlLocales, 
  localeConfig, 
  pathnames,
  type Locale,
  isValidLocale,
  getLocaleConfig,
  isRTLLocale,
  getOppositeDirection,
  getTextDirection
} from './config';

// Hook exports
export {
  useAppTranslations,
  useLocaleInfo,
  useLocaleSwitch,
  useRTLLayout,
  useCulturalContext,
  useDateTimeFormat
} from './hooks';

// Component exports
export { LanguageProvider } from './components/language-provider';
export { 
  LanguageSelector, 
  CompactLanguageSelector 
} from './components/language-selector';

// Next-intl re-exports for convenience
export { 
  useTranslations, 
  useLocale, 
  useMessages,
  NextIntlClientProvider
} from 'next-intl';

// Utility functions
export const formatTranslationKey = (namespace: string, key: string) => {
  return `${namespace}.${key}`;
};

export const getLocalizedPath = (path: string, locale: Locale) => {
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
};

export const removeLocaleFromPath = (path: string) => {
  return path.replace(/^\/(nl|en|ar|tr)/, '') || '/';
};

export const extractLocaleFromPath = (path: string): Locale | null => {
  const match = path.match(/^\/(nl|en|ar|tr)/);
  return match ? (match[1] as Locale) : null;
};

// Cultural context utilities
export const getCulturalGreeting = (locale: Locale) => {
  const config = localeConfig[locale];
  switch (config.culturalContext) {
    case 'arabic':
      return 'السلام عليكم';
    case 'turkish':
      return 'Merhaba';
    case 'dutch':
      return 'Goedendag';
    default:
      return 'Hello';
  }
};

export const getCulturalCondolence = (locale: Locale) => {
  const config = localeConfig[locale];
  switch (config.culturalContext) {
    case 'arabic':
      return 'إنا لله وإنا إليه راجعون';
    case 'turkish':
      return 'Başınız sağ olsun';
    case 'dutch':
      return 'Gecondoleerd';
    default:
      return 'Our condolences';
  }
};

// Type definitions for common translation patterns
export interface TranslationNamespaces {
  navigation: any;
  hero: any;
  common: any;
  auth: any;
  onboarding: any;
  dashboard: any;
  family: any;
  director: any;
  venue: any;
  booking: any;
  documents: any;
  communication: any;
  cultural: any;
  errors: any;
  success: any;
  time: any;
}

export interface LocaleMetadata {
  name: string;
  flag: string;
  region: string;
  isRTL: boolean;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  culturalContext: 'dutch' | 'international' | 'arabic' | 'turkish';
}

// Constants for easy access
export const SUPPORTED_LOCALES = locales;
export const DEFAULT_LOCALE = defaultLocale;
export const RTL_LOCALES = rtlLocales;