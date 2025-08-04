import { useEffect, useState } from "react";
import { useAuth } from "@/All_Components/screen/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parse, isValid, isBefore, isLeapYear } from "date-fns";
import LoadingSpinner from "./LoadingSpinner";

const LoveCompatibility = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    yourName: "",
    yourBirthDate: "",
    yourBirthTime: "",
    yourBirthPlace: "",
    partnerName: "",
    partnerBirthDate: "",
    partnerBirthTime: "",
    partnerPlaceOfBirth: "",
  });
  const [compatibility, setCompatibility] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        yourName: user.username || "",
        yourBirthDate: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        yourBirthTime: user.birthTime || "",
        yourBirthPlace: user.birthPlace || "",
      }));
      if (!user.dob || !user.birthTime || !user.birthPlace) {
        toast.warning("Please complete your profile with birth details for accurate results.");
      }
    } else {
      toast.error("Please log in to unlock your love compatibility report.");
    }
  }, [user]);

  // Fetch user credits and saved reports
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserCredits(response.data.credits || 0);
      } catch (error) {
        console.error("Failed to fetch user credits:", error);
        toast.error("Failed to fetch wallet balance.");
      }
    };

    const fetchSavedReports = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/love-compatibility-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setSavedReports(response.data.data);
        } else {
          toast.error("Failed to fetch saved reports.");
        }
      } catch (error) {
        console.error("Failed to fetch saved reports:", error);
        toast.error("Failed to fetch saved reports.");
      }
    };

    fetchUserCredits();
    fetchSavedReports();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validate name fields
    if (name.includes("Name")) {
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (value && !nameRegex.test(value)) {
        toast.error(`${name.includes("your") ? "Your" : "Partner's"} Name must contain only letters and spaces.`);
        return;
      }
    }

    // Validate date fields
    if (name.includes("BirthDate")) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (value && !dateRegex.test(value)) {
        toast.error(`Invalid date format for ${name.includes("your") ? "Your" : "Partner's"} Birth Date. Use YYYY-MM-DD.`);
        return;
      }
      const date = parse(value, "yyyy-MM-dd", new Date());
      if (value && (!isValid(date) || !isBefore(date, new Date()))) {
        toast.error(`${name.includes("your") ? "Your" : "Partner's"} Birth Date must be in the past.`);
        return;
      }
      const [year, month, day] = value.split("-").map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth || (month === 2 && day === 29 && !isLeapYear(year))) {
        toast.error(`Invalid day for ${name.includes("your") ? "Your" : "Partner's"} Birth Date. Check leap year or days in month.`);
        return;
      }
    }

    // Validate time fields
    if (name.includes("BirthTime")) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (value && !timeRegex.test(value)) {
        toast.error(`Invalid time format for ${name.includes("your") ? "Your" : "Partner's"} Birth Time. Use HH:MM (24-hour).`);
        return;
      }
    }

    // Validate birth place
    if (name.includes("BirthPlace")) {
      if (value && !value.includes(",")) {
        toast.warning(`Please include city and country for ${name.includes("your") ? "Your" : "Partner's"} Birth Place (e.g., 'Amsterdam, Netherlands').`);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  };

  const handleSubmit = async () => {
    try {
      const requiredFields = [
        { field: "yourName", label: "Your Name" },
        { field: "yourBirthDate", label: "Your Birth Date" },
        { field: "yourBirthTime", label: "Your Birth Time" },
        { field: "yourBirthPlace", label: "Your Birth Place" },
        { field: "partnerName", label: "Partner's Name" },
        { field: "partnerBirthDate", label: "Partner's Birth Date" },
        { field: "partnerBirthTime", label: "Partner's Birth Time" },
        { field: "partnerPlaceOfBirth", label: "Partner's Birth Place" },
      ];

      const missingFields = requiredFields.filter(({ field }) => !formData[field]?.trim());
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.map((f) => f.label).join(", ")}`);
        return;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.yourBirthDate) || !dateRegex.test(formData.partnerBirthDate)) {
        toast.error("Invalid birth date format. Please use YYYY-MM-DD.");
        return;
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(formData.yourBirthTime) || !timeRegex.test(formData.partnerBirthTime)) {
        toast.error("Invalid time format. Please use HH:MM (24-hour).");
        return;
      }

      const userDate = parse(formData.yourBirthDate, "yyyy-MM-dd", new Date());
      const partnerDate = parse(formData.partnerBirthDate, "yyyy-MM-dd", new Date());
      const currentDate = new Date();

      if (!isValid(userDate) || !isValid(partnerDate)) {
        toast.error("Invalid birth dates. Please ensure the dates are valid.");
        return;
      }

      if (!isBefore(userDate, currentDate) || !isBefore(partnerDate, currentDate)) {
        toast.error("Birth dates must be strictly in the past.");
        return;
      }

      if (userDate.getFullYear() < 1900 || partnerDate.getFullYear() < 1900) {
        toast.error("Birth years must be 1900 or later.");
        return;
      }

      const [userHour, userMin] = formData.yourBirthTime.split(":").map(Number);
      const [partnerHour, partnerMin] = formData.partnerBirthTime.split(":").map(Number);
      if (userMin > 59 || partnerMin > 59 || userHour > 23 || partnerHour > 23) {
        toast.error("Invalid time values. Hours must be 0-23 and minutes 0-59.");
        return;
      }

      setShowConfirmModal(true);
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("An unexpected error occurred during validation. Please try again.");
    }
  };

  const confirmCompatibilityUnlock = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/love-compatibility`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setCompatibility(response.data.data);
        setUserCredits(response.data.credits);
        setShowSuccessMessage(true);
        // Refresh saved reports
        const reportsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/love-compatibility-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reportsResponse.data.success) {
          setSavedReports(reportsResponse.data.data);
        }
        toast.success("Love compatibility report unlocked and saved successfully!");
      } else {
        if (response.data.message.includes("Insufficient credits")) {
          setShowPaymentModal(true);
        } else {
          setErrorMessage(response.data.message);
          toast.error(response.data.message || "Failed to generate love compatibility report.");
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || "An error occurred while generating the love compatibility report.";
      setErrorMessage(message);
      if (message.includes("Insufficient credits")) {
        setShowPaymentModal(true);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCompatibility = () => {
    if (!compatibility && savedReports.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl dark:bg-slate-950 border border-blue-200 dark:border-blue-900">
          <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">No Reports Available</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You haven't generated any love compatibility reports yet. Fill out the form above to unlock your first report!
          </p>
        </div>
      );
    }

    if (!compatibility) {
      return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl dark:bg-slate-950 border border-blue-200 dark:border-blue-900">
          <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">Your Saved Love Compatibility Reports</h2>
          <div className="space-y-4">
            {savedReports.map((report, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
                onClick={() => setCompatibility({ narrative: report.narrative, chart: report.chart })}
              >
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{report.yourName} & {report.partnerName}</strong> – Generated on{" "}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              onClick={() => setCompatibility(null)}
              variant="brand"
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg py-3 px-6 shadow-md transition-all duration-300"
            >
              Generate New Report
            </Button>
          </div>
        </div>
      );
    }

    const { narrative, chart, partialDataWarning } = compatibility;
    const planets = ["sun", "moon", "venus", "mars", "mercury", "jupiter", "saturn"];

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-slate-950 dark:to-slate-800 py-12">
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-200 dark:border-blue-900 animate-fade-in">
          {showSuccessMessage && (
            <div className="bg-green-50 border-l-4 border-green-600 text-green-800 p-4 mb-8 rounded-lg shadow-sm">
              <p className="font-semibold text-lg">Success!</p>
              <p>Your Love Compatibility Report has been unlocked.</p>
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-sm">
              <p className="font-semibold text-lg">Error</p>
              <p>{errorMessage}</p>
              <p>
                Please verify your birth details (date: {formData.yourBirthDate}, time: {formData.yourBirthTime}, place: {formData.yourBirthPlace}) and partner's details (date: {formData.partnerBirthDate}, time: {formData.partnerBirthTime}, place: {formData.partnerPlaceOfBirth}). Try a different date (e.g., 1992-07-10) or time if the issue persists, or contact Astrology API support with error code: HOUSE_CUSPS_ERROR.
              </p>
            </div>
          )}
          {partialDataWarning && (
            <div className="bg-yellow-50 border-l-4 border-yellow-600 text-yellow-800 p-4 mb-8 rounded-lg shadow-sm">
              <p className="font-semibold text-lg">Partial Data Warning</p>
              <p>{partialDataWarning}</p>
            </div>
          )}
          <h1 className="text-4xl font-sans font-bold text-center text-gray-900 dark:text-white mb-8">
            Love Compatibility Report – {formData.yourName} & {formData.partnerName}
          </h1>
          {isSubmitting ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-lg shadow-sm mb-8">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  This report explores the love compatibility between {formData.yourName} and {formData.partnerName} based on their Vedic birth charts. Each planetary placement has been analyzed by sign and house, followed by a combined summary of their energetic interaction in a romantic context.
                </p>
              </div>
              <div className="space-y-8">
                <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white">Planetary Placements & Interpretation</h2>
                {planets.map((planet) => (
                  <div key={planet} className="bg-white dark:bg-slate-950 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 animate-fade-in-up">
                    <h3 className="text-xl font-sans font-medium text-blue-700 dark:text-blue-300 capitalize mb-4">{planet}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      <strong className="font-semibold">{formData.yourName}:</strong> {chart.user[planet].sign} in the {chart.user[planet].house} – {chart.user[planet].description}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      <strong className="font-semibold">{formData.partnerName}:</strong> {chart.partner[planet].sign} in the {chart.partner[planet].house} – {chart.partner[planet].description}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong className="font-semibold">Combined Influence:</strong> {chart.user[planet].combined}
                    </p>
                  </div>
                ))}
               
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-lg shadow-sm mt-8">
                <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">Compatibility Summary</h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">{narrative}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button
                  onClick={() => {
                    setCompatibility(null);
                    setShowSuccessMessage(false);
                    setErrorMessage("");
                  }}
                  variant="brand"
                  className="w-full sm:flex-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg py-3 shadow-md transition-all duration-300"
                >
                  View Saved Reports or Generate New (10 Credits)
                </Button>
                <Button
                  onClick={() => window.location.href = "/chat/free"}
                  variant="brand"
                  className="w-full sm:flex-1 rounded-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-lg py-3 shadow-md transition-all duration-300"
                >
                  Chat 1 Minute Free with a Coach
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-slate-900 dark:to-slate-800 py-12">
      {!compatibility ? (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl dark:bg-slate-950 border border-blue-200 dark:border-blue-900">
          <h1 className="text-4xl font-sans font-bold text-center text-gray-900 dark:text-white mb-8">
            Unlock Your Love Compatibility Report
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-center mb-4">
            Enter your details and your partner's to generate a new report. You can also view your previously generated reports below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">Your Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="yourName" className="text-gray-700 dark:text-gray-300">Your Name</Label>
                  <Input
                    id="yourName"
                    name="yourName"
                    value={formData.yourName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="yourBirthDate" className="text-gray-700 dark:text-gray-300">Your Birth Date</Label>
                  <Input
                    id="yourBirthDate"
                    name="yourBirthDate"
                    type="date"
                    value={formData.yourBirthDate}
                    onChange={handleInputChange}
                    max={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="yourBirthTime" className="text-gray-700 dark:text-gray-300">Your Birth Time (24-hour)</Label>
                  <Input
                    id="yourBirthTime"
                    name="yourBirthTime"
                    type="time"
                    value={formData.yourBirthTime}
                    onChange={handleInputChange}
                    placeholder="HH:MM"
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="yourBirthPlace" className="text-gray-700 dark:text-gray-300">Your Birth Place</Label>
                  <Input
                    id="yourBirthPlace"
                    name="yourBirthPlace"
                    value={formData.yourBirthPlace}
                    onChange={handleInputChange}
                    placeholder="City, Country (e.g., Amsterdam, Netherlands)"
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">Partner's Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="partnerName" className="text-gray-700 dark:text-gray-300">Partner's Name</Label>
                  <Input
                    id="partnerName"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleInputChange}
                    placeholder="Enter partner's name"
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="partnerBirthDate" className="text-gray-700 dark:text-gray-300">Partner's Birth Date</Label>
                  <Input
                    id="partnerBirthDate"
                    name="partnerBirthDate"
                    type="date"
                    value={formData.partnerBirthDate}
                    onChange={handleInputChange}
                    max={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="partnerBirthTime" className="text-gray-700 dark:text-gray-300">Partner's Birth Time (24-hour)</Label>
                  <Input
                    id="partnerBirthTime"
                    name="partnerBirthTime"
                    type="time"
                    value={formData.partnerBirthTime}
                    onChange={handleInputChange}
                    placeholder="HH:MM"
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="partnerPlaceOfBirth" className="text-gray-700 dark:text-gray-300">Partner's Birth Place</Label>
                  <Input
                    id="partnerPlaceOfBirth"
                    name="partnerPlaceOfBirth"
                    value={formData.partnerPlaceOfBirth}
                    onChange={handleInputChange}
                    placeholder="City, Country (e.g., Amsterdam, Netherlands)"
                    className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button
              onClick={handleSubmit}
              variant="brand"
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg py-3 px-6 shadow-md transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Unlock Your Love Compatibility Report – 10 Credits"}
            </Button>
          </div>
        </div>
      ) : (
        renderCompatibility()
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sans text-gray-900 dark:text-white">Confirm Love Compatibility Report Unlock</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              <p>Unlocking your Love Compatibility Report costs 10 credits. Your current balance is {userCredits} credits.</p>
              <p>Please confirm your details:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Your Name: {formData.yourName}</li>
                <li>Your Birth: {formData.yourBirthDate} at {formData.yourBirthTime}, {formData.yourBirthPlace}</li>
                <li>Partner's Name: {formData.partnerName}</li>
                <li>Partner's Birth: {formData.partnerBirthDate} at {formData.partnerBirthTime}, {formData.partnerPlaceOfBirth}</li>
              </ul>
              <p className="mt-2">Do you want to proceed?</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              className="flex-1 rounded-full border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCompatibilityUnlock}
              variant="brand"
              className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sans text-gray-900 dark:text-white">Insufficient Credits</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              You need 10 credits to unlock your Love Compatibility Report, but your current balance is {userCredits} credits.
              Please add more credits to your account to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              className="flex-1 rounded-full border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => window.location.href = "/wallet/add-credits"}
              variant="brand"
              className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300"
            >
              Add Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoveCompatibility;