"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Check, AlertTriangle, RefreshCw } from "lucide-react"

interface SmartPrefillProps {
  extractedData: Record<string, any>
  onDataUpdate: (data: Record<string, any>) => void
  confidence: number
}

export function SmartFormPrefill({ extractedData, onDataUpdate, confidence }: SmartPrefillProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{
      field: string
      value: any
      confidence: number
      source: string
    }>
  >([])

  useEffect(() => {
    // Generate smart suggestions based on extracted data
    const newSuggestions = Object.entries(extractedData).map(([key, value]) => ({
      field: key,
      value,
      confidence: confidence + Math.random() * 10 - 5, // Slight variation
      source: "Document AI",
    }))
    setSuggestions(newSuggestions)
  }, [extractedData, confidence])

  const applySuggestion = (field: string, value: any) => {
    onDataUpdate({ [field]: value })
    setSuggestions((prev) => prev.filter((s) => s.field !== field))
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "text-green-600 bg-green-100"
    if (conf >= 75) return "text-blue-600 bg-blue-100"
    return "text-amber-600 bg-amber-100"
  }

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 90) return <Check className="h-3 w-3" />
    if (conf >= 75) return <Sparkles className="h-3 w-3" />
    return <AlertTriangle className="h-3 w-3" />
  }

  if (suggestions.length === 0) return null

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-purple-800">Slimme suggesties</h3>
          <Badge className="bg-purple-100 text-purple-800">{suggestions.length} velden gevonden</Badge>
        </div>

        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.field} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900 capitalize">
                    {suggestion.field.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </span>
                  <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                    {getConfidenceIcon(suggestion.confidence)}
                    {Math.round(suggestion.confidence)}%
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {Array.isArray(suggestion.value) ? suggestion.value.join(", ") : suggestion.value}
                </p>
              </div>
              <Button size="sm" onClick={() => applySuggestion(suggestion.field, suggestion.value)} className="ml-4">
                Toepassen
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-slate-500">Gebaseerd op AI analyse van uw documenten</span>
          <Button variant="ghost" size="sm" className="text-purple-600">
            <RefreshCw className="h-4 w-4 mr-1" />
            Opnieuw analyseren
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
