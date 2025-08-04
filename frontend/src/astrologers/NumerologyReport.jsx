import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Heart, User, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/All_Components/screen/AuthContext";

const NumerologyReport = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState(location.state?.numerologyReport || null);
  const [showModal, setShowModal] = useState(!!location.state?.numerologyReport);

  useEffect(() => {
    if (!report && user) {
      const fetchReport = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/numerology-report`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.success) {
            setReport(data.data);
            setShowModal(true);
          } else {
            toast.error("Failed to load numerology report");
          }
        } catch (error) {
          toast.error("Error fetching numerology report");
        }
      };
      fetchReport();
    }
  }, [user, report]);

  const renderSummary = () => {
    if (!report || !report.numbers) return null;
    const { numbers } = report;
    return (
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-indigo-900 mb-4">
          Your Numerology Snapshot 🌟
        </h2>
        <p className="text-gray-700 text-center mb-6">
          Here's a quick look at the essence of your numerological journey:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">Life Path {numbers.lifepath.number}</h3>
              <p className="text-gray-600 text-sm">
                Your soul’s purpose is to inspire and uplift others with your compassionate vision.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-semibold">Expression {numbers.expression.number}</h3>
              <p className="text-gray-600 text-sm">
                You build your dreams with dedication, creating stability and purpose.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold">Heart’s Desire {numbers.soulurge.number}</h3>
              <p className="text-gray-600 text-sm">
                Your heart craves leadership and independence, driving you to blaze new trails.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-semibold">Personality {numbers.personality.number}</h3>
              <p className="text-gray-600 text-sm">
                Others see you as vibrant and creative, a joyful presence in any room.
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
            Your Numerology Blueprint
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover the unique energies that shape your life’s journey. 🌈
          </p>
          <Badge className="mt-4 bg-indigo-500 text-white">Personalized Report</Badge>
        </div>

        {/* Summary Section */}
        {renderSummary()}

        {/* Detailed Report */}
        {report && report.numbers && (
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
                    <Sparkles className="h-5 w-5 text-yellow-500" /> Life Path Number: {report.numbers.lifepath.number}
                  </h3>
                  <p className="text-gray-600">{report.numbers.lifepath.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-blue-500" /> Expression Number: {report.numbers.expression.number}
                  </h3>
                  <p className="text-gray-600">{report.numbers.expression.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" /> Heart’s Desire Number: {report.numbers.soulurge.number}
                  </h3>
                  <p className="text-gray-600">{report.numbers.soulurge.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-green-500" /> Personality Number: {report.numbers.personality.number}
                  </h3>
                  <p className="text-gray-600">{report.numbers.personality.description}</p>
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
            Connect with a coach to dive deeper into your spiritual journey or unlock additional insights.
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
              onClick={() => navigate("/astrology-report")}
            >
              Unlock Astrology Report (5 Credits)
            </Button>
          </div>
        </div>
      </div>

      {/* Modal for Initial Report Display */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-indigo-900">
              Your Numerology Blueprint
            </DialogTitle>
          </DialogHeader>
          {renderSummary()}
          <Button
            variant="brand"
            className="mt-6 w-full rounded-full"
            onClick={() => setShowModal(false)}
          >
            Explore Full Report
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NumerologyReport;