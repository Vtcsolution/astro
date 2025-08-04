
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  psychicId: { type: mongoose.Schema.Types.ObjectId, ref: "AiPsychic", required: true },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: "Rating must be an integer between 1 and 5",
    },
  },
  message: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  gift: {
    type: {
      type: String,
      enum: ["heart", "flower", "star", "crystal", "moon", null],
      default: null,
    },
    credits: {
      type: Number,
      enum: [0, 5, 10, 15, 20, 25],
      default: 0,
    },
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
