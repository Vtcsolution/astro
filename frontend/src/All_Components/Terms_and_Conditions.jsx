import { ScrollText, Users, CreditCard, RotateCcw, AlertTriangle, Shield, Copyright } from "lucide-react"

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <ScrollText className="mx-auto h-12 w-12 text-purple-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-lg text-gray-600">SpiritueelChatten - Simple and Clear</p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-12">
            {/* Section 1: User Responsibilities */}
            <section>
              <div className="flex items-center mb-6">
                <Users className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. User Responsibilities</h2>
              </div>
              <p className="text-gray-700 mb-4">By using SpiritueelChatten, you agree to:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Provide accurate and truthful information for personalized spiritual analysis.
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Respect the platform's AI guides and community standards.
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Avoid misuse of services for unethical or illegal purposes.
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Ensure that your access credentials are kept confidential.
                </li>
              </ul>
              <p className="text-gray-700 mt-4 font-medium">
                You are solely responsible for any insights or decisions made based on the AI coaches' guidance.
              </p>
            </section>

            {/* Section 2: Payment Terms */}
            <section>
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Payment Terms</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>SpiritueelChatten operates on a credits-based and/or subscription model.</p>
                <p>
                  Users may purchase credits to access specific readings (e.g.,{" "}
                  <span className="font-semibold">€1.75/min for chat</span>) or subscribe to monthly plans for premium
                  features.
                </p>
                <p>Prices are clearly displayed before checkout and may vary by service or coach type.</p>
              </div>
            </section>

            {/* Section 3: Refund Policy */}
            <section>
              <div className="flex items-center mb-6">
                <RotateCcw className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">3. Refund Policy</h2>
              </div>
              <p className="text-gray-700 mb-4">Due to the digital and instant nature of the services:</p>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold">All sales are final.</span> Refunds will not be provided for completed
                  AI sessions.
                </p>
                <p>
                  If you experience technical issues (e.g., system errors, failure to receive your reading), please
                  contact support within 24 hours to request review or compensation.
                </p>
              </div>
            </section>

            {/* Section 4: Disclaimer */}
            <section>
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">4. Disclaimer on AI-Generated Advice</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  SpiritueelChatten's insights are AI-generated based on user inputs and spiritual traditions
                  (astrology, tarot, numerology).
                </p>
                <p>
                  <span className="font-semibold">
                    These insights are not a substitute for professional legal, medical, psychological, or financial
                    advice.
                  </span>
                </p>
                <p>Users must use their own judgment when interpreting the readings.</p>
                <p>The platform is for entertainment and spiritual exploration purposes only.</p>
              </div>
            </section>

            {/* Section 5: Privacy & Data Usage */}
            <section>
              <div className="flex items-center mb-6">
                <Shield className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">5. Privacy & Data Usage</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  We value your privacy. All personal data (name, DOB, birth time, etc.) is stored securely and only
                  used to enhance your experience.
                </p>
                <p>We never sell or share your data with third parties without consent.</p>
                <p>
                  For more details, view our full{" "}
                  <a href="#" className="text-purple-600 hover:text-purple-700 underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* Section 6: Intellectual Property */}
            <section>
              <div className="flex items-center mb-6">
                <Copyright className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">6. Intellectual Property Rights</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  All platform content, UI design, logos, AI coach personas (KRS, Arkana, Numeron, Amoura), and insights
                  are copyrighted and trademarked under SpiritueelChatten.
                </p>
                <p>You may not reproduce, copy, modify, or distribute platform materials without written permission.</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-2">© 2024 SpiritueelChatten. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
