import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, Clock, MapPin, Heart } from "lucide-react"

export function ContactInfo() {
  return (
    <div className="space-y-6">
      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Contact opnemen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Telefoon</p>
              <p className="text-slate-600">020-1234567</p>
              <p className="text-sm text-slate-500">24/7 beschikbaar voor spoedeisende zaken</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <p className="text-slate-600">hulp@platform.nl</p>
              <p className="text-sm text-slate-500">Reactie binnen 2-24 uur</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">WhatsApp</p>
              <p className="text-slate-600">06-87654321</p>
              <p className="text-sm text-slate-500">Snelle vragen en updates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Office Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Openingstijden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Maandag - Vrijdag</span>
              <span className="font-medium">9:00 - 17:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Zaterdag</span>
              <span className="font-medium">10:00 - 14:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Zondag</span>
              <span className="font-medium">Gesloten</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Spoedeisende zaken:</strong> Voor uitvaarten binnen 48 uur zijn we 24/7 bereikbaar via telefoon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Office Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Kantoor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium text-slate-900">Uitvaart Platform Nederland</p>
            <p className="text-slate-600">
              Herengracht 123
              <br />
              1015 BG Amsterdam
              <br />
              Nederland
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Let op:</strong> Wij werken voornamelijk digitaal. Voor persoonlijke gesprekken maken we graag een
              afspraak.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support Promise */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="text-center">
            <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-purple-900 mb-2">Onze belofte</h3>
            <p className="text-purple-800 text-sm">
              We begrijpen dat dit een moeilijke tijd voor u is. Ons team doet er alles aan om u zo goed mogelijk te
              helpen en ondersteunen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
