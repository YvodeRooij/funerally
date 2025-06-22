/**
 * NEXT-INTL MIDDLEWARE - Next.js 15 Best Practices
 * 
 * Purpose: Handles automatic language detection and locale-based routing
 * Features: Modern defineRouting API, proper middleware configuration
 */

import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes starting with `/api`, `/trpc`
  // - Next.js internals `/_next` or `/_vercel`
  // - Static files containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)' 
};