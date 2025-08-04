import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Heart, Flame, MessageSquare, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/All_Components/screen/AuthContext";

const AstrologyReport = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState(location.state?.astrologyReport || null);
  const [showModal, setShowModal] = useState(!!location.state?.astrologyReport);

  useEffect(() => {
    if (!report && user) {
      const fetchReport = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/astrology-report`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.success) {
            setReport(data.data);
            setShowModal(true);
          } else {
            toast.error("Failed to load astrology report");
          }
        } catch (error) {
          toast.error("Error fetching astrology report");
        }
      };
      fetchReport();
    }
  }, [user, report]);

  const renderSummary = () => {
    if (!report || !report.chart || !report.numerology) return null;
    const { chart, numerology } = report;
    return (
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-indigo-900 mb-4">
          Your Cosmic Snapshot 🌟
        </h2>
        <p className="text-gray-700 text-center mb-6">
          Here's a glimpse of your astrological and numerological journey:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">Sun in {chart.sun.sign} (House {chart.sun.house})</h3>
              <p className="text-gray-600 text-sm">
                Your core identity shines with compassion and transformation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold">Moon in {chart.moon.sign} (House {chart.moon.house})</h3>
              <p className="text-gray-600 text-sm">
                Your emotions nurture through friendships and community.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flame className="h-6 w-6 text-orange-500" />
            <div>
              <h3 className="font-semibold">Venus in {chart.venus.sign} (House {chart.venus.house})</h3>
              <p className="text-gray-600 text-sm">
                Your love is bold and transformative.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flame className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold">Mars in {chart.mars.sign} (House {chart.mars.house})</h3>
              <p className="text-gray-600 text-sm">
                Your drive is adventurous, rooted in home.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-semibold">Mercury in {chart.mercury.sign} (House {chart.mercury.house})</h3>
              <p className="text-gray-600 text-sm">
                Your communication flows intuitively in partnerships.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Globe className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-semibold">Jupiter in {chart.jupiter.sign} (House {chart.jupiter.house})</h3>
              <p className="text-gray-600 text-sm">
                Your growth expands through compassionate relationships.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-gray-500" />
            <div>
              <h3 className="font-semibold">Saturn in {chart.saturn.sign} (House {chart.saturn.house})</h3>
              <p className="text-gray-600 text-sm">
                Your discipline builds stability at home.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">Life Path {numerology.lifePath.number}</h3>
              <p className="text-gray-600 text-sm">
                Your journey is one of leadership and independence.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold">Heart’s Desire {numerology.heart.number}</h3>
              <p className="text-gray-600 text-sm">
                Your heart seeks emotional depth and truth.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flame className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-semibold">Expression {numerology.expression.number}</h3>
              <p className="text-gray-600 text-sm">
                Your voice inspires with visionary insight.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-semibold">Personality {numerology.personality.number}</h3>
              <p className="text-gray-600 text-sm">
                You appear reliable and disciplined to others.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-indigo-900 sm:text-5xl">
            Your Cosmic Blueprint
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover the celestial energies that shape your life’s journey. 🌌
          </p>
          <Badge className="mt-4 bg-indigo-500 text-white">Personalized Astrology Report</Badge>
        </div>

        {/* Summary Section */}
        {renderSummary()}

        {/* Detailed Report */}
        {report && report.chart && report.numerology && (
          <Card className="mt-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-indigo-900">
                Your Cosmic Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {report.narrative}
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" /> Sun in {report.chart.sun.sign} (House {report.chart.sun.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.sun.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" /> Moon in {report.chart.moon.sign} (House {report.chart.moon.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.moon.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" /> Venus in {report.chart.venus.sign} (House {report.chart.venus.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.venus.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" /> Mars in {report.chart.mars.sign} (House {report.chart.mars.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.mars.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" /> Mercury in {report.chart.mercury.sign} (House {report.chart.mercury.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.mercury.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" /> Jupiter in {report.chart.jupiter.sign} (House {report.chart.jupiter.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.jupiter.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-500" /> Saturn in {report.chart.saturn.sign} (House {report.chart.saturn.house})
                  </h3>
                  <p className="text-gray-600">{report.chart.saturn.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" /> Life Path Number: {report.numerology.lifePath.number}
                  </h3>
                  <p className="text-gray-600">{report.numerology.lifePath.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" /> Heart’s Desire Number: {report.numerology.heart.number}
                  </h3>
                  <p className="text-gray-600">{report.numerology.heart.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-blue-500" /> Expression Number: {report.numerology.expression.number}
                  </h3>
                  <p className="text-gray-600">{report.numerology.expression.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" /> Personality Number: {report.numerology.personality.number}
                  </h3>
                  <p className="text-gray-600">{report.numerology.personality.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4">
            Ready to Explore More?
          </h2>
          <p className="text-gray-600 mb-6">
            Connect with a coach to dive deeper into your cosmic journey or unlock additional insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="brand"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => navigate("/chat/free")}
            >
              Start Your Free 1-Minute Chat
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate("/numerology-report")}
            >
              Unlock Numerology Report (Free)
            </Button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default AstrologyReport;