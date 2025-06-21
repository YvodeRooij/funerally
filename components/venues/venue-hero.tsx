import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Euro, TrendingUp } from "lucide-react"
import Link from "next/link"

export function VenueHero() {
  return (
    <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6">
            Verhoog uw bezetting,
            <br />
            <span className="text-green-700">verdien bij lege momenten</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Sluit uw locatie aan bij het grootste uitvaartplatform van Nederland. Van kerken tot zalencentra - verdien
            €500-1.500 extra per lege dag.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-green-700 hover:bg-green-800 text-lg px-8 py-4">
              <Link href="/venues/signup">Gratis aanmelden</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
              <Link href="/venues/calculator">Inkomsten berekenen</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="border-green-100 bg-green-50/50">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">60%</div>
                <p className="text-slate-600 text-sm">Meer bezetting</p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">2-7</div>
                <p className="text-slate-600 text-sm">Dagen vooruit boeken</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-purple-50/50">
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">500+</div>
                <p className="text-slate-600 text-sm">Locaties aangesloten</p>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-orange-50/50">
              <CardContent className="p-6 text-center">
                <Euro className="h-8 w-8 text-orange-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">€1.200</div>
                <p className="text-slate-600 text-sm">Gemiddeld per maand</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="font-semibold text-green-900 mb-3">Eerste boeking gratis</h3>
          <p className="text-green-800 text-sm">
            Test het platform zonder risico. Geen setup kosten, geen maandelijkse kosten. Alleen 15% commissie bij
            succesvolle boekingen.
          </p>
        </div>
      </div>
    </section>
  )
}
