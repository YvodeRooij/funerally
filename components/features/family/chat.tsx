"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare } from "lucide-react"

export function FamilyChat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Berichten</h1>
        <p className="text-muted-foreground">Communiceer direct met uw begeleider</p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Chat met Jan de Vries
          </CardTitle>
          <CardDescription>Uitvaartondernemer - Online</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg max-w-xs">
                <p className="text-sm">Goedemorgen! Hoe gaat het met u?</p>
                <p className="text-xs text-muted-foreground mt-1">Jan - 09:30</p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                <p className="text-sm">Dank je wel. We hebben nog wat vragen over de documenten.</p>
                <p className="text-xs opacity-70 mt-1">U - 09:45</p>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg max-w-xs">
                <p className="text-sm">Natuurlijk! Wat kan ik voor u verduidelijken?</p>
                <p className="text-xs text-muted-foreground mt-1">Jan - 09:47</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Input placeholder="Typ uw bericht..." className="flex-1" />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
