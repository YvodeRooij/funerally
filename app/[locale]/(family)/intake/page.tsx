"use client"

import { IntakeWizard } from "@/components/family/intake/intake-wizard"

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Uitvaart Intake Formulier</h1>
          <p className="text-slate-600">
            Help ons u de best mogelijke ondersteuning te bieden door dit formulier in te vullen.
          </p>
        </div>
        <IntakeWizard />
      </div>
    </div>
  )
}
