import { Instagram, Facebook, Youtube } from "lucide-react"
import { Link } from "react-router-dom"
// Custom TikTok icon since it's not available in Lucide
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z" />
  </svg>
)

export default function ModernFooter() {
  return (
    <footer className="bg-gray-100 py-12 px-4">
      <div className="max-w-4xl grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mx-auto text-center space-y-8">
        {/* Social Media Icons */}
        <div className="flex justify-center items-center gap-6">
          <Link
            to="https://instagram.com"
            className="text-black hover:text-gray-600 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </Link>
          <Link
            to="https://facebook.com"
            className="text-black hover:text-gray-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </Link>
          <Link
            to="https://tiktok.com"
            className="text-black hover:text-gray-600 transition-colors"
            aria-label="TikTok"
          >
            <TikTokIcon/>
          </Link>
          <Link
            to="https://youtube.com"
            className="text-red-600 hover:text-red-700 transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="w-4 h-4" />
          </Link>
        </div>

          <p className="text-sm font-medium">KvK-nummer: xxxxxxxxx</p>
          <p className="text-sm font-medium">BTW nr: xxxxxxxxxxxx</p>

          <p className="text-gray-600 text-sm">Copyright © 2025 Spiritueelchatten</p>
      </div>
    </footer>
  )
}
