/**
 * CALL TO ACTION (CTA) SECTION COMPONENT - DYNAMIC
 *
 * Purpose: Provides a final, strong call to action tailored to Family or Provider.
 * Features: Dynamic text and buttons.
 * User Journey: Encourages users to take the next step.
 */
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"
import type { UserType } from "@/app/page"

interface CTAProps {
  userType: UserType
}

export function CTA({ userType }: CTAProps) {
  const isFamily = userType === "family"
  const title = isFamily ? "Klaar om te beginnen?" : "Klaar om uw onderneming te laten groeien?"
  const description = isFamily
    ? "Start vandaag nog - volledig gratis tot u tevreden bent met uw plan."
    : "Sluit u aan bij ons netwerk en bereik meer families. Registratie is eenvoudig."
  const cta1Text = isFamily ? "Begin nu" : "Registreer uw onderneming"
  const cta1Link = isFamily ? "/start" : "/providers/onboarding"
  const cta2Text = isFamily ? "Eerst vragen stellen" : "Meer informatie"
  const cta2Link = isFamily ? "/contact" : "/providers#details" // Example link for providers

  const primaryColor = isFamily ? "purple" : "teal"
  const bgColorClass = isFamily ? "bg-purple-700" : "bg-teal-600"
  const textColorClass = isFamily ? "text-purple-100" : "text-teal-100"
  const buttonPrimaryClass = isFamily
    ? "bg-white text-purple-700 hover:bg-slate-50"
    : "bg-white text-teal-700 hover:bg-slate-50"
  const buttonOutlineClass = isFamily
    ? "border-white text-white hover:bg-white hover:text-purple-700"
    : "border-white text-white hover:bg-white hover:text-teal-700"

  return (
    <section className={`py-20 px-4 ${bgColorClass} dark:${bgColorClass}/90`}>
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">{title}</h2>
        <p className={`text-xl ${textColorClass} mb-8 max-w-2xl mx-auto`}>{description}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className={`${buttonPrimaryClass} text-lg px-8 py-4`}>
            <Link href={cta1Link}>{cta1Text}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className={`${buttonOutlineClass} text-lg px-8 py-4`}>
            <Link href={cta2Link}>{cta2Text}</Link>
          </Button>
        </div>

        {isFamily && ( // Contact card might be more relevant for families, providers have other channels
          <Card className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 backdrop-blur">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4">Hulp nodig? We zijn er voor u</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-white">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">020-1234567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">hulp@platform.nl</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">WhatsApp beschikbaar</span>
                </div>
              </div>
              <p className={`${textColorClass} text-xs mt-3`}>Ma-Vr 9-17u, Za 10-14u • Spoed binnen 2 uur</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
