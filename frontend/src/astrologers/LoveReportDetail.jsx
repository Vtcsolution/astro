import { useEffect, useState } from "react";
import { useAuth } from "@/All_Components/screen/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";

const LoveReportDetail = () => {
  const { user } = useAuth();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch report by ID
  useEffect(() => {
    const fetchReport = async () => {
      if (!user) {
        toast.error("Please log in to view your report.");
        navigate("/login");
        return;
      }
      setIsLoading(true);
      setErrorMessage("");
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/love-compatibility-report/${reportId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setReport(response.data.data);
        } else {
          toast.error(response.data.message || "Failed to fetch report details.");
          setErrorMessage(response.data.message || "Failed to fetch report details.");
        }
      } catch (error) {
        console.error("Failed to fetch report:", error);
        const message = error.response?.data?.message || "An error occurred while fetching the report.";
        toast.error(message);
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [user, reportId, navigate]);

  // Render the detailed report
  const renderReport = () => {
    if (!report) return null;

    const { narrative, chart, yourName, partnerName, createdAt } = report;
    const planets = ["sun", "moon", "venus", "mars", "mercury", "jupiter", "saturn"];

    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-200 dark:border-blue-900 animate-fade-in">
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-sm">
            <p className="font-semibold text-lg">Error</p>
            <p>{errorMessage}</p>
          </div>
        )}
        <h1 className="text-4xl font-sans font-bold text-center text-gray-900 dark:text-white mb-8">
          Love Compatibility Report – {yourName} & {partnerName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Generated on {new Date(createdAt).toLocaleDateString()}
        </p>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-lg shadow-sm mb-8">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                This report explores the love compatibility between {yourName} and {partnerName} based on their Vedic birth charts. Each planetary placement has been analyzed by sign and house, followed by a combined summary of their energetic interaction in a romantic context.
              </p>
            </div>
            <div className="space-y-8">
              <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white">Planetary Placements & Interpretation</h2>
              {planets.map((planet) => (
                <div key={planet} className="bg-white dark:bg-slate-950 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 animate-fade-in-up">
                  <h3 className="text-xl font-sans font-medium text-blue-700 dark:text-blue-300 capitalize mb-4">{planet}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-semibold">{yourName}:</strong> {chart.user[planet].sign} in the {chart.user[planet].house} – {chart.user[planet].description}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-semibold">{partnerName}:</strong> {chart.partner[planet].sign} in the {chart.partner[planet].house} – {chart.partner[planet].description}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="font-semibold">Combined Influence:</strong> {chart.user[planet].combined}
                  </p>
                </div>
              ))}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 animate-fade-in-up">
                <h3 className="text-xl font-sans font-medium text-blue-700 dark:text-blue-300 capitalize mb-4">Ascendant</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong className="font-semibold">{yourName}:</strong> {chart.user.ascendant.sign} – {chart.user.ascendant.description}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong className="font-semibold">{partnerName}:</strong> {chart.partner.ascendant.sign} – {chart.partner.ascendant.description}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-lg shadow-sm mt-8">
              <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">Compatibility Summary</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">{narrative}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button
                onClick={() => navigate("/love-reports")}
                variant="brand"
                className="w-full sm:flex-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg py-3 shadow-md transition-all duration-300"
              >
                Back to Reports
              </Button>
              <Button
                onClick={() => navigate("/chat/free")}
                variant="brand"
                className="w-full sm:flex-1 rounded-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-lg py-3 shadow-md transition-all duration-300"
              >
                Chat 1 Minute Free with a Coach
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-slate-950 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      {report ? renderReport() : (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl dark:bg-slate-950 border border-blue-200 dark:border-blue-900">
          <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">Report Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The requested report could not be found or you do not have access to it. <a href="/reports" className="text-blue-600 dark:text-blue-400 hover:underline">View all reports</a>.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoveReportDetail;