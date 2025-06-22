import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function TestCSSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8 animate-fade-in">
          Tailwind CSS Test Page
        </h1>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Testing Tailwind CSS</CardTitle>
            <CardDescription>
              If you can see styled elements below, CSS is working correctly!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <div className="text-purple-600 font-semibold">Purple Box</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <div className="text-blue-600 font-semibold">Blue Box</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <div className="text-green-600 font-semibold">Green Box</div>
              </div>
            </div>
            
            <div className="flex gap-4 flex-wrap">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
            
            <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-6 rounded-lg shadow-md">
              <p className="text-lg font-medium">
                Gradient Background with Shadow
              </p>
            </div>
            
            <div className="glass-morphism p-6 rounded-lg">
              <p className="text-gray-700">
                Glass Morphism Effect (from globals.css)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}