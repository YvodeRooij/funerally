import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import Link from "next/link"

export function ProviderPricing() {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
            Eenvoudige, eerlijke prijzen
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Alleen commissie bij succes. Geen verborgen kosten, geen maandelijkse abonnementen.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Trial */}
          <Card className="border-slate-200">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-slate-900">Proefperiode</CardTitle>
              <div className="text-4xl font-bold text-slate-900 mt-4">Gratis</div>
              <p className="text-slate-600">Eerste 2 klanten</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Volledige platform toegang</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Persoonlijke onboarding</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Email & telefoon support</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-400">Familie codes (5-10/maand)</span>
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/providers/signup">Start proefperiode</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Standard */}
          <Card className="border-blue-200 bg-blue-50/50 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">Meest gekozen</span>
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-slate-900">Standaard</CardTitle>
              <div className="text-4xl font-bold text-slate-900 mt-4">10%</div>
              <p className="text-slate-600">Commissie per uitvaart</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Alle platform functies</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Prioriteit support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Familie codes (5-10/maand)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Gegarandeerde betaling</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/providers/signup">Kies standaard</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className="border-slate-200">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-slate-900">Met familie codes</CardTitle>
              <div className="text-4xl font-bold text-slate-900 mt-4">15%</div>
              <p className="text-slate-600">Commissie per code-uitvaart</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Familie betaalt €0 platformkosten</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Directe koppeling aan u</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">Hogere klanttevredenheid</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-slate-600">U kiest per klant</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/providers/signup">Meer informatie</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">
            <strong>Rekenvoorbeeld:</strong> Uitvaart van €8.000 = €800 commissie (10%) of €1.200 (15% met code)
          </p>
          <p className="text-sm text-slate-500">Cashflow besparing van €1.350 per uitvaart dekt commissie ruim</p>
        </div>
      </div>
    </section>
  )
}
