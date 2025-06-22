// Template for Next.js 15 Page Components with Dynamic Routes
// Use this template for any page.tsx files that receive params and searchParams

import { ReactNode } from 'react';

// Basic page with params only
export default async function Page({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  // CRITICAL: Always await params before destructuring
  const { locale, slug } = await params;
  
  return (
    <div>
      <h1>Page for {locale}/{slug}</h1>
    </div>
  );
}

// Page with both params and searchParams
export async function PageWithSearchParams({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await both params and searchParams
  const { locale, id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  return (
    <div>
      <h1>Page {id} in {locale}</h1>
      <pre>{JSON.stringify(resolvedSearchParams, null, 2)}</pre>
    </div>
  );
}

// Complex nested route example
export async function NestedPage({
  params,
  searchParams
}: {
  params: Promise<{ 
    locale: string; 
    category: string; 
    subcategory: string; 
    id: string 
  }>;
  searchParams?: Promise<{ 
    filter?: string; 
    sort?: string; 
    page?: string 
  }>;
}) {
  // Await and destructure nested params
  const { locale, category, subcategory, id } = await params;
  const { filter, sort, page } = searchParams ? await searchParams : {};
  
  return (
    <div>
      <h1>{category}/{subcategory}/{id}</h1>
      <p>Locale: {locale}</p>
      {filter && <p>Filter: {filter}</p>}
      {sort && <p>Sort: {sort}</p>}
      {page && <p>Page: {page}</p>}
    </div>
  );
}

// generateStaticParams for page components
export async function generateStaticParams() {
  return [
    { locale: 'en', slug: 'about' },
    { locale: 'en', slug: 'contact' },
    { locale: 'es', slug: 'acerca' },
    { locale: 'es', slug: 'contacto' }
  ];
}