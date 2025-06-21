/**
 * REALISTIC FEATURES SECTION - NO FALSE PROMISES
 *
 * Purpose: Honest benefits without exaggerated claims
 * Features: Practical advantages, transparent commission model
 * UX: Trustworthy, realistic expectations
 *
 * TECHNICAL IMPLEMENTATION NOTES:
 * - Referral codes are unique per funeral director
 * - Family intake automatically links to director via code
 * - Report generation triggers automatic email to linked director
 * - Commission tracking happens on successful completion
 * - Referral bonuses paid monthly via bank transfer
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Euro, Clock, Users, Shield, Heart, Zap, CheckCircle, Smartphone, Link2, Gift, TrendingUp } from "lucide-react"
import type { UserType } from "@/app/page"
import type { LucideIcon } from "lucide-react"

interface BenefitItem {
  icon: LucideIcon
  title: string
  description: string
  color: string
}

const familyBenefits: BenefitItem[] = [
  {
    icon: Heart,
    title: "Minder stress tijdens moeilijke tijd",
    description: "AI-assistent neemt administratieve taken over, zodat u zich kunt focussen op het afscheid.",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Clock,
    title: "Alles op één plek georganiseerd",
    description: "Documenten, planning en communicatie overzichtelijk verzameld in één digitale omgeving.",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Link2,
    title: "Automatische koppeling met ondernemer",
    description: "Uw rapport gaat direct naar de juiste uitvaartondernemer - geen handmatige overdracht nodig.",
    color: "text-green-600 dark:text-green-400",
  },
  {
    icon: Shield,
    title: "Juridisch correcte documenten",
    description: "Automatische controles zorgen dat alle benodigde documenten compleet en correct zijn.",
    color: "text-slate-600 dark:text-slate-400",
  },
  {
    icon: Smartphone,
    title: "Altijd toegankelijk op uw telefoon",
    description: "Alle informatie en voortgang bekijken wanneer het u uitkomt, waar u ook bent.",
    color: "text-teal-600 dark:text-teal-400",
  },
  {
    icon: CheckCircle,
    title: "Stap-voor-stap begeleiding",
    description: "Duidelijke checklists en herinneringen helpen u alle belangrijke stappen te zetten.",
    color: "text-orange-600 dark:text-orange-400",
  },
]

const providerBenefits: BenefitItem[] = [
  {
    icon: Euro,
    title: "Alleen betalen bij succes",
    description: "Geen vaste kosten. U betaalt alleen commissie wanneer u daadwerkelijk een klant krijgt.",
    color: "text-green-600 dark:text-green-400",
  },
  {
    icon: Gift,
    title: "€100 per doorverwijzing",
    description: "Extra inkomsten voor elke familie die u naar het platform doorverwijst en een rapport aanmaakt.",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Users,
    title: "Bereik meer families digitaal",
    description: "Families vinden u online en kunnen direct contact maken via het platform.",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Zap,
    title: "Minder administratieve rompslomp",
    description: "Families leveren voorgeorganiseerde rapporten aan, wat u tijd bespaart bij de intake.",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    icon: Link2,
    title: "Automatische rapportontvangst",
    description: "Wanneer een familie uw code gebruikt, krijgt u automatisch hun complete rapport toegestuurd.",
    color: "text-red-600 dark:text-red-400",
  },
  {
    icon: TrendingUp,
    title: "Moderne uitstraling",
    description: "Toon dat u met de tijd meegaat door moderne digitale tools aan te bieden.",
    color: "text-indigo-600 dark:text-indigo-400",
  },
]

interface FeaturesProps {
  userType: UserType
}

export function Features({ userType }: FeaturesProps) {
  const benefits = userType === "family" ? familyBenefits : providerBenefits
  const title = userType === "family" ? "Wat biedt het platform u?" : "Praktische voordelen voor uw bedrijf"
  const description =
    userType === "family"
      ? "Ontdek hoe ons platform u praktisch helpt tijdens een moeilijke periode."
      : "Zie hoe het platform uw dagelijkse werk kan verbeteren en uw bereik kan vergroten."

  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-700/50 transition-all duration-300 bg-slate-50 dark:bg-slate-850 group hover:border-slate-300 dark:hover:border-slate-600"
            >
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:shadow-md transition-shadow duration-300`}
                  >
                    <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                  </div>
                </div>
                <CardTitle className="text-slate-900 dark:text-white text-lg leading-tight">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Commission structure explanation for providers */}
        {userType === "provider" && (
          <div className="mt-16 text-center">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Hoe werkt de commissie?</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Standaard commissie</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                    15% van de totale uitvaartkosten wanneer u een klant krijgt via het platform.
                  </p>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">15%</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Met doorverwijzing</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                    10% commissie + €100 bonus wanneer u families doorverwijst naar het platform.
                  </p>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">10% + €100</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
