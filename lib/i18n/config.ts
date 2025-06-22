/**
 * NEXT-INTL CONFIGURATION - Internationalization settings
 * 
 * Purpose: Central configuration for multi-language support
 * Languages: Dutch (default), English, Arabic, Turkish
 * Features: Language detection, routing, RTL support
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Our supported locales
export const locales = ['nl', 'en', 'ar', 'tr'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'nl';

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

// Locale configuration with display names and regions
export const localeConfig = {
  nl: {
    name: 'Nederlands',
    flag: '🇳🇱',
    region: 'NL',
    isRTL: false,
    dateFormat: 'dd-MM-yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    culturalContext: 'dutch'
  },
  en: {
    name: 'English',
    flag: '🇬🇧',
    region: 'GB',
    isRTL: false,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    currency: 'EUR',
    culturalContext: 'international'
  },
  ar: {
    name: 'العربية',
    flag: '🇸🇦',
    region: 'SA',
    isRTL: true,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'h:mm a',
    currency: 'EUR',
    culturalContext: 'arabic'
  },
  tr: {
    name: 'Türkçe',
    flag: '🇹🇷',
    region: 'TR',
    isRTL: false,
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    culturalContext: 'turkish'
  }
} as const;

// Path configuration for locale routing
export const pathnames = {
  '/': '/',
  '/signin': {
    nl: '/aanmelden',
    en: '/signin',
    ar: '/تسجيل-الدخول',
    tr: '/giris'
  },
  '/onboarding': {
    nl: '/introductie',
    en: '/onboarding',
    ar: '/التعريف',
    tr: '/tanitim'
  },
  '/dashboard': {
    nl: '/dashboard',
    en: '/dashboard',
    ar: '/لوحة-التحكم',
    tr: '/pano'
  },
  '/contact': {
    nl: '/contact',
    en: '/contact',
    ar: '/اتصل-بنا',
    tr: '/iletisim'
  }
} as const;

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});

// Helper functions
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleConfig(locale: Locale) {
  return localeConfig[locale];
}

export function isRTLLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getOppositeDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'ltr' : 'rtl';
}

export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}