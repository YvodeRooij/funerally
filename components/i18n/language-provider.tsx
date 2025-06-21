/**
 * INTERNATIONALIZATION PROVIDER - Multi-language support system
 *
 * Purpose: Provides language context for diverse Dutch population
 * Languages: Dutch (primary), English, Arabic, Turkish, Polish, German
 * Features: Dynamic language switching, cultural-appropriate translations
 *
 * Critical for Netherlands:
 * - Large immigrant population needs native language support
 * - Reduces stress during grief by using familiar language
 * - Cultural sensitivity in translations
 * - Right-to-left support for Arabic
 */

"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type Language = "nl" | "en" | "ar" | "tr" | "pl" | "de"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const translations = {
  nl: {
    "nav.home": "Home",
    "nav.how_it_works": "Hoe werkt het",
    "nav.pricing": "Prijzen",
    "nav.providers": "Voor ondernemers",
    "nav.contact": "Contact",
    "nav.start": "Begin hier",
    "hero.title": "Waardig afscheid zonder zorgen",
    "hero.subtitle": "Wij begeleiden u door alle stappen van een uitvaart in Nederland",
    "hero.cta": "Begin hier",
    "guidance.title": "Persoonlijke Begeleiding",
    "guidance.subtitle": "We zijn er om u te helpen",
    "common.loading": "Laden...",
    "common.save": "Opslaan",
    "common.cancel": "Annuleren",
    "common.next": "Volgende",
    "common.previous": "Vorige",
    "common.close": "Sluiten",
  },
  en: {
    "nav.home": "Home",
    "nav.how_it_works": "How it works",
    "nav.pricing": "Pricing",
    "nav.providers": "For providers",
    "nav.contact": "Contact",
    "nav.start": "Get started",
    "hero.title": "Dignified farewell without worries",
    "hero.subtitle": "We guide you through all steps of a funeral in the Netherlands",
    "hero.cta": "Get started",
    "guidance.title": "Personal Guidance",
    "guidance.subtitle": "We are here to help you",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.close": "Close",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.how_it_works": "كيف يعمل",
    "nav.pricing": "الأسعار",
    "nav.providers": "للمقدمين",
    "nav.contact": "اتصل بنا",
    "nav.start": "ابدأ هنا",
    "hero.title": "وداع كريم بدون قلق",
    "hero.subtitle": "نحن نرشدك خلال جميع خطوات الجنازة في هولندا",
    "hero.cta": "ابدأ هنا",
    "guidance.title": "التوجيه الشخصي",
    "guidance.subtitle": "نحن هنا لمساعدتك",
    "common.loading": "جاري التحميل...",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.next": "التالي",
    "common.previous": "السابق",
    "common.close": "إغلاق",
  },
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.how_it_works": "Nasıl çalışır",
    "nav.pricing": "Fiyatlar",
    "nav.providers": "Sağlayıcılar için",
    "nav.contact": "İletişim",
    "nav.start": "Başlayın",
    "hero.title": "Endişesiz onurlu veda",
    "hero.subtitle": "Hollanda'da cenaze sürecinin tüm adımlarında size rehberlik ediyoruz",
    "hero.cta": "Başlayın",
    "guidance.title": "Kişisel Rehberlik",
    "guidance.subtitle": "Size yardım etmek için buradayız",
    "common.loading": "Yükleniyor...",
    "common.save": "Kaydet",
    "common.cancel": "İptal",
    "common.next": "İleri",
    "common.previous": "Geri",
    "common.close": "Kapat",
  },
  pl: {
    "nav.home": "Strona główna",
    "nav.how_it_works": "Jak to działa",
    "nav.pricing": "Cennik",
    "nav.providers": "Dla dostawców",
    "nav.contact": "Kontakt",
    "nav.start": "Zacznij tutaj",
    "hero.title": "Godne pożegnanie bez zmartwień",
    "hero.subtitle": "Prowadzimy Cię przez wszystkie etapy pogrzebu w Holandii",
    "hero.cta": "Zacznij tutaj",
    "guidance.title": "Osobiste Wsparcie",
    "guidance.subtitle": "Jesteśmy tutaj, aby Ci pomóc",
    "common.loading": "Ładowanie...",
    "common.save": "Zapisz",
    "common.cancel": "Anuluj",
    "common.next": "Dalej",
    "common.previous": "Wstecz",
    "common.close": "Zamknij",
  },
  de: {
    "nav.home": "Startseite",
    "nav.how_it_works": "Wie es funktioniert",
    "nav.pricing": "Preise",
    "nav.providers": "Für Anbieter",
    "nav.contact": "Kontakt",
    "nav.start": "Hier beginnen",
    "hero.title": "Würdiger Abschied ohne Sorgen",
    "hero.subtitle": "Wir begleiten Sie durch alle Schritte einer Beerdigung in den Niederlanden",
    "hero.cta": "Hier beginnen",
    "guidance.title": "Persönliche Begleitung",
    "guidance.subtitle": "Wir sind da, um Ihnen zu helfen",
    "common.loading": "Laden...",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.next": "Weiter",
    "common.previous": "Zurück",
    "common.close": "Schließen",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("nl")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  const isRTL = language === "ar"

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
  }, [language, isRTL])

  return <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
