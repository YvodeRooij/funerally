import { ContactForm } from "@/components/contact/contact-form"
import { ContactInfo } from "@/components/contact/contact-info"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">We zijn er voor u</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Heeft u vragen of hulp nodig? Ons team staat klaar om u te ondersteunen in deze moeilijke tijd.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <ContactForm />
          <ContactInfo />
        </div>
      </div>
    </div>
  )
}
