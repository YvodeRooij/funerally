/**
 * TESTIMONIALS SECTION COMPONENT - DYNAMIC
 *
 * Purpose: Displays social proof relevant to Family or Provider.
 * Features: Shows testimonials from the selected user group.
 * User Journey: Builds trust and credibility.
 */
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import type { UserType } from "@/app/page"

interface Testimonial {
  name: string
  role: string
  avatar: string
  text: string
  rating: number
}

const familyTestimonials: Testimonial[] = [
  {
    name: "Familie Jansen",
    role: "Nabestaanden",
    avatar: "/placeholder.svg?width=40&height=40",
    text: "Het platform heeft ons enorm geholpen in een moeilijke tijd. Alles was duidelijk en goed georganiseerd. Een grote zorg minder.",
    rating: 5,
  },
  {
    name: "Dhr. de Vries",
    role: "Zoon",
    avatar: "/placeholder.svg?width=40&height=40",
    text: "Dankzij dit platform konden we snel een passende uitvaartondernemer vinden en alles naar wens regelen. Zeer aan te bevelen.",
    rating: 5,
  },
  {
    name: "Mevr. Bakker",
    role: "Dochter",
    avatar: "/placeholder.svg?width=40&height=40",
    text: "De begeleiding was respectvol en professioneel. Het gaf ons rust om te weten dat alles in goede handen was.",
    rating: 4,
  },
]

const providerTestimonials: Testimonial[] = [
  {
    name: "Uitvaartverzorging Petersen",
    role: "Eigenaar",
    avatar: "/placeholder.svg?width=40&height=40",
    text: "Sinds we ons hebben aangesloten, hebben we meer families kunnen bereiken. Het platform is gebruiksvriendelijk en efficiënt.",
    rating: 5,
  },
  {
    name: "Afscheid met Zorg BV",
    role: "Manager",
    avatar: "/placeholder.svg?width=40&height=40",
    text: "De tools voor planning en communicatie hebben onze workflow aanzienlijk verbeterd. Een waardevolle partner.",
    rating: 5,
  },
  {
    name: "Respectvol Herdenken",
    role: "Uitvaartplanner",
    avatar: "/placeholder.svg?width=40&height=40",
    text: "Het platform helpt ons om ons te concentreren op wat echt belangrijk is: het ondersteunen van families.",
    rating: 4,
  },
]

interface TestimonialsProps {
  userType: UserType
}

export function Testimonials({ userType }: TestimonialsProps) {
  const testimonials = userType === "family" ? familyTestimonials : providerTestimonials
  const title = userType === "family" ? "Wat families zeggen" : "Ervaringen van ondernemers"
  const description =
    userType === "family"
      ? "Lees hoe andere families onze diensten hebben ervaren."
      : "Ontdek hoe collega-ondernemers profiteren van ons platform."

  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  &quot;{testimonial.text}&quot;
                </p>
                <div className="flex">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  {Array(5 - testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i + testimonial.rating}
                        className="h-5 w-5 text-slate-300 dark:text-slate-600 fill-current"
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
