
import { useEffect, useState } from "react";
import { useAuth } from "@/All_Components/screen/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/All_Components/Navigator";

const LoveReportTable = () => {
  const { user } = useAuth();
  const [savedReports, setSavedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 3; // Number of reports per page
  const navigate = useNavigate();

  // Fetch saved reports
  useEffect(() => {
    const fetchSavedReports = async () => {
      if (!user) {
        toast.error("Please log in to view your reports.");
        return;
      }
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/love-compatibility-reports?page=${page}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setSavedReports((prev) => (page === 1 ? response.data.data : [...prev, ...response.data.data]));
          setHasMore(response.data.data.length === limit); // If fewer than limit, no more reports
        } else {
          toast.error("Failed to fetch saved reports.");
          setErrorMessage(response.data.message || "Failed to fetch saved reports.");
        }
      } catch (error) {
        console.error("Failed to fetch saved reports:", error);
        toast.error("Failed to fetch saved reports.");
        setErrorMessage(error.response?.data?.message || "An error occurred while fetching reports.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedReports();
  }, [user, page]);

  // Handle Load More button click
  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Render the reports table
  const renderReportsTable = () => {
    if (isLoading && page === 1) {
      return (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      );
    }

    if (savedReports.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl dark:bg-slate-950 border border-blue-200 dark:border-blue-900">
          <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-4">No Reports Available</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You haven't generated any love compatibility reports yet.{" "}
            <a href="/love-compatibility" className="text-blue-600 dark:text-blue-400 hover:underline">
              Generate your first report now!
            </a>
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl dark:bg-slate-950 border border-blue-200 dark:border-blue-900">
        <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white mb-6">Your Love Compatibility Reports</h2>
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-4 mb-6 rounded-lg shadow-sm">
            <p className="font-semibold text-lg">Error</p>
            <p>{errorMessage}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-900">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Your Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Partner's Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Report ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {savedReports.map((report, index) => (
                <tr
                  key={report._id}
                  className={`border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all duration-200 ${
                    index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-gray-50 dark:bg-slate-900"
                  }`}
                >
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report.yourName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report.partnerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report._id}</td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => navigate(`/love-report/${report._id}`)}
                      variant="brand"
                      className="rounded-full bg-[#3B5EB7] hover:bg-[#2F4A94] text-white text-sm py-2 px-4 shadow-md transition-all duration-200"
                    >
                      View Report
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleLoadMore}
              disabled={isLoading}
              className={`rounded-full bg-[#3B5EB7] hover:bg-[#2F4A94] text-white text-lg py-3 px-6 shadow-md transition-all duration-200 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? <LoadingSpinner className="w-6 h-6 inline-block" /> : "Load More"}
            </Button>
          </div>
        )}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("/love-compatibility")}
            variant="brand"
            className="rounded-full bg-[#3B5EB7] hover:bg-[#2F4A94] text-white text-lg py-3 px-6 shadow-md transition-all duration-200"
          >
            Generate New Report (10 Credits)
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-slate-950 dark:to-slate-800">
      <Navigation />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-sans font-bold text-center text-gray-900 dark:text-white mb-12">
            Your Love Compatibility Reports
          </h1>
          {renderReportsTable()}
        </div>
      </div>
    </div>
  );
};

export default LoveReportTable;
