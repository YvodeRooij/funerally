/**
 * I18N HOOKS - Custom hooks for internationalization
 * 
 * Purpose: Provides type-safe translation hooks and utilities
 * Features: Translation hooks, locale switching, RTL detection
 */

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from './config';
import { isRTLLocale, getTextDirection, localeConfig } from './config';

// Main translation hook with type safety
export function useAppTranslations() {
  const navigation = useTranslations('navigation');
  const hero = useTranslations('hero');
  const common = useTranslations('common');
  const auth = useTranslations('auth');
  const onboarding = useTranslations('onboarding');
  const dashboard = useTranslations('dashboard');
  const family = useTranslations('family');
  const director = useTranslations('director');
  const venue = useTranslations('venue');
  const booking = useTranslations('booking');
  const documents = useTranslations('documents');
  const communication = useTranslations('communication');
  const cultural = useTranslations('cultural');
  const errors = useTranslations('errors');
  const success = useTranslations('success');
  const time = useTranslations('time');

  return {
    navigation,
    hero,
    common,
    auth,
    onboarding,
    dashboard,
    family,
    director,
    venue,
    booking,
    documents,
    communication,
    cultural,
    errors,
    success,
    time,
  };
}

// Locale information hook
export function useLocaleInfo() {
  const locale = useLocale() as Locale;
  const config = localeConfig[locale];
  const isRTL = isRTLLocale(locale);
  const textDirection = getTextDirection(locale);

  return {
    locale,
    config,
    isRTL,
    textDirection,
    name: config.name,
    flag: config.flag,
    region: config.region,
    dateFormat: config.dateFormat,
    timeFormat: config.timeFormat,
    currency: config.currency,
    culturalContext: config.culturalContext,
  };
}

// Locale switching hook
export function useLocaleSwitch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: Locale) => {
    startTransition(() => {
      const currentPath = window.location.pathname;
      const currentSearch = searchParams.toString();
      
      // Remove current locale from path if present
      const pathWithoutLocale = currentPath.replace(/^\/(nl|en|ar|tr)/, '') || '/';
      
      // Construct new path with locale
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      const fullPath = currentSearch ? `${newPath}?${currentSearch}` : newPath;
      
      // Set cookie for persistence
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
      
      // Navigate to new locale
      router.push(fullPath);
    });
  };

  return {
    switchLocale,
    isPending,
  };
}

// RTL layout utilities
export function useRTLLayout() {
  const { isRTL, textDirection } = useLocaleInfo();

  const getRTLClasses = (baseClasses: string) => {
    if (!isRTL) return baseClasses;
    
    return baseClasses
      .replace(/ml-/g, 'temp-ml-')
      .replace(/mr-/g, 'ml-')
      .replace(/temp-ml-/g, 'mr-')
      .replace(/pl-/g, 'temp-pl-')
      .replace(/pr-/g, 'pl-')
      .replace(/temp-pl-/g, 'pr-')
      .replace(/left-/g, 'temp-left-')
      .replace(/right-/g, 'left-')
      .replace(/temp-left-/g, 'right-')
      .replace(/rounded-l/g, 'temp-rounded-l')
      .replace(/rounded-r/g, 'rounded-l')
      .replace(/temp-rounded-l/g, 'rounded-r');
  };

  const getFlexDirection = (isReverse: boolean = false) => {
    if (!isRTL) return isReverse ? 'flex-row-reverse' : 'flex-row';
    return isReverse ? 'flex-row' : 'flex-row-reverse';
  };

  const getTextAlign = (align: 'left' | 'right' | 'center' = 'left') => {
    if (align === 'center') return 'text-center';
    if (!isRTL) return align === 'left' ? 'text-left' : 'text-right';
    return align === 'left' ? 'text-right' : 'text-left';
  };

  return {
    isRTL,
    textDirection,
    getRTLClasses,
    getFlexDirection,
    getTextAlign,
  };
}

// Cultural context hook for sensitive content
export function useCulturalContext() {
  const { culturalContext } = useLocaleInfo();
  
  const getGreeting = () => {
    switch (culturalContext) {
      case 'arabic':
        return 'السلام عليكم'; // As-salamu alaykum
      case 'turkish':
        return 'Merhaba';
      case 'dutch':
        return 'Goedendag';
      default:
        return 'Hello';
    }
  };

  const getCondolenceMessage = () => {
    switch (culturalContext) {
      case 'arabic':
        return 'إنا لله وإنا إليه راجعون'; // Inna lillahi wa inna ilayhi raji'un
      case 'turkish':
        return 'Başınız sağ olsun';
      case 'dutch':
        return 'Gecondoleerd';
      default:
        return 'Our condolences';
    }
  };

  const getReligiousConsiderations = () => {
    switch (culturalContext) {
      case 'arabic':
        return {
          prayerTimes: true,
          halalFood: true,
          genderSeparation: true,
          islamicRituals: true,
        };
      case 'turkish':
        return {
          prayerTimes: true,
          halalFood: true,
          islamicRituals: true,
        };
      default:
        return {
          generalReligious: true,
        };
    }
  };

  return {
    culturalContext,
    getGreeting,
    getCondolenceMessage,
    getReligiousConsiderations,
  };
}

// Date and time formatting hook
export function useDateTimeFormat() {
  const { dateFormat, timeFormat, locale } = useLocaleInfo();

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString(locale);
  };

  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateObj);
  };

  return {
    dateFormat,
    timeFormat,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
  };
}