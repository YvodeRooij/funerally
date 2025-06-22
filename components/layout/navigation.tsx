"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Flower2,
  Home,
  Users,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Building,
} from "lucide-react"

interface DemoUser {
  id: string
  name: string
  email: string
  userType: "family" | "director" | "venue"
  onboardingComplete: boolean
}

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)
  
  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'nl'

  useEffect(() => {
    const storedDemoUser = localStorage.getItem("demoUser")
    if (storedDemoUser) {
      setDemoUser(JSON.parse(storedDemoUser))
    }
  }, [])

  const currentUser = session?.user || demoUser
  const isLoggedIn = !!currentUser

  const handleSignOut = async () => {
    if (demoUser) {
      localStorage.removeItem("demoUser")
      setDemoUser(null)
      window.location.href = `/${locale}`
    } else {
      await signOut({ callbackUrl: `/${locale}` })
    }
  }

  const getNavigationItems = () => {
    if (!currentUser) {
      return [
        { href: `/${locale}/how-it-works`, label: "Hoe het werkt", icon: FileText },
        { href: `/${locale}/for-families`, label: "Voor families", icon: Users },
        { href: `/${locale}/for-directors`, label: "Voor ondernemers", icon: Building },
        { href: `/${locale}/for-venues`, label: "Voor locaties", icon: MapPin },
        { href: `/${locale}/contact`, label: "Contact", icon: MessageSquare },
      ]
    }

    const userType = currentUser.userType || (session?.user as any)?.userType

    switch (userType) {
      case "family":
        return [
          { href: `/${locale}/family`, label: "Dashboard", icon: Home },
          { href: `/${locale}/family/documents`, label: "Documenten", icon: FileText },
          { href: `/${locale}/family/chat`, label: "Chat", icon: MessageSquare },
          { href: `/${locale}/venues`, label: "Locaties", icon: MapPin },
        ]

      case "director":
        return [
          { href: `/${locale}/director`, label: "Dashboard", icon: Home },
          { href: `/${locale}/director/clients`, label: "Cliënten", icon: Users },
          { href: `/${locale}/director/calendar`, label: "Agenda", icon: Calendar },
          { href: `/${locale}/venues`, label: "Locaties", icon: MapPin },
        ]

      case "venue":
        return [
          { href: `/${locale}/venue`, label: "Dashboard", icon: Home },
          { href: `/${locale}/venue/bookings`, label: "Boekingen", icon: Calendar },
          { href: `/${locale}/venue/availability`, label: "Beschikbaarheid", icon: Building },
        ]

      default:
        return [
          { href: `/${locale}/how-it-works`, label: "Hoe het werkt", icon: FileText },
          { href: `/${locale}/for-families`, label: "Voor families", icon: Users },
          { href: `/${locale}/for-directors`, label: "Voor ondernemers", icon: Building },
          { href: `/${locale}/for-venues`, label: "Voor locaties", icon: MapPin },
          { href: `/${locale}/contact`, label: "Contact", icon: MessageSquare },
        ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <Flower2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Farewelly</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.image || ""} alt={currentUser.name || ""} />
                      <AvatarFallback>{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="w-[200px] truncate text-sm text-slate-600">{currentUser.email}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {currentUser.userType === "family"
                          ? "Familie"
                          : currentUser.userType === "director"
                            ? "Uitvaartondernemer"
                            : "Locatie-eigenaar"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profiel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href={`/${locale}/signin`}>Inloggen</Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-200">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Mobile Login Button */}
              {!isLoggedIn && (
                <div className="pt-4 border-t border-slate-200">
                  <Link
                    href={`/${locale}/signin`}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Inloggen</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
