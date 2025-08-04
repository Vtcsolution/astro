import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Heart, Flower, Sparkles, Gem, Moon } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/All_Components/screen/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackModal({ open, onClose, psychicId, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [gift, setGift] = useState({ type: null, credits: 0 });
  const { user } = useAuth();

  const giftOptions = [
    { type: "heart", icon: Heart, credits: 5, color: "text-rose-500" },
    { type: "flower", icon: Flower, credits: 10, color: "text-emerald-500" },
    { type: "star", icon: Sparkles, credits: 15, color: "text-amber-400" },
    { type: "crystal", icon: Gem, credits: 20, color: "text-indigo-500" },
    { type: "moon", icon: Moon, credits: 25, color: "text-purple-500" },
  ];

  const handleGiftSelect = (type, credits) => {
    setGift({ type, credits });
  };

  const handleSubmit = async () => {
    if (!rating || !message.trim()) {
      toast.error("Please provide a rating and feedback message.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || user.token;
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/feedback/${psychicId}`,
        {
          rating,
          message,
          giftType: gift.type,
          giftCredits: gift.credits,
        },
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(" Feedback submitted successfully!");
      onSubmit();
      onClose();
    } catch (error) {
      console.error("Feedback submission failed:", error);
      toast.error(` Failed to submit feedback: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Share Your Experience ✨
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Rating Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-gray-600">
              How would you rate your session?
            </h3>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-150 ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-500 fill-yellow-500 scale-110"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-2">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Great</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Feedback Message */}
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium text-gray-700">
              Your feedback 
            </label>
            <Textarea
              id="feedback"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What stood out in your session? How could we improve?"
              maxLength={500}
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500 text-right">
              {message.length}/500 characters
            </p>
          </div>

          {/* Gift Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-gray-600">
              Send a virtual gift 🌟 (Optional)
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {giftOptions.map(({ type, icon: Icon, credits, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleGiftSelect(type, credits)}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                    gift.type === type
                      ? "border-blue-500 bg-blue-50 scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-1 ${color}`} />
                  <span className="text-xs font-medium">{credits}⭐</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all"
            onClick={handleSubmit}
            disabled={!rating}
          >
            {gift.credits > 0 ? (
              <span>Submit & Gift {gift.credits} Credits 🎁</span>
            ) : (
              <span>Submit Feedback</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}