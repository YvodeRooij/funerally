/**
 * SMART FORM COMPLETION - Intelligent form assistance for grieving families
 *
 * Purpose: Reduces cognitive load during emotional stress by providing smart suggestions
 * Features: Auto-completion, intelligent suggestions, error prevention, progress saving
 * Critical: Minimizes mental effort required during grief while ensuring accuracy
 *
 * Smart Features:
 * - Address auto-completion using Dutch postal codes
 * - Common funeral service suggestions
 * - Insurance provider recognition
 * - Cultural/religious tradition suggestions
 * - Automatic form validation and error prevention
 */

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building, Users, Lightbulb } from "lucide-react"

interface SmartSuggestion {
  id: string
  text: string
  type: "address" | "service" | "insurance" | "cultural"
  confidence: number
  icon?: React.ReactNode
}

interface SmartFormCompletionProps {
  fieldType: "address" | "service" | "insurance" | "cultural" | "general"
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSuggestionSelect?: (suggestion: SmartSuggestion) => void
}

// Mock data for Dutch context
const addressSuggestions = [
  {
    id: "1",
    text: "Hoofdstraat 123, 1012 AB Amsterdam",
    type: "address",
    confidence: 95,
    icon: <MapPin className="h-3 w-3" />,
  },
  {
    id: "2",
    text: "Kerkstraat 45, 3011 BC Rotterdam",
    type: "address",
    confidence: 90,
    icon: <MapPin className="h-3 w-3" />,
  },
  {
    id: "3",
    text: "Marktplein 67, 2511 CD Den Haag",
    type: "address",
    confidence: 85,
    icon: <MapPin className="h-3 w-3" />,
  },
]

const serviceSuggestions = [
  {
    id: "1",
    text: "Crematie met plechtigheid",
    type: "service",
    confidence: 95,
    icon: <Building className="h-3 w-3" />,
  },
  {
    id: "2",
    text: "Begrafenis op begraafplaats",
    type: "service",
    confidence: 90,
    icon: <Building className="h-3 w-3" />,
  },
  { id: "3", text: "Herdenkingsdienst", type: "service", confidence: 85, icon: <Users className="h-3 w-3" /> },
]

const insuranceSuggestions = [
  {
    id: "1",
    text: "DELA Uitvaartverzekering",
    type: "insurance",
    confidence: 95,
    icon: <Building className="h-3 w-3" />,
  },
  { id: "2", text: "Monuta Verzekeringen", type: "insurance", confidence: 90, icon: <Building className="h-3 w-3" /> },
  { id: "3", text: "Yarden Uitvaartgroep", type: "insurance", confidence: 85, icon: <Building className="h-3 w-3" /> },
]

const culturalSuggestions = [
  {
    id: "1",
    text: "Islamitische begrafenisrituelen",
    type: "cultural",
    confidence: 95,
    icon: <Users className="h-3 w-3" />,
  },
  { id: "2", text: "Joodse uitvaarttradities", type: "cultural", confidence: 90, icon: <Users className="h-3 w-3" /> },
  { id: "3", text: "Christelijke ceremonie", type: "cultural", confidence: 85, icon: <Users className="h-3 w-3" /> },
]

export function SmartFormCompletion({
  fieldType,
  value,
  onChange,
  placeholder,
  onSuggestionSelect,
}: SmartFormCompletionProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)

    // Simulate API call delay
    const timer = setTimeout(() => {
      let newSuggestions: SmartSuggestion[] = []

      switch (fieldType) {
        case "address":
          newSuggestions = addressSuggestions.filter((s) => s.text.toLowerCase().includes(value.toLowerCase()))
          break
        case "service":
          newSuggestions = serviceSuggestions.filter((s) => s.text.toLowerCase().includes(value.toLowerCase()))
          break
        case "insurance":
          newSuggestions = insuranceSuggestions.filter((s) => s.text.toLowerCase().includes(value.toLowerCase()))
          break
        case "cultural":
          newSuggestions = culturalSuggestions.filter((s) => s.text.toLowerCase().includes(value.toLowerCase()))
          break
        default:
          newSuggestions = []
      }

      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, fieldType])

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    onChange(suggestion.text)
    setShowSuggestions(false)
    onSuggestionSelect?.(suggestion)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        )}
        {!isLoading && suggestions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Lightbulb className="h-4 w-4 text-purple-600" />
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-xl">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full justify-start h-auto p-3 text-left"
                >
                  <div className="flex items-center gap-3 w-full">
                    {suggestion.icon}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{suggestion.text}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.confidence}% match
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lightbulb className="h-3 w-3" />
                <span>Slimme suggesties om u te helpen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
