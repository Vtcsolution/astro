import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, Sun, Zap, Target, Clock, TrendingUp, Home, Briefcase, Heart } from "lucide-react"

// Vedic Chart Component
const VedicChart = () => {
  const houses = Array.from({ length: 12 }, (_, i) => i + 1)
  const planets = [
    { name: "Su", house: 1, symbol: "☉", color: "#FF6B35" },
    { name: "Mo", house: 4, symbol: "☽", color: "#4A90E2" },
    { name: "Ma", house: 7, symbol: "♂", color: "#E74C3C" },
    { name: "Me", house: 2, symbol: "☿", color: "#2ECC71" },
    { name: "Ju", house: 5, symbol: "♃", color: "#F39C12" },
    { name: "Ve", house: 3, symbol: "♀", color: "#9B59B6" },
    { name: "Sa", house: 10, symbol: "♄", color: "#34495E" },
    { name: "Ra", house: 8, symbol: "☊", color: "#8E44AD" },
    { name: "Ke", house: 2, symbol: "☋", color: "#E67E22" },
  ]

  const getHousePosition = (houseNum) => {
    const angle = ((houseNum - 1) * 30 - 90) * (Math.PI / 180)
    const radius = 120
    return {
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle),
    }
  }

  return (
    <div className="relative w-80 h-80 mx-auto">
      <svg width="300" height="300" className="absolute inset-0">
        {/* Outer circle */}
        <circle cx="150" cy="150" r="140" fill="none" stroke="#D4AF37" strokeWidth="3" />

        {/* House divisions */}
        {houses.map((house) => {
          const angle = ((house - 1) * 30 - 90) * (Math.PI / 180)
          const x2 = 150 + 140 * Math.cos(angle)
          const y2 = 150 + 140 * Math.sin(angle)
          return <line key={house} x1="150" y1="150" x2={x2} y2={y2} stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
        })}

        {/* House numbers */}
        {houses.map((house) => {
          const pos = getHousePosition(house)
          return (
            <text
              key={house}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-amber-600 text-sm font-bold"
            >
              {house}
            </text>
          )
        })}

        {/* Planets */}
        {planets.map((planet) => {
          const pos = getHousePosition(planet.house)
          const offset = planets.filter((p) => p.house === planet.house).indexOf(planet) * 15
          return (
            <g key={planet.name}>
              <circle cx={pos.x + offset - 7} cy={pos.y + 20} r="12" fill={planet.color} opacity="0.8" />
              <text
                x={pos.x + offset - 7}
                y={pos.y + 25}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-bold"
              >
                {planet.name}
              </text>
            </g>
          )
        })}

        {/* Center */}
        <circle cx="150" cy="150" r="30" fill="url(#cosmicGradient)" />
        <text x="150" y="150" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
          D1
        </text>

        <defs>
          <radialGradient id="cosmicGradient">
            <stop offset="0%" stopColor="#4A90E2" />
            <stop offset="100%" stopColor="#2C3E50" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

// Nakshatra Panel Component
const NakshatraPanel = () => {
  return (
    <Card className="bg-white">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
          <Star className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-amber-800">Rohini Nakshatra</CardTitle>
        <p className="text-sm text-amber-600">{"The Star of Ascent"}</p>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-2">
          <Badge variant="secondary" className="bg-purple-400 text-white">
            Deity: Brahma
          </Badge>
          <Badge variant="secondary" className="bg-purple-400 text-white">
            Symbol: Ox Cart
          </Badge>
          <p className="text-xs text-amber-700 mt-3">{"Creative, artistic, and materially prosperous nature"}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function VedicAstrologerChart() {
  const dashaProgress = 65 // Jupiter Dasha progress percentage

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-amber-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-pink-300 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black">
            Vedic Astrology Reading
          </h1>
          <p className="text-black">Birth Chart Analysis & Life Guidance</p>
        </div>

        {/* Top Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-white backdrop-blur-sm border-amber-300/30">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Birth Chart (Rasi Chart)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VedicChart />
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <Badge variant="outline" className="border-black text-black">
                      Ascendant: Pisces
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="border-blue-300 text-blue-300">
                      Moon: Cancer
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="border-orange-300 text-orange-300">
                      Sun: Aries
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <NakshatraPanel />
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white backdrop-blur-sm border-purple-300/30">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Target className="w-5 h-5" />
                Personality Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                  <p className="text-black text-sm">
                    <strong>Pisces Ascendant:</strong> Intuitive, creative, and spiritually inclined nature
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                  <p className="text-black text-sm">
                    <strong>Rohini Moon:</strong> Artistic talents, love for beauty and material comforts
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                  <p className="text-black text-sm">
                    <strong>Aries Sun:</strong> Leadership qualities, pioneering spirit, and dynamic energy
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                  <p className="text-black text-sm">
                    <strong>Jupiter in 5th:</strong> Natural teacher, wisdom, and creative intelligence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white backdrop-blur-sm border-pink-300/30">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Life Purpose & Destiny
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-black text-sm leading-relaxed mb-4">
                Your <strong>Rahu in the 10th house</strong> indicates a destiny deeply connected to public leadership
                and career achievement. You are meant to build authority and recognition in your chosen field.
              </p>
              <p className="text-black text-sm leading-relaxed mb-4">
                With <strong>Ketu in the 4th house</strong>, you have natural detachment from material comforts, pushing
                you toward spiritual growth and higher learning.
              </p>
              <div className="bg-purple-600 p-3 rounded-lg">
                <p className="text-pink-100 text-xs font-medium">
                  💫 Key Focus: Balance material success with spiritual evolution
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white backdrop-blur-sm border-yellow-300/30">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Maha Dasha Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-black font-medium">Jupiter Dasha</span>
                    <span className="text-black text-sm">2020 - 2036</span>
                  </div>
                  <Progress value={dashaProgress} className="h-3 bg-white border border-gray-200" />
                  <p className="text-black text-xs mt-2">
                    Current period brings wisdom, teaching opportunities, and spiritual growth
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-purple-600 p-3 rounded-lg">
                    <p className="text-white text-xs font-medium">Previous</p>
                    <p className="text-white text-sm">Saturn (2004-2020)</p>
                  </div>
                  <div className="bg-purple-600 p-3 rounded-lg">
                    <p className="text-white text-xs font-medium">Next</p>
                    <p className="text-white text-sm">Mercury (2036-2053)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white backdrop-blur-sm border-cyan-300/30">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Current Transits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded-lg">
                  <Home className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-white text-sm font-medium">Saturn → 4th House</p>
                    <p className="text-white text-xs">Focus on home, family, and emotional foundations</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-white text-sm font-medium">Jupiter → 7th House</p>
                    <p className="text-white text-xs">Partnerships and relationships are highlighted</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded-lg">
                  <Heart className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-white text-sm font-medium">Venus → 2nd House</p>
                    <p className="text-white text-xs">Financial growth and value-based decisions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-black text-sm">
          <p>✨ Generated with cosmic wisdom and Vedic calculations ✨</p>
        </div>
      </div>
    </div>
  )
}
