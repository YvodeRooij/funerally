import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Dominee Peters",
    venue: "Protestantse Kerk Centrum",
    location: "Amersfoort",
    text: "Onze kerk stond 4 dagen per week leeg. Nu hebben we 2-3 extra uitvaarten per maand. Het extra inkomen helpt enorm met het onderhoud.",
    rating: 5,
    metric: "€800 extra per maand",
  },
  {
    name: "Sandra van Dijk",
    venue: "Zalencentrum De Eik",
    location: "Eindhoven",
    text: "Heel eenvoudig om te gebruiken. Ik krijg een WhatsApp als er een aanvraag is, en kan direct ja of nee zeggen. Betaling altijd op tijd.",
    rating: 5,
    metric: "95% bezettingsgraad",
  },
  {
    name: "Ahmed Osman",
    venue: "Islamitisch Centrum",
    location: "Den Haag",
    text: "Het platform begrijpt onze religieuze vereisten. We krijgen alleen aanvragen die bij onze faciliteiten passen.",
    rating: 5,
    metric: "€1.400 extra per maand",
  },
]

export function VenueTestimonials() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
            Succesverhalen van locatie-eigenaren
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Meer dan 500 locaties gingen u voor</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-slate-600 mb-4 italic">"{testimonial.text}"</p>

                <div className="border-t pt-4">
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.venue}</p>
                  <p className="text-sm text-slate-500">{testimonial.location}</p>
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {testimonial.metric}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
