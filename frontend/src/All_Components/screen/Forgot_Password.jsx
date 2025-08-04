import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, User } from "lucide-react"
import { Link } from "react-router-dom"

export default function Forgot_Password() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">Enter your Email </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Image Upload */}


          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" className="w-full" />
          </div>

          {/* Submit Button */}
          <Button variant="brand" className="w-full mt-6" size="lg">
            Forgot
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
