import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Calculator } from "lucide-react"
import Link from "next/link"

export function VenuePricing() {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Simpele commissiestructuur</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Alleen betalen bij succesvolle boekingen. Geen verborgen kosten.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-slate-900">Standaard commissie</CardTitle>
              <div className="text-4xl font-bold text-slate-900 mt-4">15%</div>
              <p className="text-slate-600">Van de huurprijs per boeking</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Betaling binnen 24 uur</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Geen maandelijkse kosten</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Volledige platform toegang</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Marketing & promotie</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">24/7 support</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/venues/signup">Aanmelden</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-slate-900">Inkomsten calculator</CardTitle>
              <div className="text-4xl font-bold text-slate-900 mt-4">€1.200</div>
              <p className="text-slate-600">Gemiddeld extra per maand</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lege dinsdagmiddag</span>
                  <span className="font-semibold">€150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Zaterdagochtend</span>
                  <span className="font-semibold">€300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Zondagavond</span>
                  <span className="font-semibold">€200</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Per week</span>
                    <span>€650</span>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/venues/calculator">
                  <Calculator className="h-4 w-4 mr-2" />
                  Bereken uw inkomsten
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-slate-600 mb-4">
            <strong>Rekenvoorbeeld:</strong> Verhuur van €400 per dag = €60 commissie (15%)
          </p>
          <p className="text-sm text-slate-500">Gemiddelde locatie verdient €1.200 extra per maand</p>
        </div>
      </div>
    </section>
  )
}
