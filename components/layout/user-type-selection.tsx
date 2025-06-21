"use client"

/**
 * REFINED USER TYPE SELECTION COMPONENT
 *
 * Purpose: Elegant first impression with subtle user role selection
 * Features: Refined colors, gentle animations, harmonious design
 * UX: Calming, professional, accessible
 */
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Home, ArrowRight, Heart, Building2 } from "lucide-react"
import type { UserType } from "@/app/page"
import { cn } from "@/lib/utils"

interface UserTypeSelectionProps {
  onSelect: (userType: UserType) => void
}

export function UserTypeSelection({ onSelect }: UserTypeSelectionProps) {
  const [hoveredCard, setHoveredCard] = useState<UserType | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSelect = (userType: UserType) => {
    setTimeout(() => onSelect(userType), 200)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Subtle floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-slate-200/20 dark:bg-slate-700/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute top-40 right-20 w-40 h-40 bg-slate-300/20 dark:bg-slate-600/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-20 left-1/4 w-24 h-24 bg-slate-200/20 dark:bg-slate-700/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Refined header */}
        <div className={cn("text-center mb-16 max-w-4xl mx-auto", isVisible ? "animate-fade-in" : "opacity-0")}>
          <div className="inline-flex items-center justify-center mb-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Welkom bij het platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Uw reis begint
            <span className="block text-slate-700 dark:text-slate-300">hier</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            Om u de meest relevante ervaring te bieden, laat ons weten wie u bent
          </p>
        </div>

        {/* Refined selection cards */}
        <div
          className={cn(
            "grid md:grid-cols-2 gap-8 max-w-4xl w-full",
            isVisible ? "animate-slide-up animate-stagger-2" : "opacity-0",
          )}
        >
          {/* Family Card */}
          <Card
            className={cn(
              "group relative overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover-lift cursor-pointer transition-all duration-300",
              hoveredCard === "family" ? "shadow-lg border-slate-300 dark:border-slate-600" : "shadow-sm",
            )}
            onMouseEnter={() => setHoveredCard("family")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleSelect("family")}
          >
            <CardContent className="relative p-8 md:p-12 text-center">
              {/* Refined icon */}
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  <Home className="h-10 w-10 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-600 dark:bg-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart className="h-3 w-3 text-white" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-display font-semibold text-slate-900 dark:text-white mb-4">
                Voor Families
              </h3>

              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
                Persoonlijke begeleiding en ondersteuning bij het regelen van een respectvol en waardig afscheid voor uw
                dierbare.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Gratis begeleiding tot rapport klaar",
                  "Transparante prijzen en opties",
                  "24/7 ondersteuning beschikbaar",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400"
                  >
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mr-3" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <span className="mr-2">Ik ben een Familielid</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </CardContent>
          </Card>

          {/* Provider Card */}
          <Card
            className={cn(
              "group relative overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover-lift cursor-pointer transition-all duration-300",
              hoveredCard === "provider" ? "shadow-lg border-slate-300 dark:border-slate-600" : "shadow-sm",
            )}
            onMouseEnter={() => setHoveredCard("provider")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleSelect("provider")}
          >
            <CardContent className="relative p-8 md:p-12 text-center">
              {/* Refined icon */}
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  <Users className="h-10 w-10 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-600 dark:bg-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Building2 className="h-3 w-3 text-white" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-display font-semibold text-slate-900 dark:text-white mb-4">
                Voor Uitvaartondernemers
              </h3>

              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
                Professionele tools en uitgebreid netwerk om uw dienstverlening te optimaliseren en meer families te
                bereiken.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Vergroot uw klantenbereik",
                  "Efficiënte planning en beheer",
                  "Professionele groei en ontwikkeling",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400"
                  >
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mr-3" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <span className="mr-2">Ik ben een Uitvaartondernemer</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Refined footer note */}
        <div className={cn("mt-12 text-center", isVisible ? "animate-fade-in animate-stagger-4" : "opacity-0")}>
          <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
            U kunt deze keuze later altijd aanpassen in uw instellingen
          </p>
        </div>
      </div>
    </div>
  )
}
