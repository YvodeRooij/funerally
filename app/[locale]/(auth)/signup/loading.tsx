import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Flower2 } from "lucide-react"

export default function SignUpLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Flower2 className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User type selection skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Form fields skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}

          {/* Submit button skeleton */}
          <Skeleton className="h-10 w-full" />

          {/* Links skeleton */}
          <div className="text-center pt-4 border-t border-slate-200 space-y-3">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-3 w-40 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}