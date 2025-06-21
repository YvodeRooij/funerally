import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export function VenueCTA() {
  return (
    <section className="py-20 px-4 bg-green-700">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">Klaar om meer te verdienen?</h2>
        <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
          Sluit u aan bij 500+ locaties die al profiteren van ons platform
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="bg-white text-green-700 hover:bg-slate-50 text-lg px-8 py-4">
            <Link href="/venues/signup">Gratis aanmelden</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-green-700 text-lg px-8 py-4"
          >
            <Link href="/venues/calculator">Inkomsten berekenen</Link>
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
                <span className="text-sm">locaties@platform.nl</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Heel Nederland</span>
              </div>
            </div>
            <p className="text-green-100 text-xs mt-3">
              Setup binnen 10 minuten • Eerste boeking gratis • Geen verborgen kosten
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
