import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Smartphone, CreditCard, BarChart3, Clock, Shield } from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Eenvoudige agenda-sync",
    description: "Koppel uw Google/Outlook agenda of gebruik onze WhatsApp bot. Beschikbaarheid altijd up-to-date.",
    color: "text-blue-600",
  },
  {
    icon: Smartphone,
    title: "Mobiele app",
    description:
      "Beheer boekingen onderweg. Accepteer of weiger aanvragen met één tik. Push notificaties voor nieuwe boekingen.",
    color: "text-green-600",
  },
  {
    icon: CreditCard,
    title: "Gegarandeerde betaling",
    description: "Betaling binnen 24 uur na evenement. Geen wanbetaling, geen gedoe met incasso.",
    color: "text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Inzicht in prestaties",
    description: "Dashboard met bezettingsgraad, inkomsten en trends. Zie welke dagen het best renderen.",
    color: "text-orange-600",
  },
  {
    icon: Clock,
    title: "Flexibele tijdslots",
    description: "Stel zelf uw beschikbare tijden in. Ochtend, middag, avond - u bepaalt wanneer u open bent.",
    color: "text-teal-600",
  },
  {
    icon: Shield,
    title: "Verzekering & support",
    description: "Alle evenementen zijn verzekerd. 24/7 support voor acute vragen of problemen.",
    color: "text-red-600",
  },
]

export function VenueFeatures() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
            Waarom locatie-eigenaren kiezen voor ons platform
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Meer inkomsten uit uw bestaande ruimte, zonder extra werk
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-slate-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
