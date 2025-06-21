import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, Calendar } from "lucide-react"
import Link from "next/link"

export function ProviderCTA() {
  return (
    <section className="py-20 px-4 bg-blue-700">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">Klaar om te groeien?</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Sluit u aan bij 200+ uitvaartondernemers die al profiteren van ons platform
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-slate-50 text-lg px-8 py-4">
            <Link href="/providers/signup">Gratis aanmelden</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-blue-700 text-lg px-8 py-4"
          >
            <Link href="/providers/demo">Demo aanvragen</Link>
          </Button>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Persoonlijke begeleiding bij aanmelding</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-white">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">020-1234567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">partners@platform.nl</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Demo op afspraak</span>
              </div>
            </div>
            <p className="text-blue-100 text-xs mt-3">
              Persoonlijke onboarding • Setup binnen 2 uur • Eerste 2 klanten gratis
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
