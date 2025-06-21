/*
 * VOOR FAMILIES PAGINA - DYNAMISCH DOCUMENT
 *
 * ⚠️  FOCUS OP KLANTDOELEN, NIET OP FEATURES
 *
 * PRIMAIRE DOELEN VAN FAMILIES:
 * 1. Waardig afscheid organiseren zonder fouten
 * 2. Tijd en ruimte hebben om te rouwen
 * 3. Familie betrokken houden in het proces
 * 4. Niet overweldigd raken door administratie
 * 5. Zekerheid dat alles goed geregeld is
 *
 * EMOTIONELE CONTEXT:
 * - Families zijn in rouw, vaak voor het eerst
 * - Angst om fouten te maken
 * - Overweldigd door alle keuzes en taken
 * - Willen hun dierbare eren op de juiste manier
 *
 * 📋 REVIEW: Maandelijks valideren met echte families
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Heart, Shield, Users, Clock, CheckCircle, ArrowRight } from "lucide-react"

export default function ForFamiliesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Heart className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Focus op <span className="text-blue-600">afscheid nemen</span>,<br />
            wij regelen de rest
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Een uitvaart organiseren is overweldigend, vooral als je rouwt. Farewelly zorgt ervoor dat je de ruimte hebt
            om afscheid te nemen, terwijl wij ervoor zorgen dat alles perfect geregeld wordt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signin">Begin met ondersteuning</Link>
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
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Wat wil je bereiken?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We begrijpen dat elke familie uniek is, maar deze doelen horen we het vaakst:
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Een waardig afscheid zonder fouten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt je dierbare eren op de manier die hij of zij verdiende. Geen vergeten details, geen gemiste
                  afspraken, geen spijt achteraf.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil zeker weten dat alles perfect is, zodat ik later geen spijt heb van wat ik wel of niet heb
                  gedaan."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Clock className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Tijd om te rouwen en te verwerken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Rouw heeft tijd nodig. Je wilt niet alle energie kwijt zijn aan administratie en planning, maar ruimte
                  hebben voor je emoties.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil kunnen huilen wanneer ik moet huilen, niet bezig zijn met formulieren en telefoontjes."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Familie betrokken houden</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Iedereen wil meehelpen, maar het is moeilijk om iedereen op de hoogte te houden. Je wilt dat familie
                  zich betrokken voelt, niet buitengesloten.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil niet constant dezelfde vragen beantwoorden of mensen het gevoel geven dat ze niet welkom
                  zijn."
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Zekerheid dat alles geregeld is</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Je wilt 's nachts kunnen slapen, wetende dat alle belangrijke zaken onder controle zijn. Geen stress
                  over vergeten details.
                </p>
                <p className="text-sm text-slate-500">
                  "Ik wil niet wakker liggen met de vraag of ik iets belangrijks ben vergeten."
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
                  <Shield className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Zodat je een waardig afscheid organiseert zonder fouten
                </h3>
                <p className="text-slate-600 mb-4">
                  Onze begeleiding zorgt ervoor dat je alle belangrijke stappen doorloopt. Van het eerste gesprek tot de
                  laatste details - niets wordt vergeten.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Je krijgt een persoonlijke checklist die automatisch wordt
                    bijgewerkt. Elke stap wordt uitgelegd, zodat je begrijpt waarom het belangrijk is.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 2 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Zodat je tijd hebt om te rouwen en te verwerken
                </h3>
                <p className="text-slate-600 mb-4">
                  Wij nemen de administratieve last van je over. Jouw uitvaartondernemer en wij zorgen voor de
                  praktische zaken, zodat jij emotionele ruimte hebt.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Documenten worden automatisch gedeeld met de juiste mensen. Afspraken
                    worden voor je ingepland. Je hoeft alleen te bevestigen, niet te organiseren.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 3 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Zodat je familie betrokken houdt zonder stress
                </h3>
                <p className="text-slate-600 mb-4">
                  Familie krijgt automatisch updates over belangrijke ontwikkelingen. Iedereen blijft op de hoogte
                  zonder dat jij constant moet communiceren.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Wanneer de datum van de uitvaart vaststaat, krijgt iedereen
                    automatisch een bericht. Familie kan vragen stellen zonder jou te belasten.
                  </p>
                </div>
              </div>
            </div>

            {/* Goal 4 */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Zodat je zeker weet dat alles geregeld is</h3>
                <p className="text-slate-600 mb-4">
                  Je krijgt een duidelijk overzicht van alle afspraken, documenten en taken. Alles is transparant en
                  up-to-date.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                  <p className="text-sm text-slate-600">
                    <strong>Bijvoorbeeld:</strong> Je dashboard toont precies wat er nog moet gebeuren en wat al
                    geregeld is. Je ziet in één oogopslag dat alles onder controle is.
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
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Wat betekent dit voor jou?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Meer tijd voor wat belangrijk is</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Tijd om herinneringen te delen, om te huilen, om afscheid te nemen. Niet om formulieren in te vullen.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Rust en zekerheid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Je kunt slapen, wetende dat alles onder controle is. Geen stress over vergeten details.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Familie die zich betrokken voelt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Iedereen weet wat er gebeurt en kan helpen waar nodig. Samen door deze moeilijke tijd.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Je hoeft dit niet alleen te doen</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Duizenden families gingen je voor. Laat ons je helpen een waardig afscheid te organiseren, zodat jij de
            ruimte hebt om te rouwen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/signin">
                Begin met gratis ondersteuning
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
