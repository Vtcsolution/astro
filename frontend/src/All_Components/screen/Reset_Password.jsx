import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export default function Reset_Password() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Image Upload */}


          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Create a New password" className="w-full" />
          </div>

          {/* Submit Button */}
          <Button variant="brand" className="w-full mt-6" size="lg">
            Reset
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
