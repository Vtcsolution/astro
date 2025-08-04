const express = require("express");
const router = express.Router();
const { getAstrologyReport, generateAstrologyReport } = require("../controllers/astrologyController");
const { protect } = require("../middleware/auth");

router.get("/astrology-report", protect, getAstrologyReport);
router.post("/astrology-report", protect, generateAstrologyReport);

module.exports = router;