"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react"

// Mock user data
const mockUsers = {
  families: [
    {
      id: 1,
      name: "Familie van der Berg",
      email: "contact@vandenberg.nl",
      phone: "+31 6 12345678",
      location: "Amsterdam",
      status: "active",
      joinDate: "2024-01-15",
      funerals: 1,
      lastActivity: "2024-01-20",
      rating: 4.8,
      notes: "Zeer tevreden met service",
    },
    {
      id: 2,
      name: "Familie Jansen",
      email: "info@jansen.nl",
      phone: "+31 6 87654321",
      location: "Rotterdam",
      status: "completed",
      joinDate: "2023-12-10",
      funerals: 1,
      lastActivity: "2024-01-18",
      rating: 4.9,
      notes: "Uitvaart succesvol afgerond",
    },
    {
      id: 3,
      name: "Familie de Wit",
      email: "dewit@email.com",
      phone: "+31 6 11223344",
      location: "Utrecht",
      status: "pending",
      joinDate: "2024-01-22",
      funerals: 0,
      lastActivity: "2024-01-22",
      rating: null,
      notes: "Nog in intake proces",
    },
  ],
  directors: [
    {
      id: 1,
      name: "Jan de Boer",
      company: "Uitvaartzorg De Boer",
      email: "jan@deboer.nl",
      phone: "+31 20 1234567",
      location: "Amsterdam",
      status: "active",
      joinDate: "2023-03-15",
      completedFunerals: 45,
      rating: 4.8,
      revenue: 18500,
      lastActivity: "2024-01-20",
      specializations: ["Crematie", "Begrafenis", "Islamitisch"],
      verified: true,
    },
    {
      id: 2,
      name: "Maria Visser",
      company: "Visser Uitvaarten",
      email: "maria@visser.nl",
      phone: "+31 10 7654321",
      location: "Rotterdam",
      status: "active",
      joinDate: "2023-05-22",
      completedFunerals: 38,
      rating: 4.9,
      revenue: 15200,
      lastActivity: "2024-01-19",
      specializations: ["Crematie", "Natuurbegrafenis"],
      verified: true,
    },
    {
      id: 3,
      name: "Ahmed Hassan",
      company: "Hassan Uitvaartbegeleiding",
      email: "ahmed@hassan.nl",
      phone: "+31 30 9876543",
      location: "Utrecht",
      status: "pending",
      joinDate: "2024-01-10",
      completedFunerals: 0,
      rating: null,
      revenue: 0,
      lastActivity: "2024-01-15",
      specializations: ["Islamitisch", "Multicultureel"],
      verified: false,
    },
  ],
  venues: [
    {
      id: 1,
      name: "Westgaarde Crematorium",
      type: "Crematorium",
      email: "info@westgaarde.nl",
      phone: "+31 20 5555555",
      location: "Amsterdam",
      status: "active",
      joinDate: "2023-02-01",
      bookings: 156,
      rating: 4.7,
      revenue: 23400,
      lastActivity: "2024-01-20",
      capacity: 200,
      facilities: ["Aula", "Condoleanceruimte", "Catering"],
      verified: true,
    },
    {
      id: 2,
      name: "Protestantse Kerk Centrum",
      type: "Kerk",
      email: "beheer@pkcentrum.nl",
      phone: "+31 30 4444444",
      location: "Utrecht",
      status: "active",
      joinDate: "2023-06-15",
      bookings: 89,
      rating: 4.6,
      revenue: 12600,
      lastActivity: "2024-01-18",
      capacity: 150,
      facilities: ["Kerkzaal", "Orgel", "Parkeerplaats"],
      verified: true,
    },
  ],
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState("families")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "suspended":
        return <Ban className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-slate-600" />
    }
  }

  const renderUserCard = (user: any, type: string) => (
    <Card key={user.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-900">{type === "families" ? user.name : user.name}</h3>
              {user.verified && <Shield className="h-4 w-4 text-blue-600" />}
              <Badge className={getStatusColor(user.status)}>
                {user.status === "active"
                  ? "Actief"
                  : user.status === "pending"
                    ? "In behandeling"
                    : user.status === "completed"
                      ? "Voltooid"
                      : "Opgeschort"}
              </Badge>
            </div>

            {type === "directors" && <p className="text-slate-600 mb-2">{user.company}</p>}

            {type === "venues" && <p className="text-slate-600 mb-2">{user.type}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {user.phone}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {user.location}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Lid sinds: {new Date(user.joinDate).toLocaleDateString("nl-NL")}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {type === "families" && (
                <>
                  <div>
                    <span className="text-slate-500">Uitvaarten:</span>
                    <span className="ml-1 font-medium">{user.funerals}</span>
                  </div>
                  {user.rating && (
                    <div>
                      <span className="text-slate-500">Rating:</span>
                      <span className="ml-1 font-medium">⭐ {user.rating}</span>
                    </div>
                  )}
                </>
              )}

              {type === "directors" && (
                <>
                  <div>
                    <span className="text-slate-500">Uitvaarten:</span>
                    <span className="ml-1 font-medium">{user.completedFunerals}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Rating:</span>
                    <span className="ml-1 font-medium">{user.rating ? `⭐ ${user.rating}` : "Nog geen rating"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Omzet:</span>
                    <span className="ml-1 font-medium">€{user.revenue.toLocaleString()}</span>
                  </div>
                </>
              )}

              {type === "venues" && (
                <>
                  <div>
                    <span className="text-slate-500">Boekingen:</span>
                    <span className="ml-1 font-medium">{user.bookings}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Rating:</span>
                    <span className="ml-1 font-medium">⭐ {user.rating}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Capaciteit:</span>
                    <span className="ml-1 font-medium">{user.capacity} personen</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Omzet:</span>
                    <span className="ml-1 font-medium">€{user.revenue.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {user.specializations && (
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-1">Specialisaties:</p>
                <div className="flex flex-wrap gap-1">
                  {user.specializations.map((spec: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user.facilities && (
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-1">Faciliteiten:</p>
                <div className="flex flex-wrap gap-1">
                  {user.facilities.map((facility: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user.notes && (
              <div className="mt-3 p-2 bg-slate-50 rounded text-sm text-slate-600">
                <strong>Notities:</strong> {user.notes}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {getStatusIcon(user.status)}
            <div className="flex gap-1">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Gebruiker details</DialogTitle>
                    <DialogDescription>Gedetailleerde informatie over {user.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Naam</label>
                        <p className="text-slate-900">{user.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <p className="text-slate-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Telefoon</label>
                        <p className="text-slate-900">{user.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Locatie</label>
                        <p className="text-slate-900">{user.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Mail className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Bewerken
                      </Button>
                      {user.status !== "suspended" && (
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Ban className="h-3 w-3 mr-1" />
                          Opschorten
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline">
                <Edit className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="text-red-600">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Gebruikersbeheer</h1>
          <p className="text-slate-600">Beheer alle platform gebruikers</p>
        </div>
        <Button className="bg-purple-700 hover:bg-purple-800">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe gebruiker
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Totaal families</p>
                <p className="text-2xl font-bold text-slate-900">{mockUsers.families.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ondernemers</p>
                <p className="text-2xl font-bold text-slate-900">{mockUsers.directors.length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Locaties</p>
                <p className="text-2xl font-bold text-slate-900">{mockUsers.venues.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Actieve gebruikers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {
                    [...mockUsers.families, ...mockUsers.directors, ...mockUsers.venues].filter(
                      (u) => u.status === "active",
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Zoek gebruikers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="pending">In behandeling</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                  <SelectItem value="suspended">Opgeschort</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Lists */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="families">Families ({mockUsers.families.length})</TabsTrigger>
          <TabsTrigger value="directors">Ondernemers ({mockUsers.directors.length})</TabsTrigger>
          <TabsTrigger value="venues">Locaties ({mockUsers.venues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="families">
          <div className="space-y-4">{mockUsers.families.map((user) => renderUserCard(user, "families"))}</div>
        </TabsContent>

        <TabsContent value="directors">
          <div className="space-y-4">{mockUsers.directors.map((user) => renderUserCard(user, "directors"))}</div>
        </TabsContent>

        <TabsContent value="venues">
          <div className="space-y-4">{mockUsers.venues.map((user) => renderUserCard(user, "venues"))}</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
