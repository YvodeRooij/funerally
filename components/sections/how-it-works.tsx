/**
 * HOW IT WORKS SECTION COMPONENT - DYNAMIC
 *
 * Purpose: Explains the process for Families or Providers.
 * Features: Step-by-step guide tailored to the user type.
 * User Journey: Clarifies the platform's workflow and value.
 */
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import type { UserType } from "@/app/page"

interface Step {
  number: string
  title: string
  description: string
  features: string[]
}

const familySteps: Step[] = [
  {
    number: "1",
    title: "Gratis verkenning",
    description: "Beantwoord vragen over uw wensen en situatie. Alles wordt opgeslagen - u kunt altijd pauzeren.",
    features: ["Geen kosten tot rapport klaar", "Alle opties verkennen", "Kostenramingen krijgen"],
  },
  {
    number: "2",
    title: "Persoonlijk rapport",
    description: "Ontvang een compleet overzicht van opties, kosten en aanbevolen uitvaartondernemers.",
    features: ["Transparante prijzen", "Meerdere opties", "Besparingsmogelijkheden"],
  },
  {
    number: "3",
    title: "Eenvoudig boeken",
    description: "€100 platformkosten (€50 bij gemeentelijke uitvaart) voor volledige begeleiding en coördinatie.",
    features: ["Directe communicatie", "Alles gecoördineerd", "Geen verrassingen"],
  },
]

const providerSteps: Step[] = [
  {
    number: "1",
    title: "Registreren & Profileren",
    description: "Meld uw onderneming aan en creëer een gedetailleerd profiel dat uw diensten en waarden toont.",
    features: ["Snelle onboarding", "Uitgebreide dienstenlijst", "Toon uw unieke expertise"],
  },
  {
    number: "2",
    title: "Beheer & Ontvang Boekingen",
    description: "Stel uw beschikbaarheid in, ontvang boekingsverzoeken en beheer uw planning naadloos.",
    features: ["Realtime updates", "Geautomatiseerde meldingen", "Eenvoudige coördinatie"],
  },
  {
    number: "3",
    title: "Samenwerken & Excelleren",
    description: "Gebruik onze tools voor communicatie, documentbeheer en het leveren van uitmuntende service.",
    features: ["Veilige berichtgeving", "Documenten delen", "Gestroomlijnde workflows"],
  },
]

interface HowItWorksProps {
  userType: UserType
}

export function HowItWorks({ userType }: HowItWorksProps) {
  const steps = userType === "family" ? familySteps : providerSteps
  const title = "Zo werkt het" // Title can be generic or adapted
  const description =
    userType === "family"
      ? "Drie eenvoudige stappen naar een waardig afscheid zonder stress"
      : "Drie stappen om uw onderneming te laten groeien en families te ondersteunen"
  const ctaText = userType === "family" ? "Begin nu - volledig gratis" : "Registreer uw onderneming"
  const ctaLink = userType === "family" ? "/start" : "/providers/onboarding"
  const ctaSubtext = userType === "family" ? "Geen kosten tot u besluit om te boeken" : "Word onderdeel van ons netwerk"
  const primaryColor = userType === "family" ? "purple" : "teal"
  const primaryBgClass = userType === "family" ? "bg-purple-700 hover:bg-purple-800" : "bg-teal-600 hover:bg-teal-700"

  return (
    <section className="py-20 px-4 bg-slate-50 dark:bg-slate-850">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div
                      className={`w-12 h-12 ${userType === "family" ? "bg-purple-700" : "bg-teal-600"} text-white rounded-full flex items-center justify-center font-bold text-lg mr-4`}
                    >
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 mb-6">{step.description}</p>

                  <ul className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle
                          className={`h-4 w-4 ${userType === "family" ? "text-green-600" : "text-lime-600"} mr-2 flex-shrink-0`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className={`${primaryBgClass} text-lg px-8 py-4 text-white`}>
            <Link href={ctaLink}>{ctaText}</Link>
          </Button>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{ctaSubtext}</p>
        </div>
      </div>
    </section>
  )
}
