import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Calendar, CreditCard, BarChart3, MessageSquare, Shield } from "lucide-react"

const features = [
  {
    icon: Target,
    title: "Gekwalificeerde leads",
    description: "Families die al weten wat ze willen en budget hebben. 80% conversie vs 20% bij koude leads.",
    color: "text-green-600",
  },
  {
    icon: Calendar,
    title: "Slimme planning",
    description: "Automatische agenda-sync, reistijd berekening en conflictdetectie. Nooit meer dubbele boekingen.",
    color: "text-blue-600",
  },
  {
    icon: CreditCard,
    title: "Gegarandeerde betaling",
    description:
      "Betaling binnen 7 dagen gegarandeerd. Geen incasso meer, geen wanbetaling. €1.350 cashflow besparing per uitvaart.",
    color: "text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Inzicht in prestaties",
    description: "Real-time dashboard met conversies, tevredenheid en omzet. Zie precies hoe uw bedrijf groeit.",
    color: "text-orange-600",
  },
  {
    icon: MessageSquare,
    title: "Geautomatiseerde communicatie",
    description: "Herinneringen, updates en follow-ups automatisch. Focus op families, niet op administratie.",
    color: "text-teal-600",
  },
  {
    icon: Shield,
    title: "Compliance & backup",
    description: "Altijd compliant met Nederlandse wetgeving. Backup bij ziekte of vakantie door netwerk.",
    color: "text-red-600",
  },
]

export function ProviderFeatures() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
            Waarom uitvaartondernemers kiezen voor ons platform
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Meer tijd voor families, minder tijd voor administratie
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
