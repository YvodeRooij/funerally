import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Internationalization configuration
  // Ensure proper handling of locale-based routing
  trailingSlash: false,
  // Optimize for multi-language content
  compress: true,
  // Support for RTL languages
  i18n: undefined, // Disable built-in i18n for next-intl
}

export default withNextIntl(nextConfig)
