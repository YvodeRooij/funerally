import { IntakeWizard } from "@/components/intake/intake-wizard"

export default function StartPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Laten we samen beginnen</h1>
          <p className="text-lg text-slate-600">
            We nemen alle tijd die u nodig heeft. U kunt altijd pauzeren en later verder gaan.
          </p>
        </div>

        <IntakeWizard />
      </div>
    </div>
  )
}
