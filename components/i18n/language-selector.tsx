/**
 * LANGUAGE SELECTOR - User interface for switching languages
 *
 * Purpose: Allows users to switch between supported languages
 * Features: Flag icons, native language names, cultural sensitivity
 * UX: Reduces stress by allowing native language use during grief
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "./language-provider"
import { Globe, X } from "lucide-react"
import { useState } from "react"

const languages = [
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
]

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Globe className="h-4 w-4 mr-2" />
        {currentLanguage?.flag} {currentLanguage?.name}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <Card className="w-48 shadow-xl">
            <CardContent className="p-2">
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium">Taal / Language</span>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setLanguage(lang.code as any)
                      setIsOpen(false)
                    }}
                    className="w-full justify-start"
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
