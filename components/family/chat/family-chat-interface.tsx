"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Phone, Video } from "lucide-react"

export function FamilyChatInterface() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Communicatie</h1>
        <p className="text-slate-600">Direct contact met uw uitvaartondernemer</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat met Jan de Boer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 bg-slate-50 rounded-lg p-4 mb-4 overflow-y-auto">
                {/* Chat messages would go here */}
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-lg max-w-xs">
                    <p className="text-sm">Goedemiddag! Hoe gaat het met de voorbereidingen?</p>
                    <span className="text-xs text-slate-500">Jan de Boer • 14:30</span>
                  </div>
                  <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs ml-auto">
                    <p className="text-sm">
                      Goed, we hebben de bloemen gekozen. Wanneer kunnen we de muziek bespreken?
                    </p>
                    <span className="text-xs text-blue-200">U • 14:45</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Type uw bericht..." className="flex-1" />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uw Uitvaartondernemer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Jan de Boer</h3>
                <p className="text-sm text-slate-600">Uitvaartzorg De Boer</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Bellen
                </Button>
                <Button variant="outline" className="w-full">
                  <Video className="h-4 w-4 mr-2" />
                  Videogesprek
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
