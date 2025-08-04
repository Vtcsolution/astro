
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/All_Components/screen/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

const MonthlyForecast = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [forecast, setForecast] = useState(location.state?.monthlyForecastReport || null);
  const [historicalReports, setHistoricalReports] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState({
    overview: true, // Open by default for better UX
    career: false,
    relationships: false,
    personalGrowth: false,
    challenges: false,
    sun: false,
    moon: false,
    ascendant: false,
  });

  // Check user authentication and birth details
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to view your monthly forecast");
      navigate("/login");
      return;
    }
    if (!user.dob || !user.birthTime || !user.birthPlace) {
      toast.error("Please update your profile with date of birth, birth time, and birth place to unlock your cosmic forecast");
      navigate("/profile");
      return;
    }
    if (!forecast) {
      setShowConfirmModal(true);
    }
  }, [user, navigate, forecast]);

  // Fetch user credits
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("Authentication token missing. Please log in again.");
          navigate("/login");
          return;
        }
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserCredits(response.data.credits || 0);
      } catch (error) {
        console.error("Failed to fetch user credits:", error);
        
      }
    };
    fetchUserCredits();
  }, [user, navigate]);

  // Fetch historical reports
  useEffect(() => {
    const fetchHistoricalReports = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("Authentication token missing. Please log in again.");
          navigate("/login");
          return;
        }
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/monthly-forecasts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setHistoricalReports(response.data.data);
          if (!forecast && response.data.data.length > 0) {
            setForecast(response.data.data[0]);
          }
        } else {
          toast.error(response.data.message || "Failed to fetch your past forecasts");
        }
      } catch (error) {
        console.error("Error fetching historical reports:", error);
        toast.error(error.response?.data?.message || "An error occurred while fetching your past forecasts");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistoricalReports();
  }, [user, navigate, forecast]);

  // Handle forecast unlock
  const confirmForecastUnlock = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        navigate("/login");
        return;
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/monthly-forecast`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setForecast(response.data.data);
        setUserCredits(response.data.credits);
        setShowSuccessMessage(true);
        toast.success("Your cosmic forecast is unlocked! 🌟");
        setHistoricalReports((prev) => [response.data.data, ...prev]);
      } else {
        if (response.data.message === "Insufficient credits") {
          setShowPaymentModal(true);
        } else {
          toast.error(response.data.message || "Failed to unlock your cosmic forecast");
        }
      }
    } catch (error) {
      console.error("Error generating monthly forecast:", error);
      if (error.response?.data?.message === "Insufficient credits") {
        setShowPaymentModal(true);
      } else if (error.response?.data?.message.includes("Invalid birth place")) {
        toast.error("Invalid birth place provided. Please update your profile with a valid city (e.g., Lahore, Pakistan).");
        navigate("/profile");
      } else {
        toast.error(error.response?.data?.message || "An error occurred while unlocking your cosmic forecast");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment redirect
  const handlePaymentRedirect = () => {
    setShowPaymentModal(false);
    navigate("/payment");
  };

  // Toggle collapsible sections
  const toggleCollapsible = (section) => {
    setOpenCollapsible((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Render forecast
  const renderForecast = () => {
    if (!forecast) return null;
    const { narrative, chart, forecast: forecastDetails, predictionMonth, predictionYear } = forecast;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const defaultMessage = "The stars are still aligning for this section. Chat with a coach for deeper insights! 🌟";
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        {showSuccessMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <p className="font-semibold">Success!</p>
            <p>Your cosmic forecast for {monthNames[predictionMonth - 1]} {predictionYear} is unlocked!</p>
          </div>
        )}
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">
          Your Cosmic Forecast for {monthNames[predictionMonth - 1]} {predictionYear} ✨
        </h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none bg-gray-50 p-6 rounded-md dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Monthly Journey</h3>
              <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{narrative || defaultMessage}</p>
            </div>
            <div className="space-y-4">
              <Collapsible open={openCollapsible.overview} onOpenChange={() => toggleCollapsible("overview")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Overview 🌌</h3>
                  {openCollapsible.overview ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {forecastDetails.overview || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.career} onOpenChange={() => toggleCollapsible("career")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Career & Purpose 💼</h3>
                  {openCollapsible.career ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {forecastDetails.career || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.relationships} onOpenChange={() => toggleCollapsible("relationships")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Relationships & Connections 💞</h3>
                  {openCollapsible.relationships ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {forecastDetails.relationships || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.personalGrowth} onOpenChange={() => toggleCollapsible("personalGrowth")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Growth & Spirituality 🌱</h3>
                  {openCollapsible.personalGrowth ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {forecastDetails.personalGrowth || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.challenges} onOpenChange={() => toggleCollapsible("challenges")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Challenges & Practical Advice ⚖️</h3>
                  {openCollapsible.challenges ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {forecastDetails.challenges || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.sun} onOpenChange={() => toggleCollapsible("sun")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Sun Sign: {chart.sun.sign} ☀️</h3>
                  {openCollapsible.sun ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {chart.sun.description || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.moon} onOpenChange={() => toggleCollapsible("moon")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Moon Sign: {chart.moon.sign} 🌙</h3>
                  {openCollapsible.moon ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {chart.moon.description || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={openCollapsible.ascendant} onOpenChange={() => toggleCollapsible("ascendant")}>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-blue-50 rounded-md dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Ascendant: {chart.ascendant.sign} 🌟</h3>
                  {openCollapsible.ascendant ? (
                    <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 text-gray-600 dark:text-gray-400">
                  {chart.ascendant.description || defaultMessage}
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={() => {
                  setForecast(null);
                  setShowSuccessMessage(false);
                  setShowConfirmModal(true);
                }}
                variant="brand"
                className="w-full sm:flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Unlock New Cosmic Forecast (5 Credits)
              </Button>
              <Button
                onClick={() => navigate("/chat/free")}
                variant="brand"
                className="w-full sm:flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white"
              >
                Start Your Free 1-Minute Chat – Choose Your Coach Now
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render historical reports
  const renderHistoricalReports = () => {
    if (historicalReports.length === 0) return null;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return (
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Past Cosmic Forecasts 🌌</h2>
        <div className="space-y-4">
          {historicalReports.map((report) => (
            <Button
              key={report._id}
              onClick={() => setForecast(report)}
              variant="outline"
              className="w-full text-left justify-start p-4 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {monthNames[report.predictionMonth - 1]} {report.predictionYear}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-slate-900 dark:to-slate-800 py-12">
      {isLoading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : forecast ? (
        renderForecast()
      ) : (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Unlock your personalized cosmic forecast for this month...</p>
          <Button
            onClick={() => setShowConfirmModal(true)}
            variant="brand"
            className="mt-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Unlock Your Cosmic Forecast – 5 Credits ✨
          </Button>
        </div>
      )}
      {renderHistoricalReports()}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Your Cosmic Forecast</DialogTitle>
            <DialogDescription>
              Discover what the stars have in store for you! Unlocking your Monthly Astrological Forecast costs 5 credits. Your current balance is {userCredits} credits. Ready to explore your cosmic path?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmForecastUnlock}
              variant="brand"
              className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Need More Cosmic Credits</DialogTitle>
            <DialogDescription>
              You need 5 credits to unlock your Monthly Astrological Forecast, but your balance is {userCredits} credits. Add more credits to dive into your cosmic journey!
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentRedirect}
              variant="brand"
              className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyForecast;
