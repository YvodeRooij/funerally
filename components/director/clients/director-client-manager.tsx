"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Search, Phone, MessageSquare, Calendar, Plus } from "lucide-react"

export function DirectorClientManager() {
  const clients = [
    {
      id: 1,
      familyName: "Van der Berg",
      deceasedName: "Henk van der Berg",
      serviceDate: "2024-01-20",
      status: "planning",
      progress: 75,
      lastContact: "2 uur geleden",
      phone: "06-12345678",
      email: "familie@vandenberg.nl",
    },
    {
      id: 2,
      familyName: "Jansen",
      deceasedName: "Maria Jansen",
      serviceDate: "2024-01-18",
      status: "urgent",
      progress: 45,
      lastContact: "30 min geleden",
      phone: "06-87654321",
      email: "jansen@email.nl",
    },
  ]

  return (
    <Tabs defaultValue="active" className="space-y-6">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="active">Actieve Klanten</TabsTrigger>
          <TabsTrigger value="completed">Afgerond</TabsTrigger>
          <TabsTrigger value="archived">Archief</TabsTrigger>
        </TabsList>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Klant
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Zoek op naam, datum, of status..." className="pl-10" />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <TabsContent value="active">
        <div className="space-y-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{client.familyName}</h3>
                    <p className="text-slate-600">{client.deceasedName}</p>
                    <p className="text-sm text-slate-500">Uitvaart: {client.serviceDate}</p>
                  </div>
                  <Badge
                    className={
                      client.status === "urgent"
                        ? "bg-red-100 text-red-800"
                        : client.status === "planning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {client.status === "urgent" ? "Urgent" : "Planning"}
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Voortgang</span>
                    <span>{client.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${client.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Laatste contact: {client.lastContact}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Bellen
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Chat
                    </Button>
                    <Button size="sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      Planning
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="completed">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Afgeronde Uitvaarten</h3>
            <p className="text-slate-500">Hier vindt u alle succesvol afgeronde uitvaarten</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="archived">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Archief</h3>
            <p className="text-slate-500">Gearchiveerde klantgegevens</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
