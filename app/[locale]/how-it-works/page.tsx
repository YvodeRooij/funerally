/*
 * HOE HET WERKT PAGINA - DYNAMISCH DOCUMENT
 *
 * ⚠️  BELANGRIJK: Dit is een dynamisch document dat regelmatig moet worden bijgewerkt
 *
 * FOCUS OP WAARDE, NIET OP FEATURES:
 * - Feature = Wat het product doet (AI assistent)
 * - Benefit = Wat dit mogelijk maakt (Begeleidt door proces)
 * - Value = Hoe dit helpt doelen te bereiken (Zodat je kunt rouwen ipv administratie)
 *
 * KLANTDOELEN PER GROEP:
 * Families: Waardig afscheid zonder stress en fouten
 * Ondernemers: Uitzonderlijke service leveren en groeien
 * Locaties: Maximale bezetting en tevreden klanten
 *
 * 📋 REVIEW SCHEDULE:
 * - Maandelijks: Waarde proposities controleren
 * - Per kwartaal: Klantdoelen hervalideren
 * - Bij feedback: Messaging aanpassen
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, Building, MapPin, Heart, Shield, Clock, CheckCircle, ArrowRight, Flower2 } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Flower2 className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Een waardig afscheid <span className="text-blue-600">zonder stress</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Farewelly zorgt ervoor dat je kunt focussen op wat echt belangrijk is: afscheid nemen van je dierbare. Wij
            regelen de rest, zodat jij de ruimte hebt om te rouwen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signin">Begin vandaag</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/contact">Neem contact op</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Propositions by User Type */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Wat wil jij bereiken?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Iedereen heeft andere doelen. Farewelly helpt je die te bereiken, ongeacht je rol in het proces.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Families */}
            <Card className="border-2 hover:border-blue-200 transition-all hover:shadow-lg">
              <CardHeader className="text-center">
                <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Als Familie</CardTitle>
                <CardDescription className="text-base">
                  "Ik wil een waardig afscheid organiseren zonder fouten te maken of overweldigd te raken"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Geen belangrijke zaken vergeten</p>
                      <p className="text-sm text-slate-600">Zodat je zeker weet dat alles geregeld is</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Tijd voor rouw en verwerking</p>
                      <p className="text-sm text-slate-600">Zodat je kunt focussen op afscheid nemen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Familie betrokken houden</p>
                      <p className="text-sm text-slate-600">Zodat iedereen op de hoogte blijft</p>
                    </div>
                  </div>
                </div>
                <Button asChild className="w-full mt-6" variant="outline">
                  <Link href="/for-families">
                    Ontdek hoe wij families helpen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Directors */}
            <Card className="border-2 hover:border-blue-200 transition-all hover:shadow-lg">
              <CardHeader className="text-center">
                <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Als Uitvaartondernemer</CardTitle>
                <CardDescription className="text-base">
                  "Ik wil uitzonderlijke service leveren aan meer families zonder meer uren te maken"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Families beter begeleiden</p>
                      <p className="text-sm text-slate-600">Zodat je meer impact maakt per cliënt</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Meer tijd voor wat belangrijk is</p>
                      <p className="text-sm text-slate-600">Zodat je kunt groeien zonder burn-out</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Reputatie en vertrouwen opbouwen</p>
                      <p className="text-sm text-slate-600">Zodat families je aanbevelen</p>
                    </div>
                  </div>
                </div>
                <Button asChild className="w-full mt-6" variant="outline">
                  <Link href="/for-directors">
                    Ontdek hoe wij ondernemers helpen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Venues */}
            <Card className="border-2 hover:border-blue-200 transition-all hover:shadow-lg">
              <CardHeader className="text-center">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Als Locatie-eigenaar</CardTitle>
                <CardDescription className="text-base">
                  "Ik wil mijn locatie optimaal benutten met tevreden klanten die terugkomen"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Maximale bezettingsgraad</p>
                      <p className="text-sm text-slate-600">Zodat je meer omzet genereert</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Minder administratie</p>
                      <p className="text-sm text-slate-600">Zodat je tijd hebt voor andere zaken</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Langdurige relaties</p>
                      <p className="text-sm text-slate-600">Zodat ondernemers steeds terugkomen</p>
                    </div>
                  </div>
                </div>
                <Button asChild className="w-full mt-6" variant="outline">
                  <Link href="/for-venues">
                    Ontdek hoe wij locaties helpen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How We Make It Possible */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Hoe maken wij dit mogelijk?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Door de juiste mensen op het juiste moment te verbinden, met de juiste informatie en ondersteuning.
          </p>

          <div className="space-y-12">
            {/* Connection */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Verbinding</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Families vinden de juiste uitvaartondernemer. Ondernemers vinden de perfecte locatie. Iedereen werkt
                samen aan hetzelfde doel: een waardig afscheid.
              </p>
            </div>

            {/* Guidance */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Begeleiding</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Niemand hoeft het alleen te doen. Van je eerste vraag tot het laatste detail - er is altijd hulp
                beschikbaar wanneer je die nodig hebt.
              </p>
            </div>

            {/* Organization */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Organisatie</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Alles op één plek, altijd up-to-date, voor iedereen toegankelijk. Zodat je nooit meer iets vergeet of
                kwijtraakt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Klaar om je doelen te bereiken?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Duizenden families, ondernemers en locaties gebruiken Farewelly al. Ontdek wat wij voor jou kunnen
            betekenen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/signin">
                Begin gratis
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
