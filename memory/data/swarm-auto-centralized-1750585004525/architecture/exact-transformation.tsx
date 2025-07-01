// EXACT TRANSFORMATION FOR: /workspaces/farewelly/app/[locale]/layout.tsx
// This is the precise before/after transformation needed

// BEFORE (Current failing code):
/*
export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages(locale);
  const direction = getTextDirection(locale as any);

  return (
    <div lang={locale} dir={direction}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
*/

// AFTER (Fixed version):
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { locales, getTextDirection } from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function getMessages(locale: string) {
  try {
    return (await import(`@/lib/i18n/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // CRITICAL FIX: Await params before destructuring
  const { locale } = await params;
  
  const messages = await getMessages(locale);
  const direction = getTextDirection(locale as any);

  return (
    <div lang={locale} dir={direction}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}

// TRANSFORMATION SUMMARY:
// 1. Changed function signature from `params: { locale }` to `params`
// 2. Updated TypeScript type from `params: { locale: string }` to `params: Promise<{ locale: string }>`
// 3. Added await statement: `const { locale } = await params;` as first line in function body
// 4. Rest of the function remains exactly the same