const mongoose = require("mongoose");

const monthlyForecastReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  narrative: {
    type: String,
    required: true,
  },
  chart: {
    sun: {
      sign: { type: String, required: true },
      description: { type: String, required: true },
    },
    moon: {
      sign: { type: String, required: true },
      description: { type: String, required: true },
    },
    ascendant: {
      sign: { type: String, required: true },
      description: { type: String, required: true },
    },
  },
  forecast: {
    overview: { type: String, required: true },
    career: { type: String },
    relationships: { type: String },
    personalGrowth: { type: String },
    challenges: { type: String },
  },
  predictionMonth: {
    type: Number,
    required: true,
  },
  predictionYear: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MonthlyForecastReport", monthlyForecastReportSchema);
