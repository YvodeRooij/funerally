"use client"

/**
 * REALISTIC VALUE PROPOSITION - NO FALSE PROMISES
 *
 * Purpose: Honest messaging with realistic benefits and clear user journey
 * Features: Code-based linking system, commission structure, referral rewards
 * UX: Transparent, trustworthy, actionable
 *
 * USER JOURNEY FLOW:
 * 1. Funeral director signs up → Gets unique referral code
 * 2. Director shares code with family → Family enters code during onboarding
 * 3. Family completes intake → Report automatically sent to linked director
 * 4. Director reviews report → Can accept/modify and proceed
 * 5. Commission charged: 15% standard, 10% with referral, €100 referral bonus
 */
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Clock, Users, Euro, ArrowRight, Star, Gift, Share2, Link2 } from "lucide-react"
import Link from "next/link"
import type { UserType } from "@/app/page"
import { cn } from "@/lib/utils"

interface HeroProps {
  userType: UserType
}

const familyContent = {
  badge: "Voor families in Nederland",
  title: ["Digitale hulp bij", "uw uitvaart"],
  highlight: "gratis met toegangscode",
  description:
    "Heeft u een toegangscode van uw uitvaartondernemer ontvangen? Dan helpt onze AI-assistent u gratis met alle administratie en planning.",
  cta1: { text: "Toegangscode invoeren", link: "/start?referral=true" },
  cta2: { text: "Zonder code beginnen", link: "/start" },
  stats: [
    { number: "100%", label: "Gratis met code" },
    { number: "24/7", label: "AI-ondersteuning" },
    { number: "Auto", label: "Rapport naar ondernemer" },
  ],
  features: [
    {
      icon: Gift,
      title: "Gratis met toegangscode",
      description: "Uw uitvaartondernemer maakt het mogelijk - u gebruikt gratis",
      color: "slate",
    },
    {
      icon: Heart,
      title: "AI-assistent begeleidt u",
      description: "24/7 beschikbare digitale hulp bij alle stappen",
      color: "slate",
    },
    {
      icon: Link2,
      title: "Automatisch gekoppeld",
      description: "Uw rapport gaat direct naar de juiste ondernemer",
      color: "slate",
    },
  ],
  referralCTA: {
    title: "Geen toegangscode?",
    description: "Vraag uw uitvaartondernemer om dit platform te gebruiken",
    buttonText: "Platform doorsturen",
  },
}

const providerContent = {
  badge: "Voor uitvaartondernemers",
  title: ["Meer klanten,", "slimmer werken"],
  highlight: "eerste klant gratis",
  description:
    "Start vandaag nog. Uw eerste klant is volledig gratis. Daarna betaalt u alleen commissie bij succesvolle bemiddeling.",
  cta1: { text: "Direct beginnen", link: "/providers/signup" },
  cta2: { text: "Commissiestructuur bekijken", link: "/providers/pricing" },
  stats: [
    { number: "€0", label: "Eerste klant" },
    { number: "10-15%", label: "Commissie daarna" },
    { number: "€100", label: "Per doorverwijzing" },
  ],
  features: [
    {
      icon: Euro,
      title: "Alleen betalen bij succes",
      description: "15% commissie op totale kosten, 10% met doorverwijzing",
      color: "slate",
    },
    {
      icon: Users,
      title: "€100 per doorverwijzing",
      description: "Extra inkomsten voor elke familie die u doorverwijst",
      color: "slate",
    },
    {
      icon: Clock,
      title: "Direct aan de slag",
      description: "Geen proefperiode, geen opstartkosten - gewoon beginnen",
      color: "slate",
    },
  ],
}

export function Hero({ userType }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const content = userType === "family" ? familyContent : providerContent
  const isFamily = userType === "family"

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleReferralShare = () => {
    const shareText = `Bekijk dit moderne digitale platform voor uitvaartbegeleiding. Het kan uw dienstverlening verbeteren en u extra inkomsten opleveren.`
    const shareUrl = `${window.location.origin}/providers?ref=family-share`

    if (navigator.share) {
      navigator.share({
        title: "Digitaal Uitvaartplatform voor Professionals",
        text: shareText,
        url: shareUrl,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      // TODO: Show toast notification "Link gekopieerd!"
    }
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Subtle floating orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-slate-200/10 dark:bg-slate-700/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute top-40 right-20 w-40 h-40 bg-slate-300/10 dark:bg-slate-600/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-24 h-24 bg-slate-200/10 dark:bg-slate-700/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content Column */}
            <div className="space-y-8">
              {/* Badge */}
              <div
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                  isVisible ? "animate-fade-in" : "opacity-0",
                )}
              >
                {content.badge}
              </div>

              {/* Main Heading */}
              <div className={cn("space-y-4", isVisible ? "animate-slide-up animate-stagger-1" : "opacity-0")}>
                <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                  {content.title.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                  <span className="block text-slate-700 dark:text-slate-300">{content.highlight}</span>
                </h1>
              </div>

              {/* Description */}
              <p
                className={cn(
                  "text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed font-light max-w-2xl",
                  isVisible ? "animate-slide-up animate-stagger-2" : "opacity-0",
                )}
              >
                {content.description}
              </p>

              {/* Stats */}
              <div
                className={cn("flex flex-wrap gap-8", isVisible ? "animate-slide-up animate-stagger-3" : "opacity-0")}
              >
                {content.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.number}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div
                className={cn(
                  "flex flex-col sm:flex-row gap-4",
                  isVisible ? "animate-slide-up animate-stagger-4" : "opacity-0",
                )}
              >
                <Button
                  asChild
                  size="lg"
                  className="px-8 py-4 text-lg font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                >
                  <Link href={content.cta1.link} className="flex items-center">
                    {content.cta1.text}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-medium rounded-xl border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300"
                >
                  <Link href={content.cta2.link}>{content.cta2.text}</Link>
                </Button>
              </div>

              {/* Family Referral CTA */}
              {isFamily && (
                <div
                  className={cn(
                    "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6",
                    isVisible ? "animate-slide-up animate-stagger-5" : "opacity-0",
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        {familyContent.referralCTA.title}
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed mb-3">
                        {familyContent.referralCTA.description}
                      </p>
                      <Button
                        onClick={handleReferralShare}
                        size="sm"
                        variant="outline"
                        className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {familyContent.referralCTA.buttonText}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features Column */}
            <div className={cn("space-y-6", isVisible ? "animate-slide-up animate-stagger-5" : "opacity-0")}>
              {content.features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <Card
                    key={index}
                    className={cn(
                      "group border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover-lift cursor-pointer transition-all duration-300",
                      hoveredFeature === index ? "shadow-md border-slate-300 dark:border-slate-600" : "shadow-sm",
                    )}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300 bg-slate-100 dark:bg-slate-700">
                          <IconComponent className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                            {feature.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Trust indicator for families */}
              {isFamily && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Hoe werkt de koppeling?</h4>
                      <p className="text-green-800 dark:text-green-200 text-sm leading-relaxed">
                        Met een toegangscode wordt uw rapport automatisch naar de juiste uitvaartondernemer gestuurd. Zo
                        hoeft u zich geen zorgen te maken over de communicatie.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Commission structure for providers */}
              {!isFamily && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Euro className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        Transparante commissiestructuur
                      </h4>
                      <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                        15% commissie op totale kosten, of 10% als u families doorverwijst. Plus €100 bonus per
                        succesvolle doorverwijzing naar het platform.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
