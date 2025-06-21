import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Clock, Euro } from "lucide-react"
import Link from "next/link"

export function ProviderHero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6">
            Meer gekwalificeerde families,
            <br />
            <span className="text-blue-700">minder administratie</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Sluit u aan bij het platform dat uitvaartondernemers helpt groeien. Alleen commissie bij succes - geen
            maandelijkse kosten.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-4">
              <Link href="/providers/signup">Gratis aanmelden</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
              <Link href="/providers/demo">Demo aanvragen</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="border-green-100 bg-green-50/50">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">80%</div>
                <p className="text-slate-600 text-sm">Conversie rate</p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">€15k</div>
                <p className="text-slate-600 text-sm">Extra omzet/maand</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-purple-50/50">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">10u</div>
                <p className="text-slate-600 text-sm">Besparing per week</p>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-orange-50/50">
              <CardContent className="p-6 text-center">
                <Euro className="h-8 w-8 text-orange-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-slate-900 mb-1">€1.350</div>
                <p className="text-slate-600 text-sm">Cashflow besparing</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">Eerste 2 klanten gratis</h3>
          <p className="text-blue-800 text-sm">
            Test het platform zonder risico. Geen setup kosten, geen maandelijkse kosten. Alleen commissie bij
            succesvolle boekingen.
          </p>
        </div>
      </div>
    </section>
  )
}
