import Link from "next/link"
import { Heart, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 font-serif font-bold text-xl mb-4">
              <Heart className="h-6 w-6 text-purple-400" />
              Uitvaart Platform
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Waardig afscheid zonder zorgen. Wij begeleiden Nederlandse families door alle stappen van een uitvaart.
            </p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                020-1234567
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                hulp@platform.nl
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Amsterdam, Nederland
              </div>
            </div>
          </div>

          {/* For Families */}
          <div>
            <h3 className="font-semibold mb-4">Voor families</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/start" className="hover:text-white transition-colors">
                  Begin hier
                </Link>
              </li>
              <li>
                <Link href="/hoe-werkt-het" className="hover:text-white transition-colors">
                  Hoe werkt het
                </Link>
              </li>
              <li>
                <Link href="/prijzen" className="hover:text-white transition-colors">
                  Prijzen
                </Link>
              </li>
              <li>
                <Link href="/financiele-hulp" className="hover:text-white transition-colors">
                  Financiële hulp
                </Link>
              </li>
              <li>
                <Link href="/veelgestelde-vragen" className="hover:text-white transition-colors">
                  Veelgestelde vragen
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="font-semibold mb-4">Voor ondernemers</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/providers" className="hover:text-white transition-colors">
                  Overzicht
                </Link>
              </li>
              <li>
                <Link href="/providers/signup" className="hover:text-white transition-colors">
                  Aanmelden
                </Link>
              </li>
              <li>
                <Link href="/providers/demo" className="hover:text-white transition-colors">
                  Demo aanvragen
                </Link>
              </li>
              <li>
                <Link href="/providers/support" className="hover:text-white transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Juridisch</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacybeleid
                </Link>
              </li>
              <li>
                <Link href="/algemene-voorwaarden" className="hover:text-white transition-colors">
                  Algemene voorwaarden
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookiebeleid
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">© 2024 Uitvaart Platform Nederland. Alle rechten voorbehouden.</p>
          <p className="text-slate-400 text-sm mt-2 md:mt-0">Gemaakt met ❤️ voor Nederlandse families</p>
        </div>
      </div>
    </footer>
  )
}
