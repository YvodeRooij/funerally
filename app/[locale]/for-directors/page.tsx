/*
 * VOOR UITVAARTONDERNEMERS PAGINA - DYNAMISCH DOCUMENT
 *
 * ⚠️  FOCUS OP ONDERNEMERSDOELEN, NIET OP FEATURES
 *
 * PRIMAIRE DOELEN VAN UITVAARTONDERNEMERS:
 * 1. Uitzonderlijke service leveren aan families
 * 2. Meer families helpen zonder meer uren te maken
 * 3. Reputatie en vertrouwen opbouwen
 * 4. Bedrijf laten groeien zonder overbelasting
 * 5. Administratieve last verminderen
 *
 * BUSINESS CONTEXT:
 * - Vaak kleine ondernemingen met beperkte resources
 * - Hoge emotionele belasting van het werk
 * - Concurrentie op service en vertrouwen
 * - Groei beperkt door tijd en capaciteit
 *
 * 📋 REVIEW: Maandelijks valideren met echte ondernemers
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building, Heart, TrendingUp, Clock, ArrowRight, Star, Target, Zap } from "lucide-react"

export default function ForDirectorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Building className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Help <span className="text-blue-600">meer families</span>
            <br />
            zonder meer stress
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Als uitvaartondernemer wil je families de beste service geven. Farewelly helpt je meer impact te maken per
            cliënt, zodat je kunt groeien zonder jezelf uit te putten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signin">Probeer gratis</Link>
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
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Wat wil je bereiken als ondernemer?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We spraken met honderden uitvaartondernemers. Dit zijn de doelen die we het vaakst horen:
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Heart className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Uitzonderlijke service leveren</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt families door hun moeilijkste tijd begeleiden met de zorg en aandacht die ze verdienen. Elke
                  familie moet zich gehoord en gesteund voelen.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil dat families zich volledig ondersteund voelen, zodat ze kunnen focussen op afscheid nemen."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Groeien zonder overbelasting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt meer families helpen en je bedrijf laten groeien, maar wel op een duurzame manier die je
                  energie geeft in plaats van wegneemt.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil meer cliënten aannemen op een manier die duurzaam is en mij energie geeft."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Star className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Reputatie en vertrouwen opbouwen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt bekend staan als de uitvaartondernemer die families kunnen vertrouwen. Mond-tot-mond reclame
                  is je beste marketing.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil dat families mij aanbevelen aan anderen omdat ze zo tevreden waren met mijn service."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Clock className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Meer tijd voor wat belangrijk is</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt minder tijd kwijt zijn aan administratie en meer tijd hebben voor persoonlijke begeleiding van
                  families en het uitbouwen van je bedrijf.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil mijn tijd besteden aan families begeleiden, niet aan paperwork en planning."
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
                  <Heart className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Zodat je uitzonderlijke service kunt leveren
                </h3>
                <p className="text-slate-600 mb-4">
                  Families krijgen 24/7 ondersteuning via onze AI-assistent, maar jij blijft de persoonlijke begeleider.
                  Je kunt meer aandacht geven waar het echt nodig is.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Terwijl jij slaapt, helpt onze assistent families met hun vragen. 's
                    Ochtends zie je precies waar ze mee bezig zijn en waar jouw persoonlijke aandacht nodig is.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 2 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Zodat je duurzaam kunt groeien</h3>
                <p className="text-slate-600 mb-4">
                  Slimme automatisering betekent dat je meer families kunt helpen terwijl je meer tijd overhoudt voor
                  wat je energie geeft.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Documenten worden automatisch gedeeld, afspraken ingepland, en
                    families op de hoogte gehouden. Jij focust op de gesprekken die ertoe doen.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 3 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Zodat je reputatie en vertrouwen opbouwt</h3>
                <p className="text-slate-600 mb-4">
                  Families ervaren jouw service als professioneel en betrouwbaar omdat alles perfect georganiseerd is.
                  Ze voelen zich gehoord en ondersteund.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Families krijgen proactieve updates, kunnen altijd hun vragen
                    stellen, en zien dat jij alles onder controle hebt. Dit leidt tot meer aanbevelingen.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 4 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Zodat je meer tijd hebt voor wat belangrijk is
                </h3>
                <p className="text-slate-600 mb-4">
                  Minder tijd aan administratie betekent meer tijd voor persoonlijke gesprekken, bedrijfsontwikkeling en
                  je eigen welzijn.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> In plaats van 2 uur per dag aan administratie, besteed je 30 minuten
                    aan het controleren van updates. De rest van je tijd is voor families en groei.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What This Means */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Wat betekent dit voor jouw bedrijf?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Meer tevreden families</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Families voelen zich beter ondersteund en begeleidt, wat leidt tot meer positieve reviews en
                  aanbevelingen.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Efficiëntere processen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Meer cliënten helpen in dezelfde tijd, zonder concessies te doen aan de kwaliteit van je service.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Duurzame groei</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Je bedrijf kan groeien zonder dat jij meer uren hoeft te maken of je welzijn op het spel zet.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Klaar om je bedrijf naar het volgende niveau te tillen?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Honderden uitvaartondernemers gebruiken Farewelly al om meer families te helpen zonder meer stress. Ontdek
            wat het voor jou kan betekenen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/signin">
                Start gratis proefperiode
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link href="/contact">Stel een vraag</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
