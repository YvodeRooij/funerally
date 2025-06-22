// Template for Next.js 15 Layout with Dynamic Routes
// Use this template for any layout.tsx files that receive params

import { ReactNode } from 'react';

// Example for locale-based layout
export default async function Layout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // CRITICAL: Always await params before destructuring
  const { locale } = await params;
  
  // Now you can safely use the locale parameter
  // Add your layout logic here
  
  return (
    <div lang={locale}>
      {children}
    </div>
  );
}

// Multi-param example (for nested dynamic routes)
export async function MultiParamLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string; category: string; id: string }>;
}) {
  // Await and destructure all params
  const { locale, category, id } = await params;
  
  return (
    <div lang={locale} data-category={category} data-id={id}>
      {children}
    </div>
  );
}

// Template with generateStaticParams
export async function generateStaticParams() {
  // Return array of param objects for static generation
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'fr' }
  ];
}