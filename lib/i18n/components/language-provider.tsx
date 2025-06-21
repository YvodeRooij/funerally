/**
 * ENHANCED LANGUAGE PROVIDER - Next-intl integration with cultural context
 * 
 * Purpose: Provides comprehensive internationalization context
 * Features: Next-intl integration, RTL support, cultural sensitivity
 */

'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect } from 'react';
import { useLocaleInfo, useRTLLayout } from '../hooks';

interface LanguageProviderProps {
  children: ReactNode;
  messages: any;
  locale: string;
}

export function LanguageProvider({ children, messages, locale }: LanguageProviderProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LocaleLayoutProvider>{children}</LocaleLayoutProvider>
    </NextIntlClientProvider>
  );
}

// Internal component to handle layout changes based on locale
function LocaleLayoutProvider({ children }: { children: ReactNode }) {
  const { isRTL, textDirection } = useRTLLayout();

  useEffect(() => {
    // Update document attributes for RTL support
    document.documentElement.setAttribute('dir', textDirection);
    document.documentElement.setAttribute('lang', locale);
    
    // Add RTL class to body for global styles
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Add locale-specific class for cultural styling
    document.body.className = document.body.className.replace(/locale-\w+/g, '');
    document.body.classList.add(`locale-${locale}`);
  }, [isRTL, textDirection, locale]);

  return <>{children}</>;
}