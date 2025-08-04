
const express = require("express");
const router = express.Router();
const { generateMonthlyForecast, getMonthlyForecasts } = require("../controllers/monthlyForecastController");
const { protect } = require("../middleware/auth");

router.post("/monthly-forecast",protect, generateMonthlyForecast);
router.get("/monthly-forecasts",protect, getMonthlyForecasts);

module.exports = router;
