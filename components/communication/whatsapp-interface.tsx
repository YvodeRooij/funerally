"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Phone,
  Video,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  CheckCheck,
  Clock,
  Users,
  Settings,
} from "lucide-react"

// Mock WhatsApp conversations
const mockConversations = [
  {
    id: 1,
    name: "Jan de Boer",
    role: "Uitvaartondernemer",
    avatar: "/placeholder.svg?height=40&width=40&text=JB",
    lastMessage: "Ik heb de planning voor u klaarstaan",
    timestamp: "10:30",
    unread: 2,
    online: true,
    messages: [
      {
        id: 1,
        sender: "other",
        message: "Goedemorgen, ik heb de planning voor de uitvaart klaarstaan. Kunnen we dit even doornemen?",
        timestamp: "10:25",
        status: "delivered",
      },
      {
        id: 2,
        sender: "other",
        message: "De ceremonie is gepland voor vrijdag 15:00 in de Westgaarde",
        timestamp: "10:30",
        status: "delivered",
      },
    ],
  },
  {
    id: 2,
    name: "Familie Groep",
    role: "Familie & Vrienden",
    avatar: "/placeholder.svg?height=40&width=40&text=FG",
    lastMessage: "Tante Marie komt ook",
    timestamp: "09:45",
    unread: 0,
    online: false,
    messages: [
      {
        id: 1,
        sender: "other",
        message: "Hoi allemaal, ik wilde even laten weten dat tante Marie ook komt",
        timestamp: "09:45",
        status: "read",
      },
      {
        id: 2,
        sender: "me",
        message: "Dat is fijn om te horen. Dank je wel dat je het laat weten",
        timestamp: "09:50",
        status: "read",
      },
    ],
  },
  {
    id: 3,
    name: "Westgaarde Crematorium",
    role: "Locatie",
    avatar: "/placeholder.svg?height=40&width=40&text=WC",
    lastMessage: "Bevestiging reservering ontvangen",
    timestamp: "Gisteren",
    unread: 0,
    online: false,
    messages: [
      {
        id: 1,
        sender: "other",
        message: "Uw reservering voor vrijdag 15:00 is bevestigd. Alle faciliteiten zijn beschikbaar.",
        timestamp: "Gisteren 16:30",
        status: "read",
      },
    ],
  },
]

export function WhatsAppInterface() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("chats")

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: selectedConversation.messages.length + 1,
      sender: "me" as const,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
      status: "sent" as const,
    }

    // Update the conversation
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: newMessage,
      timestamp: "Nu",
    }

    setSelectedConversation(updatedConversation)
    setNewMessage("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Clock className="h-3 w-3 text-slate-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-slate-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Communicatie</h1>
          <p className="text-slate-600">Blijf in contact met alle betrokkenen</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 h-[700px]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Gesprekken
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="chats" className="flex-1">
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="flex-1">
                    Groepen
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chats" className="mt-0">
                  <div className="space-y-1">
                    {mockConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full text-left p-4 hover:bg-slate-50 border-b border-slate-100 ${
                          selectedConversation.id === conversation.id ? "bg-purple-50 border-purple-200" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
                              <AvatarFallback>{conversation.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            {conversation.online && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-slate-900 truncate">{conversation.name}</h3>
                              <span className="text-xs text-slate-500">{conversation.timestamp}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{conversation.role}</p>
                            <p className="text-sm text-slate-500 truncate">{conversation.lastMessage}</p>
                          </div>
                          {conversation.unread > 0 && (
                            <Badge className="bg-green-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="mt-0">
                  <div className="p-4 text-center text-slate-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm">Geen groepsgesprekken</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedConversation.avatar || "/placeholder.svg"}
                      alt={selectedConversation.name}
                    />
                    <AvatarFallback>{selectedConversation.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedConversation.name}</h3>
                    <p className="text-sm text-slate-600">{selectedConversation.role}</p>
                    {selectedConversation.online && <p className="text-xs text-green-600">● Online</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md ${message.sender === "me" ? "order-2" : "order-1"}`}>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.sender === "me" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        message.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-xs text-slate-500">{message.timestamp}</span>
                      {message.sender === "me" && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Typ een bericht..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                </div>
                <Button size="sm" variant="outline">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
