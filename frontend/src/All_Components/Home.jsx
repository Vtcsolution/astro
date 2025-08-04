/* eslint-disable no-unused-vars */
import { Search, MessageCircle, Star, Lock, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProfileSection, ProfileSection1 } from "./Short_COmponents/Profiles";
import { toast } from "sonner";
import { useAuth } from "./screen/AuthContext";
import { parse, isValid, isBefore, isLeapYear } from "date-fns";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [psychics, setPsychics] = useState([]);
  const [showing, setShowing] = useState(4);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPsychic, setSelectedPsychic] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [numerologyReport, setNumerologyReport] = useState(null);
  const [astrologyReport, setAstrologyReport] = useState(null);
  const [loveCompatibilityReport, setLoveCompatibilityReport] = useState(null);
  const [monthlyForecastReport, setMonthlyForecastReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [modalType, setModalType] = useState(null);

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

  // Handle reports from navigation state
  useEffect(() => {
    if (location.state?.numerologyReport) {
      setNumerologyReport(location.state.numerologyReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    } else if (location.state?.astrologyReport) {
      setAstrologyReport(location.state.astrologyReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    } else if (location.state?.monthlyForecastReport) {
      setMonthlyForecastReport(location.state.monthlyForecastReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    }
  }, [location.state, navigate]);

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

  // Fetch psychics
  useEffect(() => {
    const fetchPsychics = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/psychics`);
        const psychicsData = res.data.data || [];

        const psychicsWithFeedback = await Promise.all(
          psychicsData.map(async (psychic) => {
            const defaultPsychic = {
              ...psychic,
              rating: { avgRating: 0, ratingCount: 0 },
              latestReview: null,
            };

            if (!user && !localStorage.getItem("accessToken")) {
              return defaultPsychic;
            }

            try {
              const feedbackRes = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/api/feedback/psychic/${psychic._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${user?.token || localStorage.getItem("accessToken")}`,
                  },
                }
              );
              const feedbackData = feedbackRes.data.overall.feedback || [];
              const latestFeedback = feedbackData.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )[0];
              return {
                ...psychic,
                rating: {
                  avgRating: feedbackRes.data.overall.averageRating || 0,
                  ratingCount: feedbackRes.data.overall.feedbackCount || 0,
                },
                latestReview: latestFeedback
                  ? {
                      userName: latestFeedback.userName || "Anonymous",
                      rating: latestFeedback.rating || 0,
                      text: latestFeedback.message || "No recent review available.",
                    }
                  : null,
              };
            } catch (err) {
              console.error(`Failed to fetch feedback for psychic ${psychic._id}:`, err);
              return defaultPsychic;
            }
          })
        );
        setPsychics(psychicsWithFeedback);
      } catch (err) {
        console.error("Failed to fetch psychics:", err);
        setPsychics([]);
        toast.error("Failed to load psychics. Please try again later.");
      }
    };
    fetchPsychics();
  }, [user]);

  // Geocode birth place for Astrology and Love readings
  useEffect(() => {
    const fetchCoords = async (field, city) => {
      if (!city) return;
      try {
        setIsGeocoding(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/geocode?city=${encodeURIComponent(city)}`
        );
        const { latitude, longitude } = response.data;
        setFormData((prev) => ({
          ...prev,
          ...(field === "your" ? { yourLatitude: latitude, yourLongitude: longitude } : {}),
          ...(field === "partner" ? { partnerLatitude: latitude, partnerLongitude: longitude } : {}),
        }));
      } catch (err) {
        console.error(`Geocode failed for "${city}"`, err);
        toast.error(`Failed to fetch coordinates for ${field === "your" ? "your" : "partner's"} birth place. Please enter a valid city and country (e.g., Amsterdam, Netherlands).`);
      } finally {
        setIsGeocoding(false);
      }
    };

    if (selectedPsychic?.type === "Astrology" || selectedPsychic?.type === "Love" || modalType === "loveCompatibility") {
      if (formData.yourBirthPlace) fetchCoords("your", formData.yourBirthPlace);
      if (formData.partnerPlaceOfBirth) fetchCoords("partner", formData.partnerPlaceOfBirth);
    }
  }, [formData.yourBirthPlace, formData.partnerPlaceOfBirth, selectedPsychic?.type, modalType]);

  const handleAstrologyUnlock = () => {
    if (!user) {
      toast.error("Please log in to unlock the astrology report");
      navigate("/register");
      return;
    }
    if (!user.birthTime || !user.birthPlace) {
      toast.error("Please update your profile with birth time and place to unlock the astrology report");
      navigate("/profile");
      return;
    }
    setModalType("astrology");
    setShowConfirmModal(true);
  };

const handleLoveCompatibilityUnlock = () => {
  if (!user) {
    toast.error("Please log in to unlock the love compatibility report");
    navigate("/login");
    return;
  }
  if (!user.birthTime || !user.birthPlace) {
    toast.error("Please update your profile with birth time and place to unlock the love compatibility report");
    navigate("/profile");
    return;
  }
  navigate("/love-compatibility");
};
  const handleMonthlyForecastUnlock = () => {
    if (!user) {
      toast.error("Please log in to unlock the monthly forecast");
      navigate("/register");
      return;
    }
    if (!user.birthTime || !user.birthPlace) {
      toast.error("Please update your profile with birth time and place to unlock the monthly forecast");
      navigate("/profile");
      return;
    }
    setModalType("monthlyForecast");
    setShowConfirmModal(true);
  };

  const confirmUnlock = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        navigate("/login");
        return;
      }

      let endpoint, creditCost, setReport, navigatePath;
      let payload = {
        yourName: user.fullName || user.username,
        birthDate: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        birthTime: user.birthTime || "",
        birthPlace: user.birthPlace || "",
      };

      if (modalType === "astrology") {
        endpoint = `${import.meta.env.VITE_BASE_URL}/api/astrology-report`;
        creditCost = 5;
        setReport = setAstrologyReport;
        navigatePath = "/astrology-report";
      } else if (modalType === "loveCompatibility") {
        endpoint = `${import.meta.env.VITE_BASE_URL}/api/love-compatibility`;
        creditCost = 10;
        setReport = setLoveCompatibilityReport;
        navigatePath = "/love-compatibility";
        payload = {
          ...payload,
          partnerName: formData.partnerName,
          partnerBirthDate: formData.partnerBirthDate,
          partnerBirthTime: formData.partnerBirthTime,
          partnerPlaceOfBirth: formData.partnerPlaceOfBirth,
          ...(formData.partnerLatitude && { partnerLatitude: Number(formData.partnerLatitude) }),
          ...(formData.partnerLongitude && { partnerLongitude: Number(formData.partnerLongitude) }),
        };
      } else if (modalType === "monthlyForecast") {
        endpoint = `${import.meta.env.VITE_BASE_URL}/api/monthly-forecast`;
        creditCost = 5;
        setReport = setMonthlyForecastReport;
        navigatePath = "/monthly-forecast";
      } else {
        throw new Error("Invalid report type");
      }

      // Add geocoded coordinates for astrology and love compatibility
      if (modalType === "astrology" || modalType === "loveCompatibility") {
        payload = {
          ...payload,
          ...(formData.yourLatitude && { latitude: Number(formData.yourLatitude) }),
          ...(formData.yourLongitude && { longitude: Number(formData.yourLongitude) }),
        };
      }

      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setNumerologyReport(null);
        setAstrologyReport(null);
        setLoveCompatibilityReport(null);
        setMonthlyForecastReport(null);
        setReport(response.data.data);
        setUserCredits(response.data.credits);
        toast.success(`${modalType === "astrology" ? "Astrology" : modalType === "loveCompatibility" ? "Love Compatibility" : "Monthly Forecast"} report unlocked successfully!`);
        navigate(navigatePath, { state: { [modalType + "Report"]: response.data.data } });
      } else {
        if (response.data.message === "Insufficient credits") {
          setShowPaymentModal(true);
        } else if (response.data.message.includes("Invalid birth place")) {
          toast.error("Invalid birth place provided. Please update your profile with a valid city and country (e.g., Amsterdam, Netherlands).");
          navigate("/profile");
        } else {
          toast.error(response.data.message || `Failed to generate ${modalType} report`);
        }
      }
    } catch (error) {
      console.error(`Error generating ${modalType} report:`, error);
      if (error.response?.data?.message === "Invalid birth place") {
        toast.error("Invalid birth place provided. Please update your profile with a valid city and country (e.g., Amsterdam, Netherlands).");
        navigate("/profile");
      } else {
        toast.error(error.response?.data?.message || `An error occurred while generating the ${modalType} report`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentRedirect = () => {
    navigate("/payment");
    setShowPaymentModal(false);
  };

  const handleShowMore = () => setShowing((prev) => Math.min(prev + 4, psychics.length));

  const handlePsychicSelect = (psychic) => {
    if (!user) {
      toast.error("Please log in to connect with a psychic");
      navigate("/login");
      return;
    }
    setSelectedPsychic(psychic);
    if (psychic.type.toLowerCase() === "tarot") {
      handleFormSubmit();
    } else if (psychic.type.toLowerCase() === "profile") {
      navigate(`/psychic/${psychic._id}`);
    } else {
      setFormData({
        yourName: user.fullName || user.username || "",
        yourBirthDate: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        yourBirthTime: user.birthTime || "",
        yourBirthPlace: user.birthPlace || "",
        partnerName: "",
        partnerBirthDate: "",
        partnerBirthTime: "",
        partnerPlaceOfBirth: "",
      });
      if (psychic.type.toLowerCase() === "astrology" && (!user.birthTime || !user.birthPlace)) {
        toast.error("Please update your profile with birth time and place for an astrology reading");
        navigate("/profile");
        return;
      }
      setShowReportModal(true);
    }
  };

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

  const handleFormSubmit = async () => {
    if (!selectedPsychic || !user) return;
    const type = selectedPsychic.type.toLowerCase();

    // Define required fields for each type
    const requiredFields = {
      astrology: ["yourName", "yourBirthDate", "yourBirthTime", "yourBirthPlace"],
      love: ["yourName", "yourBirthDate", "yourBirthPlace"],
      numerology: ["yourName", "yourBirthDate"],
      tarot: [],
    }[type] || [];

    // Validate required fields
    const missingFields = requiredFields.filter((field) => !formData[field]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields
        .map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase())
        .join(", ")}`);
      return;
    }

    // Validate date and time formats
    if (type === "astrology" || type === "love") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.yourBirthDate) || (type === "love" && formData.partnerBirthDate && !dateRegex.test(formData.partnerBirthDate))) {
        toast.error("Invalid birth date format. Please use YYYY-MM-DD.");
        return;
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (type === "astrology" && !timeRegex.test(formData.yourBirthTime)) {
        toast.error("Invalid time format for Your Birth Time. Please use HH:MM (24-hour).");
        return;
      }
      if (type === "love" && formData.yourBirthTime && !timeRegex.test(formData.yourBirthTime)) {
        toast.error("Invalid time format for Your Birth Time. Please use HH:MM (24-hour).");
        return;
      }
      if (type === "love" && formData.partnerBirthTime && !timeRegex.test(formData.partnerBirthTime)) {
        toast.error("Invalid time format for Partner's Birth Time. Please use HH:MM (24-hour).");
        return;
      }

      const userDate = parse(formData.yourBirthDate, "yyyy-MM-dd", new Date());
      if (!isValid(userDate) || !isBefore(userDate, new Date())) {
        toast.error("Your Birth Date must be valid and in the past.");
        return;
      }

      if (type === "love" && formData.partnerBirthDate) {
        const partnerDate = parse(formData.partnerBirthDate, "yyyy-MM-dd", new Date());
        if (!isValid(partnerDate) || !isBefore(partnerDate, new Date())) {
          toast.error("Partner's Birth Date must be valid and in the past.");
          return;
        }
      }
    }

    // Ensure geocoding is complete for Astrology and Love
    if ((type === "astrology" || type === "love") && formData.yourBirthPlace && !formData.yourLatitude) {
      toast.error("Please wait for geocoding to complete or enter a valid birth place.");
      return;
    }
    if (type === "love" && formData.partnerPlaceOfBirth && !formData.partnerLatitude) {
      toast.error("Please wait for geocoding to complete for partner's birth place.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        navigate("/login");
        return;
      }

      const payload = {
        psychicId: selectedPsychic._id,
        formData: {
          ...(type === "astrology" && {
            yourName: formData.yourName,
            birthDate: formData.yourBirthDate, // Changed to match backend expected field names
            birthTime: formData.yourBirthTime,
            birthPlace: formData.yourBirthPlace,
            latitude: formData.yourLatitude ? Number(formData.yourLatitude) : null,
            longitude: formData.yourLongitude ? Number(formData.yourLongitude) : null,
          }),
          ...(type === "numerology" && {
            yourName: formData.yourName,
            birthDate: formData.yourBirthDate,
          }),
          ...(type === "love" && {
            yourName: formData.yourName,
            yourBirthDate: formData.yourBirthDate,
            yourBirthTime: formData.yourBirthTime,
            yourBirthPlace: formData.yourBirthPlace,
            yourLatitude: formData.yourLatitude ? Number(formData.yourLatitude) : null,
            yourLongitude: formData.yourLongitude ? Number(formData.yourLongitude) : null,
            partnerName: formData.partnerName,
            partnerBirthDate: formData.partnerBirthDate,
            partnerBirthTime: formData.partnerBirthTime,
            partnerPlaceOfBirth: formData.partnerPlaceOfBirth,
            partnerLatitude: formData.partnerLatitude ? Number(formData.partnerLatitude) : null,
            partnerLongitude: formData.partnerLongitude ? Number(formData.partnerLongitude) : null,
          }),
          ...(type === "tarot" && {}),
        },
      };

      console.log("Submitting payload for astrology:", payload); // Debug payload

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/form/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success(`${selectedPsychic.type} reading data saved successfully!`);
        navigate(`/chat/${selectedPsychic._id}`);
      } else {
        console.error("Backend error:", response.data.message); // Debug backend error
        toast.error(response.data.message || "Failed to save reading data. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error); // Debug full error
      if (error.response?.data?.message?.includes("Invalid birth place")) {
        toast.error("Invalid birth place provided. Please enter a valid city and country (e.g., Amsterdam, Netherlands).");
      } else if (error.response?.data?.message?.includes("Missing required fields")) {
        toast.error(`Missing required fields: ${error.response.data.message.split(":")[1] || "please check your input."}`);
      } else {
        toast.error(error.response?.data?.message || "An error occurred while saving the reading data. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    if (!selectedPsychic || !selectedPsychic.type) return null;
    const type = selectedPsychic.type.toLowerCase();
    const commonInput = (label, name, type = "text", placeholder = "", required = false) => (
      <div className="space-y-2">
        <Label>{label}{required ? " *" : ""}</Label>
        <Input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
        />
      </div>
    );

    switch (type) {
      case "numerology":
        return (
          <>
            {commonInput("Full Name", "yourName", "text", "John Doe", true)}
            {commonInput("Date of Birth", "yourBirthDate", "date", "", true)}
          </>
        );
      case "love":
        return (
          <>
            {commonInput("Your Full Name", "yourName", "text", "Your name", true)}
            <div className="grid grid-cols-2 gap-4">
              {commonInput("Your Date of Birth", "yourBirthDate", "date", "", true)}
              {commonInput("Your Time of Birth", "yourBirthTime", "time", "", false)}
            </div>
            {commonInput("Your Place of Birth", "yourBirthPlace", "text", "City, Country", true)}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Partner Information</h3>
              {commonInput("Partner's Full Name", "partnerName", "text", "Partner's name", false)}
              <div className="grid grid-cols-2 gap-4">
                {commonInput("Partner's Date of Birth", "partnerBirthDate", "date", "", false)}
                {commonInput("Partner's Time of Birth", "partnerBirthTime", "time", "", false)}
              </div>
              {commonInput("Partner's Place of Birth", "partnerPlaceOfBirth", "text", "City, Country", false)}
            </div>
          </>
        );
      case "astrology":
        return (
          <>
            {commonInput("Your Full Name", "yourName", "text", "Your name", true)}
            <div className="grid grid-cols-2 gap-4">
              {commonInput("Your Date of Birth", "yourBirthDate", "date", "", true)}
              {commonInput("Your Time of Birth", "yourBirthTime", "time", "", true)}
            </div>
            {commonInput("Your Place of Birth", "yourBirthPlace", "text", "City, Country", true)}
          </>
        );
      case "tarot":
        return (
          <p className="text-gray-600 dark:text-gray-300">
            No additional information is required for your Tarot reading. Click "Start Reading" to begin your session.
          </p>
        );
      default:
        return null;
    }
  };

  const renderNumerologyReport = () => {
    if (!numerologyReport) return null;
    const { narrative, lifePath, expression, soulUrge, personality, karmicLessons, challenges } = numerologyReport;
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Numerology Blueprint</h2>
        <div className="prose max-w-none">
          <p className="whitespace-pre-line text-gray-700">{narrative}</p>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Life Path Number: {lifePath.number}</h3>
            <p className="text-gray-600">{lifePath.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Expression Number: {expression.number}</h3>
            <p className="text-gray-600">{expression.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Heart’s Desire Number: {soulUrge.number}</h3>
            <p className="text-gray-600">{soulUrge.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Personality Number: {personality.number}</h3>
            <p className="text-gray-600">{personality.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Karmic Lessons: {karmicLessons.length > 0 ? karmicLessons.join(", ") : "None"}</h3>
            <p className="text-gray-600">
              {karmicLessons.length > 0
                ? "These numbers represent lessons to learn in this lifetime, derived from missing letters in your name."
                : "You have no missing numbers, indicating a balanced set of energies."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Challenges: {challenges.join(", ")}</h3>
            <p className="text-gray-600">
              These numbers represent challenges you may face, calculated from your birth date.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            variant="brand"
            onClick={handleAstrologyUnlock}
            disabled={isSubmitting}
          >
            Unlock Astrology Report (5 Credits)
          </Button>
          <Button
            onClick={() => {
              setShowReportModal(false);
              navigate("/chat/free");
            }}
            variant="outline"
            className="w-full sm:flex-1"
          >
            Chat 1 Minute Free with a Coach
          </Button>
        </div>
      </div>
    );
  };

  const renderAstrologyReport = () => {
    if (!astrologyReport) return null;
    const { narrative, chart, numerology } = astrologyReport;
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Astrological Blueprint</h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700">{narrative}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Sun Sign: {chart.sun.sign} (House {chart.sun.house})</h3>
                <p className="text-gray-600">{chart.sun.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Moon Sign: {chart.moon.sign} (House {chart.moon.house})</h3>
                <p className="text-gray-600">{chart.moon.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Venus Sign: {chart.venus.sign} (House {chart.venus.house})</h3>
                <p className="text-gray-600">{chart.venus.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Mars Sign: {chart.mars.sign} (House {chart.mars.house})</h3>
                <p className="text-gray-600">{chart.mars.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Mercury Sign: {chart.mercury.sign} (House {chart.mercury.house})</h3>
                <p className="text-gray-600">{chart.mercury.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Jupiter Sign: {chart.jupiter.sign} (House {chart.jupiter.house})</h3>
                <p className="text-gray-600">{chart.jupiter.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Saturn Sign: {chart.saturn.sign} (House {chart.saturn.house})</h3>
                <p className="text-gray-600">{chart.saturn.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Life Path Number: {numerology.lifePath.number}</h3>
                <p className="text-gray-600">{numerology.lifePath.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Heart’s Desire Number: {numerology.heart.number}</h3>
                <p className="text-gray-600">{numerology.heart.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Expression Number: {numerology.expression.number}</h3>
                <p className="text-gray-600">{numerology.expression.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Personality Number: {numerology.personality.number}</h3>
                <p className="text-gray-600">{numerology.personality.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setAstrologyReport(null);
                  navigate("/astrology-report", { state: { astrologyReport } });
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setAstrologyReport(null);
                  navigate("/");
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderLoveCompatibilityReport = () => {
    if (!loveCompatibilityReport) return null;
    const { narrative, compatibility } = loveCompatibilityReport;
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Love Compatibility Report</h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700">{narrative}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Compatibility Score: {compatibility.score}</h3>
                <p className="text-gray-600">{compatibility.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setLoveCompatibilityReport(null);
                  navigate("/love-compatibility", { state: { loveCompatibilityReport } });
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setLoveCompatibilityReport(null);
                  navigate("/");
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMonthlyForecastReport = () => {
    if (!monthlyForecastReport) return null;
    const { narrative, chart, forecast, predictionMonth, predictionYear } = monthlyForecastReport;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Monthly Forecast for {monthNames[predictionMonth - 1]} {predictionYear}</h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700">{narrative}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Overview</h3>
                <p className="text-gray-600">{forecast.overview}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Career & Purpose</h3>
                <p className="text-gray-600">{forecast.career}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Relationships & Connections</h3>
                <p className="text-gray-600">{forecast.relationships}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Personal Growth & Spirituality</h3>
                <p className="text-gray-600">{forecast.personalGrowth}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Challenges & Practical Advice</h3>
                <p className="text-gray-600">{forecast.challenges}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Sun Sign: {chart.sun.sign}</h3>
                <p className="text-gray-600">{chart.sun.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Moon Sign: {chart.moon.sign}</h3>
                <p className="text-gray-600">{chart.moon.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Ascendant: {chart.ascendant.sign}</h3>
                <p className="text-gray-600">{chart.ascendant.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setMonthlyForecastReport(null);
                  navigate("/monthly-forecast", { state: { monthlyForecastReport } });
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setMonthlyForecastReport(null);
                  navigate("/");
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="">
      <div className="relative w-full overflow-hidden">
        <img
          src="/images/banner.jpeg"
          className="w-full h-[600px] scale-105 max-sm:scale-125 object-cover"
          alt="banner"
        />
        <div className="absolute top-1/2 sm:top-[80%] left-1/2 -translate-y-1/2 sm:-translate-y-[80%] -translate-x-1/2">
          <h1
            style={{ fontFamily: "Roboto" }}
            className="text-4xl max-[500px]:w-[280px] sm:text-5xl lg:text-[52px] leading-[50px] sm:leading-[60px] md:leading-[70px] font-sans font-extrabold uppercase text-white text-center w-full"
          >
            DE NATIONALE HULPLIJN <br />VOOR ELKAAR MET ELKAAR
          </h1>
          <img
            src="/images/newLogo.jpg"
            className="md:w-20 md:h-20 w-14 h-14 m-auto rounded-full object-cover"
            alt="logo"
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Discover Your Spiritual Blueprint
          </h1>
          <p className="text-lg sm:text-xl mb-6">
            View your spiritual blueprint here.
          </p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              <Lock className="h-4 w-4" /> SSL Secure
            </Badge>
            <Badge className="bg-blue-500 text-white flex items-center gap-1">
              <Cpu className="h-4 w-4" /> AI-Powered
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl px-2 m-auto">
        <div className="mt-8 grid grid-cols-1 gap-6">
          <div className="lg:col-span-2 space-y-2 w-full">
            <div className="overflow-x-auto">
              <ProfileSection1 />
            </div>
            <div className="wrapper">
              <Tabs defaultValue="active">
                <TabsContent value="active">
                  <div className="grid gap-8 mb-10 w-full">
                    {psychics.slice(0, showing).map((psychic, i) => (
                      <div
                        key={psychic._id || i}
                        className="overflow-hidden w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className="p-6">
                          <div className="flex flex-col gap-6 md:flex-row">
                            <div className="flex flex-col items-center lg:w-64">
                              <div className="relative rounded-full border-4 border-violet-100 dark:border-violet-900">
                                <img
                                  src={psychic.image}
                                  alt={psychic.name}
                                  className="object-cover h-32 w-32 rounded-full"
                                />
                              </div>
                              <div className="mt-4 text-center">
                                <h3 className="text-xl font-semibold">{psychic.name}</h3>
                                <p className="text-slate-700 dark:text-slate-200">{psychic.type}</p>
                                <div className="mt-1 flex items-center justify-center">
                                  {Array(Math.round(psychic.rating?.avgRating || 0))
                                    .fill(0)
                                    .map((_, i) => (
                                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <Badge className="mt-2 bg-emerald-500">Available</Badge>
                              </div>
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="flex flex-wrap gap-2">
                                {psychic.abilities?.map((ability, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                                  >
                                    {ability}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300">{psychic.bio}</p>
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Latest Review</h4>
                                <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                                  {psychic.latestReview ? (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <p className="font-medium">{psychic.latestReview.userName || "Anonymous"}</p>
                                        <div className="flex">
                                          {Array(5)
                                            .fill(0)
                                            .map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`h-3 w-3 ${
                                                  i < psychic.latestReview.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                }`}
                                              />
                                            ))}
                                        </div>
                                      </div>
                                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        {psychic.latestReview.text}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      No recent review available.
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                  variant="brand"
                                  className="rounded-full gap-2"
                                  onClick={() => handlePsychicSelect(psychic)}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Credits {psychic.rate?.perMinute?.toFixed(2) || "1.75"}/min
                                </Button>
                                <Button
                                  variant="outline"
                                  className="rounded-full gap-2"
                                  onClick={() => navigate(`/psychic/${psychic._id}`)}
                                >
                                  View Profile
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {showing < psychics.length && (
                      <Button onClick={handleShowMore} variant="brand">
                        Show More
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="mt-12 py-8">
          <h2 className="text-3xl font-extrabold text-center mb-8">Unlock Deeper Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold mb-4">Astrological Blueprint</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Discover your cosmic blueprint with a personalized astrology report, revealing insights from your sun, moon, and ascendant signs.
              </p>
              <Button
                variant="brand"
                className="w-full rounded-full"
                onClick={handleAstrologyUnlock}
                disabled={isSubmitting}
              >
                Unlock Astrology Report (5 Credits)
              </Button>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold mb-4">Love Compatibility</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Explore the dynamics of your relationships with a detailed compatibility report, analyzing your and your partner’s astrological profiles.
              </p>
              <Button
                variant="brand"
                className="w-full rounded-full"
                onClick={handleLoveCompatibilityUnlock}
                disabled={isSubmitting}
              >
                Unlock Love Compatibility (10 Credits)
              </Button>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold mb-4">Monthly Forecast</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get a personalized forecast for the month ahead, guiding you through opportunities and challenges based on your astrological chart and real-time transits.
              </p>
              <Button
                variant="brand"
                className="w-full rounded-full"
                onClick={handleMonthlyForecastUnlock}
                disabled={isSubmitting}
              >
                Unlock Monthly Forecast (5 Credits)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showReportModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowReportModal(false);
            setNumerologyReport(null);
            setAstrologyReport(null);
            setLoveCompatibilityReport(null);
            setMonthlyForecastReport(null);
            setSelectedPsychic(null);
            setModalType(null);
          }
        }}
      >
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-xl shadow-lg z-50 focus:outline-none p-0">
          <div className="max-h-[90vh] overflow-y-auto">
            {numerologyReport ? (
              renderNumerologyReport()
            ) : astrologyReport ? (
              renderAstrologyReport()
            ) : loveCompatibilityReport ? (
              renderLoveCompatibilityReport()
            ) : monthlyForecastReport ? (
              renderMonthlyForecastReport()
            ) : selectedPsychic ? (
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-center">
                  {selectedPsychic.name}'s {selectedPsychic.type} Reading
                </h2>
                <div className="space-y-4">
                  {renderFormFields()}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowReportModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFormSubmit}
                    variant="brand"
                    className="flex-1"
                    disabled={isSubmitting || isGeocoding}
                  >
                    {isSubmitting ? "Submitting..." : isGeocoding ? "Fetching Coordinates..." : "Start Reading"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Credits</DialogTitle>
            <DialogDescription>
              You need {modalType === "loveCompatibility" ? 10 : 5} credits to unlock your {modalType === "astrology" ? "Astrological Blueprint" : modalType === "loveCompatibility" ? "Love Compatibility Report" : "Monthly Forecast"}, but your current balance is {userCredits} credits.
              Please add more credits to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentRedirect}
              variant="brand"
              className="flex-1"
            >
              Add Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {modalType === "astrology" ? "Astrology Report" : modalType === "loveCompatibility" ? "Love Compatibility" : "Monthly Forecast"} Unlock
            </DialogTitle>
            <DialogDescription>
              Unlocking your {modalType === "astrology" ? "Astrological Blueprint" : modalType === "loveCompatibility" ? "Love Compatibility Report" : "Monthly Forecast"} costs {modalType === "loveCompatibility" ? 10 : 5} credits. Your current balance is {userCredits} credits.
              {modalType === "loveCompatibility" && (
                <>
                  <br />
                  Please provide your partner’s details below:
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Partner's Full Name *</Label>
                      <Input
                        type="text"
                        name="partnerName"
                        value={formData.partnerName}
                        onChange={handleInputChange}
                        placeholder="Partner's name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Partner's Date of Birth *</Label>
                        <Input
                          type="date"
                          name="partnerBirthDate"
                          value={formData.partnerBirthDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Partner's Time of Birth</Label>
                        <Input
                          type="time"
                          name="partnerBirthTime"
                          value={formData.partnerBirthTime}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Partner's Place of Birth *</Label>
                      <Input
                        type="text"
                        name="partnerPlaceOfBirth"
                        value={formData.partnerPlaceOfBirth}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              <br />
              Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnlock}
              variant="brand"
              className="flex-1"
              disabled={isSubmitting || (modalType === "loveCompatibility" && (!formData.partnerName || !formData.partnerBirthDate || !formData.partnerPlaceOfBirth))}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;