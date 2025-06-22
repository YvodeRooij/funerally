/**
 * NEXT-INTL MIDDLEWARE - Language detection and routing (FIXED)
 * 
 * Purpose: Handles automatic language detection and locale-based routing
 * Features: Browser language detection, cookie persistence, RTL support
 * 
 * IMPORTANT CHANGE: localePrefix changed from 'as-needed' to 'always'
 * This ensures all routes have locale prefix (e.g., /en/dashboard)
 * which matches the new app/[locale]/ directory structure
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // CRITICAL: Changed from 'as-needed' to 'always'
  // This ensures all routes have locale prefix to match app/[locale]/ structure
  localePrefix: 'always',
  
  // Alternate links for SEO
  alternateLinks: true,
  
  // Custom locale detection strategy
  localeDetection: {
    // Check for language preference in this order:
    // 1. URL pathname
    // 2. Cookie
    // 3. Accept-Language header
    // 4. Default locale
    cookieName: 'NEXT_LOCALE',
    
    // Persist language choice for 1 year
    cookieOptions: {
      maxAge: 365 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: false, // Allow client-side access for language selector
    },
  },
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (images, favicon, etc.)
  // - Next.js internals
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(nl|en|ar|tr)/:path*',
    
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};