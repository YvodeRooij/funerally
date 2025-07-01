"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  Copy, 
  RefreshCw, 
  Send, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { directorCodeService } from "@/lib/services/director-code-service"

interface NewClientInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  directorId: string
  directorName: string
}

interface FormData {
  familyName: string
  primaryContact: string
  email: string
  phone: string
  municipality: string
  expectedDate: string
  personalNote: string
}

const MUNICIPALITIES = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Tilburg", 
  "Groningen", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem",
  "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "Overig"
]

export function NewClientInvitationModal({ 
  isOpen, 
  onClose, 
  directorId, 
  directorName 
}: NewClientInvitationModalProps) {
  const [currentTab, setCurrentTab] = useState("form")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    familyName: "",
    primaryContact: "",
    email: "",
    phone: "",
    municipality: "",
    expectedDate: "",
    personalNote: ""
  })
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({})

  // Generate code when modal opens
  useEffect(() => {
    if (isOpen && !generatedCode) {
      generateNewCode()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentTab("form")
      setGeneratedCode("")
      setEmailSent(false)
      setFormData({
        familyName: "",
        primaryContact: "",
        email: "",
        phone: "",
        municipality: "",
        expectedDate: "",
        personalNote: ""
      })
      setFormErrors({})
    }
  }, [isOpen])

  const generateNewCode = async () => {
    setIsGeneratingCode(true)
    try {
      // Simulate code generation
      const year = new Date().getFullYear()
      const timestamp = Date.now().toString().slice(-4)
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
      const code = `UFV-${year}-${timestamp}${random}`
      
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      setGeneratedCode(code)
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {}
    
    if (!formData.familyName.trim()) errors.familyName = "Familie naam is verplicht"
    if (!formData.primaryContact.trim()) errors.primaryContact = "Contactpersoon is verplicht"
    if (!formData.email.trim()) errors.email = "Email adres is verplicht"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Ongeldig email adres"
    if (!formData.phone.trim()) errors.phone = "Telefoonnummer is verplicht"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSendInvitation = async () => {
    if (!validateForm()) {
      setCurrentTab("form")
      return
    }

    setIsSending(true)
    try {
      // Send invitation via API
      const response = await fetch('/api/director/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          directorId,
          directorName
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      // Update the generated code with the actual one from the server
      setGeneratedCode(result.data.code)
      setEmailSent(true)
      setCurrentTab("success")
      
      console.log('Invitation sent successfully:', result.data)
    } catch (error) {
      console.error('Error sending invitation:', error)
      // Show error message to user in production
      alert('Er is een fout opgetreden bij het versturen van de uitnodiging. Probeer het opnieuw.')
    } finally {
      setIsSending(false)
    }
  }

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      // Show toast notification in production
      console.log('Code copied to clipboard')
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const generateEmailPreview = () => {
    if (!generatedCode) return ""
    
    const tempCode = {
      code: generatedCode,
      familyName: formData.familyName || "[Familie naam]",
      primaryContact: formData.primaryContact || "[Contactpersoon]",
      email: formData.email,
      personalNote: formData.personalNote,
      phone: formData.phone,
      municipality: formData.municipality,
      expectedDate: formData.expectedDate,
      directorId,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      id: 'preview'
    }

    return directorCodeService.generateInvitationEmail(tempCode, directorName)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Nieuwe klant uitnodigen
          </DialogTitle>
          <DialogDescription>
            Maak een persoonlijke code aan en nodig een familie uit voor digitale intake
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Familie gegevens
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Email voorbeeld
            </TabsTrigger>
            <TabsTrigger value="success" disabled={!emailSent} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verzonden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            {/* Generated Code Display */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Auto-gegenereerd</Badge>
                  Uw persoonlijke code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                    <div className="text-2xl font-mono font-bold text-center text-blue-700">
                      {isGeneratingCode ? "Genereren..." : generatedCode}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyCodeToClipboard}
                      disabled={!generatedCode}
                      className="rounded-xl"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateNewCode}
                      disabled={isGeneratingCode}
                      className="rounded-xl"
                    >
                      <RefreshCw className={`h-3 w-3 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family Information Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="familyName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Familie naam *
                  </Label>
                  <Input
                    id="familyName"
                    value={formData.familyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, familyName: e.target.value }))}
                    placeholder="bijv. Familie van der Berg"
                    className={`rounded-xl ${formErrors.familyName ? 'border-red-500' : ''}`}
                  />
                  {formErrors.familyName && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.familyName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="primaryContact" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Hoofdcontactpersoon *
                  </Label>
                  <Input
                    id="primaryContact"
                    value={formData.primaryContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryContact: e.target.value }))}
                    placeholder="bijv. Maria van der Berg"
                    className={`rounded-xl ${formErrors.primaryContact ? 'border-red-500' : ''}`}
                  />
                  {formErrors.primaryContact && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.primaryContact}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email adres *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="maria@vandenberg.nl"
                    className={`rounded-xl ${formErrors.email ? 'border-red-500' : ''}`}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefoonnummer *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="06-12345678"
                    className={`rounded-xl ${formErrors.phone ? 'border-red-500' : ''}`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="municipality" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Gemeente (optioneel)
                  </Label>
                  <Select value={formData.municipality} onValueChange={(value) => setFormData(prev => ({ ...prev, municipality: value }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecteer gemeente" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUNICIPALITIES.map(municipality => (
                        <SelectItem key={municipality} value={municipality}>
                          {municipality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expectedDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Verwachte ceremonie datum (optioneel)
                  </Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="personalNote" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Persoonlijke boodschap (optioneel)
                  </Label>
                  <Textarea
                    id="personalNote"
                    value={formData.personalNote}
                    onChange={(e) => setFormData(prev => ({ ...prev, personalNote: e.target.value }))}
                    placeholder="Een persoonlijk bericht voor de familie..."
                    className="rounded-xl"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dit bericht wordt opgenomen in de email
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Annuleren
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("preview")}
                  disabled={!generatedCode}
                  className="rounded-xl"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voorbeeld bekijken
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={!generatedCode || isSending}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Uitnodiging versturen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Dit is een voorbeeld van de email die naar {formData.primaryContact || '[Contactpersoon]'} wordt verstuurd
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email voorbeeld</CardTitle>
                <CardDescription>
                  Onderwerp: Uitvaart {formData.familyName || '[Familie naam]'} - Digitale intake
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto border"
                  dangerouslySetInnerHTML={{ 
                    __html: generateEmailPreview()?.htmlBody || "Email wordt geladen..." 
                  }}
                />
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentTab("form")}
                className="rounded-xl"
              >
                Terug naar formulier
              </Button>
              <Button
                onClick={handleSendInvitation}
                disabled={!generatedCode || isSending}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Email versturen
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="success" className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-green-900 mb-2">
                Uitnodiging verzonden!
              </h3>
              <p className="text-gray-600 mb-6">
                De email is succesvol verstuurd naar {formData.primaryContact} ({formData.email})
              </p>

              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Code:</span>
                      <Badge className="font-mono">{generatedCode}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className="bg-orange-100 text-orange-800">Wacht op familie</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vervalt:</span>
                      <span className="text-sm">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" onClick={copyCodeToClipboard} className="rounded-xl">
                  <Copy className="h-4 w-4 mr-2" />
                  Kopieer code
                </Button>
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Sluiten
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}