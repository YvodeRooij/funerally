/*
 * VOOR LOCATIES PAGINA - DYNAMISCH DOCUMENT
 *
 * ⚠️  FOCUS OP LOCATIE-EIGENAAR DOELEN, NIET OP FEATURES
 *
 * PRIMAIRE DOELEN VAN LOCATIE-EIGENAREN:
 * 1. Maximale bezettingsgraad en omzet
 * 2. Langdurige relaties met uitvaartondernemers
 * 3. Minder administratieve rompslomp
 * 4. Professionele uitstraling en service
 * 5. Voorspelbare inkomstenstroom
 *
 * BUSINESS CONTEXT:
 * - Vaak bijverdienste of familiebedrijf
 * - Afhankelijk van goede relaties met ondernemers
 * - Concurrentie op prijs en service
 * - Seizoensgebonden vraag
 *
 * 📋 REVIEW: Maandelijks valideren met echte locatie-eigenaren
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MapPin, TrendingUp, Clock, Shield, Handshake } from "lucide-react"

export default function ForVenuesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <MapPin className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            <span className="text-blue-600">Maximale bezetting</span>
            <br />
            met tevreden klanten
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Als locatie-eigenaar wil je je ruimte optimaal benutten met uitvaartondernemers die steeds terugkomen.
            Farewelly helpt je meer boekingen te krijgen met minder gedoe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signin">Verhoog je bezetting</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/contact">Stel een vraag</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Goals */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Wat wil je bereiken met je locatie?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We spraken met tientallen locatie-eigenaren. Dit zijn de doelen die we het vaakst horen:
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Maximale bezetting en omzet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt je locatie zo vaak mogelijk verhuurd hebben tegen een goede prijs. Lege dagen betekenen
                  gemiste inkomsten.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil dat mijn locatie zo veel mogelijk wordt gebruikt, zodat ik een stabiel inkomen heb."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Handshake className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Langdurige klantrelaties</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt uitvaartondernemers die steeds terugkomen omdat ze tevreden zijn met je service. Vaste klanten
                  betekenen voorspelbare inkomsten.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil dat ondernemers mij als hun vaste partner zien, niet als een eenmalige optie."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Clock className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Minder administratie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt niet de hele dag bezig zijn met telefoontjes, emails en planning. Liever automatisch boekingen
                  ontvangen en bevestigen.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil dat boekingen gewoon binnenkomen zonder dat ik er veel tijd aan kwijt ben."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Professionele uitstraling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt dat ondernemers je zien als een betrouwbare, professionele partner. Geen gemiste afspraken of
                  onduidelijkheden.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil dat ondernemers weten dat ze op mij kunnen rekenen voor een perfecte service."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Hoe helpen wij je deze doelen te bereiken?
          </h2>

          <div className="space-y-12">
            {/* Goal 1 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Zodat je maximale bezetting en omzet behaalt
                </h3>
                <p className="text-slate-600 mb-4">
                  Meer uitvaartondernemers vinden jouw locatie via ons platform. Je beschikbaarheid is altijd
                  up-to-date, dus je mist geen enkele boeking.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Een ondernemer zoekt een locatie voor volgende week. Hij ziet direct
                    dat jij beschikbaar bent en boekt meteen. Geen gemiste kansen.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 2 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <Handshake className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Zodat je langdurige klantrelaties opbouwt</h3>
                <p className="text-slate-600 mb-4">
                  Door de beoordelingen en het berichtencentrum in Farewelly bouw je vertrouwen op met ondernemers.
                  Ze komen steeds terug omdat ze weten dat het goed geregeld is.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
