import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Jan de Boer",
    company: "Uitvaartzorg De Boer",
    location: "Amsterdam",
    text: "In 6 maanden van 4 naar 12 uitvaarten per maand. De families zijn beter voorbereid en weten wat ze willen. Mijn administratie is gehalveerd.",
    rating: 5,
    metric: "+200% omzet",
  },
  {
    name: "Maria Visser",
    company: "Visser Uitvaarten",
    location: "Rotterdam",
    text: "Eindelijk kan ik weer focussen op wat ik het liefste doe: families begeleiden. De betaling binnen 7 dagen heeft mijn cashflow enorm verbeterd.",
    rating: 5,
    metric: "€1.350 besparing per uitvaart",
  },
  {
    name: "Ahmed Hassan",
    company: "Hassan Uitvaartbegeleiding",
    location: "Utrecht",
    text: "Het platform begrijpt onze islamitische tradities perfect. Ik krijg alleen families die echt bij mijn specialisatie passen.",
    rating: 5,
    metric: "90% conversie rate",
  },
]

export function ProviderTestimonials() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
            Succesverhalen van collega's
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Meer dan 200 uitvaartondernemers gingen u voor</p>
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
                  <p className="text-sm text-slate-600">{testimonial.company}</p>
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
