"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  Paperclip,
  Search,
  MoreVertical,
  CheckCheck,
  Clock,
  AlertCircle,
} from "lucide-react"

// Mock conversation data
const mockConversations = [
  {
    id: 1,
    name: "Jan de Boer",
    role: "Uitvaartondernemer",
    company: "Uitvaartzorg De Boer",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "De bloemen zijn bevestigd voor morgen 13:00",
    lastMessageTime: "2 min geleden",
    unreadCount: 0,
    online: true,
    priority: "normal",
  },
  {
    id: 2,
    name: "Platform Support",
    role: "Klantenservice",
    company: "Uitvaart Platform",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Uw documenten zijn succesvol geüpload",
    lastMessageTime: "1 uur geleden",
    unreadCount: 1,
    online: true,
    priority: "normal",
  },
  {
    id: 3,
    name: "Westgaarde Crematorium",
    role: "Locatie",
    company: "Westgaarde",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Bevestiging ontvangen voor 20 januari 14:00",
    lastMessageTime: "3 uur geleden",
    unreadCount: 0,
    online: false,
    priority: "normal",
  },
  {
    id: 4,
    name: "DELA Verzekeringen",
    role: "Verzekeraar",
    company: "DELA",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Uitkering is goedgekeurd en wordt overgemaakt",
    lastMessageTime: "1 dag geleden",
    unreadCount: 0,
    online: false,
    priority: "high",
  },
]

const mockMessages = [
  {
    id: 1,
    senderId: 1,
    senderName: "Jan de Boer",
    message: "Goedemiddag! Ik heb uw wensen doorgenomen en alles is mogelijk op 20 januari.",
    timestamp: "14:30",
    status: "read",
    type: "text",
  },
  {
    id: 2,
    senderId: "me",
    senderName: "U",
    message: "Dank je wel Jan. Kunnen we de bloemen nog aanpassen? Mijn moeder hield van witte rozen.",
    timestamp: "14:32",
    status: "read",
    type: "text",
  },
  {
    id: 3,
    senderId: 1,
    senderName: "Jan de Boer",
    message: "Natuurlijk! Ik regel een mooi boeket witte rozen. Heeft u een voorkeur voor de grootte?",
    timestamp: "14:35",
    status: "read",
    type: "text",
  },
  {
    id: 4,
    senderId: "me",
    senderName: "U",
    message: "Een groot boeket zou mooi zijn. Wat zijn de kosten?",
    timestamp: "14:40",
    status: "read",
    type: "text",
  },
  {
    id: 5,
    senderId: 1,
    senderName: "Jan de Boer",
    message: "Een groot boeket witte rozen kost €85. Ik heb het toegevoegd aan uw offerte.",
    timestamp: "14:45",
    status: "read",
    type: "text",
  },
  {
    id: 6,
    senderId: 1,
    senderName: "Jan de Boer",
    message: "De bloemen zijn bevestigd voor morgen 13:00",
    timestamp: "16:20",
    status: "delivered",
    type: "text",
  },
]

export function MessageCenter() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = mockConversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-600" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-slate-400" />
      case "sent":
        return <Clock className="h-3 w-3 text-slate-400" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      default:
        return "border-l-transparent"
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="flex h-[800px] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Berichten</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Zoek gesprekken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedConversation.id === conversation.id
                    ? "bg-blue-50 border-l-blue-500"
                    : getPriorityColor(conversation.priority)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
                      <AvatarFallback>
                        {conversation.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{conversation.name}</h3>
                      <span className="text-xs text-slate-500">{conversation.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {conversation.role} • {conversation.company}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white text-xs">{conversation.unreadCount}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedConversation.avatar || "/placeholder.svg"}
                      alt={selectedConversation.name}
                    />
                    <AvatarFallback>
                      {selectedConversation.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedConversation.name}</h3>
                  <p className="text-sm text-slate-600">
                    {selectedConversation.role} • {selectedConversation.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div key={message.id} className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === "me" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 ${
                      message.senderId === "me" ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    <span className="text-xs">{message.timestamp}</span>
                    {message.senderId === "me" && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-end gap-3">
              <Button size="sm" variant="outline">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Textarea
                  placeholder="Typ uw bericht..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-32 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Druk op Enter om te verzenden, Shift+Enter voor een nieuwe regel
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">24/7 Support</p>
                <p className="text-sm text-green-700">Altijd bereikbaar voor spoedeisende zaken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Direct bellen</p>
                <p className="text-sm text-blue-700">020-1234567 voor urgente zaken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-800">Spoed melding</p>
                <p className="text-sm text-purple-700">Voor wijzigingen binnen 24 uur</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
