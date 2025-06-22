/**
 * NEXT-INTL ROUTING CONFIGURATION - Next.js 15 Best Practices
 * 
 * Purpose: Centralized, type-safe routing configuration
 * Features: Modern defineRouting API, proper locale handling
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['nl', 'en', 'ar', 'tr'],
  
  // Used when no locale matches
  defaultLocale: 'nl',
  
  // Locale prefix configuration
  localePrefix: 'always', // Always show locale prefix for clarity
  
  // Pathname localization
  pathnames: {
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
  }
});

// Export types for use in other files
export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];