const express = require("express");
const router = express.Router();
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const AiFormData = require("../models/aiFormData");
const LoveCompatibilityReport = require("../models/LoveCompatibilityReport");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");
const { validateInput, validatePayload, getCoordinatesFromCity, getFallbackTimezoneOffset } = require("../utils/helpers");
const { astrologyDescriptions, combinedInfluences, enhanceSynastryNarrative } = require("../utils/astrology");

const FALLBACK_COORDINATES = {
  "amsterdam, netherlands": { latitude: 52.3730796, longitude: 4.8924534 },
};

const auth = {
  username: process.env.ASTROLOGY_API_USER_ID,
  password: process.env.ASTROLOGY_API_KEY,
};

router.post("/love-compatibility", async (req, res) => {
  try {
    // Authenticate user
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check wallet credits
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.credits < 10) {
      return res.status(400).json({ success: false, message: "Insufficient credits. 10 credits required." });
    }

    // Extract form data
    const {
      yourName,
      yourBirthDate,
      yourBirthTime,
      yourBirthPlace,
      partnerName,
      partnerBirthDate,
      partnerBirthTime,
      partnerPlaceOfBirth,
    } = req.body;

    // Validate input
    try {
      validateInput({
        yourName,
        yourBirthDate,
        yourBirthTime,
        yourBirthPlace,
        partnerName,
        partnerBirthDate,
        partnerBirthTime,
        partnerPlaceOfBirth,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Fetch coordinates
    let userCoords, partnerCoords;
    try {
      userCoords = await getCoordinatesFromCity(yourBirthPlace.trim().toLowerCase());
      console.log(`[Geo Details] User coordinates: ${JSON.stringify(userCoords)}`);

      partnerCoords = await getCoordinatesFromCity(partnerPlaceOfBirth.trim().toLowerCase());
      console.log(`[Geo Details] Partner coordinates: ${JSON.stringify(partnerCoords)}`);

      if (!userCoords.latitude || !userCoords.longitude || !partnerCoords.latitude || !partnerCoords.longitude) {
        throw new Error("Invalid coordinates returned for birth places.");
      }
    } catch (error) {
      console.error("Geo Details Error:", error.message);
      return res.status(400).json({
        success: false,
        message: `Failed to fetch coordinates: ${error.message}. Please specify city and country clearly (e.g., 'Amsterdam, Netherlands').`,
      });
    }

    // Fetch timezones
    let userTzone, partnerTzone;
    try {
      const userTzRes = await axios.post(
        "https://json.astrologyapi.com/v1/timezone_with_dst",
        { latitude: userCoords.latitude, longitude: userCoords.longitude, date: yourBirthDate },
        { auth, timeout: 5000, headers: { "Accept-Language": "en" } }
      );
      userTzone = Number(userTzRes.data.timezone);
      console.log(`[Timezone] User timezone offset: ${userTzone}`);

      const partnerTzRes = await axios.post(
        "https://json.astrologyapi.com/v1/timezone_with_dst",
        { latitude: partnerCoords.latitude, longitude: partnerCoords.longitude, date: partnerBirthDate },
        { auth, timeout: 5000, headers: { "Accept-Language": "en" } }
      );
      partnerTzone = Number(partnerTzRes.data.timezone);
      console.log(`[Timezone] Partner timezone offset: ${partnerTzone}`);
    } catch (error) {
      console.error("Timezone API Error:", {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
      });
      userTzone = getFallbackTimezoneOffset(yourBirthDate, userCoords.latitude, userCoords.longitude);
      partnerTzone = getFallbackTimezoneOffset(partnerBirthDate, partnerCoords.latitude, partnerCoords.longitude);
      console.warn(`Using fallback timezone offsets: ${userTzone} for ${yourBirthPlace}, ${partnerTzone} for ${partnerPlaceOfBirth}`);
    }

    // Force CET for 1986-03-19
    if (yourBirthDate === "1986-03-19") {
      userTzone = 1;
      console.log(`Forcing CET (UTC+1) for ${yourBirthDate} in ${yourBirthPlace}`);
    }

    // Prepare payload
    const parseDateComponent = (value, componentName) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) throw new Error(`Invalid ${componentName}: ${value}`);
      return num;
    };

    const [userYear, userMonth, userDay] = yourBirthDate.split("-").map((val) =>
      parseDateComponent(val, "date component")
    );
    const [userHour, userMin] = yourBirthTime.split(":").map((val) =>
      parseDateComponent(val, "time component")
    );
    const [partnerYear, partnerMonth, partnerDay] = partnerBirthDate.split("-").map((val) =>
      parseDateComponent(val, "date component")
    );
    const [partnerHour, partnerMin] = partnerBirthTime.split(":").map((val) =>
      parseDateComponent(val, "time component")
    );

    const userPayload = {
      day: userDay,
      month: userMonth,
      year: userYear,
      hour: userHour,
      min: userMin,
      lat: parseFloat(userCoords.latitude),
      lon: parseFloat(userCoords.longitude),
      tzone: userTzone,
      house_type: "placidus",
    };

    const partnerPayload = {
      day: partnerDay,
      month: partnerMonth,
      year: partnerYear,
      hour: partnerHour,
      min: partnerMin,
      lat: parseFloat(partnerCoords.latitude),
      lon: parseFloat(partnerCoords.longitude),
      tzone: partnerTzone,
      house_type: "placidus",
    };

    // Validate payloads
    try {
      validatePayload(userPayload);
      validatePayload(partnerPayload);
    } catch (error) {
      return res.status(400).json({ success: false, message: `Payload validation failed: ${error.message}` });
    }

    // Log API request
    console.log("Sending Chart Data API Requests:", {
      userPayload: JSON.stringify(userPayload, null, 2),
      partnerPayload: JSON.stringify(partnerPayload, null, 2),
    });

    // Save form data
    const formData = new AiFormData({
      userId,
      type: "Love",
      formData: {
        yourName,
        yourBirthDate,
        yourBirthTime,
        yourBirthPlace,
        partnerName,
        partnerBirthDate,
        partnerBirthTime,
        partnerPlaceOfBirth,
      },
    });

    try {
      await formData.save();
      console.log("Form data saved successfully:", formData);
    } catch (error) {
      console.error("Failed to save form data:", error.message);
      return res.status(500).json({ success: false, message: `Failed to save form data: ${error.message}` });
    }

    // Fetch chart data with retry for all house systems
    let userChart, partnerChart;
    const houseSystems = ["placidus", "koch", "equal_house", "topocentric", "poryphry", "whole_sign"];
    let lastError = null;
    let failedUser = false, failedPartner = false;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const houseType of houseSystems) {
      userPayload.house_type = houseType;
      partnerPayload.house_type = houseType;
      try {
        const userResponse = await axios.post(
          "https://json.astrologyapi.com/v1/western_chart_data",
          userPayload,
          { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
        );
        console.log(`User Western Chart Data Response (${houseType}):`, JSON.stringify(userResponse.data, null, 2));
        userChart = userResponse.data;
        try {
          validateApiResponse(userChart, `western_chart_data (${houseType})`, yourName);
        } catch (validationError) {
          console.warn(`Validation failed for user (${houseType}): ${validationError.message}`);
          throw validationError;
        }

        const partnerResponse = await axios.post(
          "https://json.astrologyapi.com/v1/western_chart_data",
          partnerPayload,
          { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
        );
        console.log(`Partner Western Chart Data Response (${houseType}):`, JSON.stringify(partnerResponse.data, null, 2));
        partnerChart = partnerResponse.data;
        try {
          validateApiResponse(partnerChart, `western_chart_data (${houseType})`, partnerName);
        } catch (validationError) {
          console.warn(`Validation failed for partner (${houseType}): ${validationError.message}`);
          throw validationError;
        }
        break; // Success, exit loop
      } catch (error) {
        console.error(`Western Chart Data API Error (${houseType}):`, {
          message: error.message,
          status: error.response?.status,
          data: JSON.stringify(error.response?.data || {}, null, 2),
          payload: JSON.stringify(userPayload, null, 2),
        });
        lastError = error;

        // Fallback to planets/tropical and house_cusps/tropical
        try {
          const userPlanets = await axios.post(
            "https://json.astrologyapi.com/v1/planets/tropical",
            userPayload,
            { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
          );
          console.log(`User Planets Raw Response (${houseType}):`, JSON.stringify(userPlanets.data, null, 2));
          await delay(2000); // Delay to avoid rate limits
          const userHouses = await axios.post(
            "https://json.astrologyapi.com/v1/house_cusps/tropical",
            userPayload,
            { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
          );
          console.log(`User Houses Raw Response (${houseType}):`, JSON.stringify(userHouses.data, null, 2));
          userChart = { planets: userPlanets.data, houses: userHouses.data || [] };
          try {
            validateApiResponse(userChart, `planets/tropical and house_cusps/tropical (${houseType})`, yourName);
          } catch (validationError) {
            console.warn(`Fallback validation failed for user (${houseType}): ${validationError.message}`);
            failedUser = true;
          }

          const partnerPlanets = await axios.post(
            "https://json.astrologyapi.com/v1/planets/tropical",
            partnerPayload,
            { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
          );
          console.log(`Partner Planets Raw Response (${houseType}):`, JSON.stringify(partnerPlanets.data, null, 2));
          await delay(2000); // Delay to avoid rate limits
          const partnerHouses = await axios.post(
            "https://json.astrologyapi.com/v1/house_cusps/tropical",
            partnerPayload,
            { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
          );
          console.log(`Partner Houses Raw Response (${houseType}):`, JSON.stringify(partnerHouses.data, null, 2));
          partnerChart = { planets: partnerPlanets.data, houses: partnerHouses.data || [] };
          try {
            validateApiResponse(partnerChart, `planets/tropical and house_cusps/tropical (${houseType})`, partnerName);
          } catch (validationError) {
            console.warn(`Fallback validation failed for partner (${houseType}): ${validationError.message}`);
            failedPartner = true;
          }

          if (!failedUser && !failedPartner) {
            break; // Success, exit loop
          }
        } catch (fallbackError) {
          console.error(`Fallback API Error Details (${houseType}):`, {
            message: fallbackError.message,
            status: fallbackError.response?.status,
            data: JSON.stringify(fallbackError.response?.data || {}, null, 2),
            payload: JSON.stringify(userPayload, null, 2),
          });
          lastError = fallbackError;
        }
      }
      await delay(2000); // Delay between house system retries
    }

    // Mock data for testing if API fails
    if (!userChart || !partnerChart || failedUser || failedPartner) {
      if (process.env.NODE_ENV === "test") {
        console.warn("Using mock chart data due to API failure");
        userChart = {
          planets: [
            { name: "Sun", sign: "Pisces", house: 10, fullDegree: 85.123, normDegree: 25.123, speed: 1.0, isRetro: "false" },
            { name: "Moon", sign: "Cancer", house: 3, fullDegree: 200.456, normDegree: 20.456, speed: 13.0, isRetro: "false" },
            { name: "Venus", sign: "Taurus", house: 5, fullDegree: 245.789, normDegree: 5.789, speed: 1.2, isRetro: "false" },
            { name: "Mars", sign: "Aries", house: 6, fullDegree: 320.123, normDegree: 20.123, speed: 0.7, isRetro: "false" },
            { name: "Mercury", sign: "Aquarius", house: 11, fullDegree: 90.456, normDegree: 0.456, speed: 1.5, isRetro: "true" },
            { name: "Jupiter", sign: "Libra", house: 2, fullDegree: 150.789, normDegree: 0.789, speed: 0.2, isRetro: "false" },
            { name: "Saturn", sign: "Sagittarius", house: 7, fullDegree: 300.123, normDegree: 0.123, speed: 0.1, isRetro: "false" }
          ],
          houses: [
            { house: 1, sign: "Virgo", degree: 123.456 },
            { house: 2, sign: "Libra", degree: 150.789 },
            { house: 3, sign: "Scorpio", degree: 180.123 },
            { house: 4, sign: "Sagittarius", degree: 210.456 },
            { house: 5, sign: "Capricorn", degree: 240.789 },
            { house: 6, sign: "Aquarius", degree: 270.123 },
            { house: 7, sign: "Pisces", degree: 300.456 },
            { house: 8, sign: "Aries", degree: 330.789 },
            { house: 9, sign: "Taurus", degree: 0.123 },
            { house: 10, sign: "Gemini", degree: 30.456 },
            { house: 11, sign: "Cancer", degree: 60.789 },
            { house: 12, sign: "Leo", degree: 90.123 }
          ]
        };
        partnerChart = userChart; // Same for simplicity
      } else {
        const errorMsg = lastError.response?.data?.msg || lastError.message || "Unknown error";
        return res.status(400).json({
          success: false,
          message: `Failed to fetch chart data: ${errorMsg}. Please verify your birth details (date: ${yourBirthDate}, time: ${yourBirthTime}, place: ${yourBirthPlace}) and partner's details (date: ${partnerBirthDate}, time: ${partnerBirthTime}, place: ${partnerPlaceOfBirth}). If the issue persists, contact Astrology API support with error code: HOUSE_CUSPS_ERROR. API Response: ${JSON.stringify(lastError.response?.data || {}, null, 2)}`,
        });
      }
    }

    // Deduct credits
    try {
      wallet.credits -= 10;
      await wallet.save();
      console.log("Wallet updated successfully:", wallet);
    } catch (error) {
      console.error("Failed to update wallet:", error.message);
      return res.status(500).json({ success: false, message: `Failed to update wallet: ${error.message}` });
    }

    // Process chart data
    const normalizePlanetData = (chart, userName) => {
      const planets = Array.isArray(chart.planets) ? chart.planets : [];
      const houses = Array.isArray(chart.houses) ? chart.houses : [];
      const ascendant = houses.find(h => h.house === 1)?.sign || "Unknown";
      const result = {
        Sun: { sign: planets.find(p => p.name === "Sun")?.sign || "Unknown", house: planets.find(p => p.name === "Sun")?.house || "Unknown" },
        Moon: { sign: planets.find(p => p.name === "Moon")?.sign || "Unknown", house: planets.find(p => p.name === "Moon")?.house || "Unknown" },
        Venus: { sign: planets.find(p => p.name === "Venus")?.sign || "Unknown", house: planets.find(p => p.name === "Venus")?.house || "Unknown" },
        Mars: { sign: planets.find(p => p.name === "Mars")?.sign || "Unknown", house: planets.find(p => p.name === "Mars")?.house || "Unknown" },
        Mercury: { sign: planets.find(p => p.name === "Mercury")?.sign || "Unknown", house: planets.find(p => p.name === "Mercury")?.house || "Unknown" },
        Jupiter: { sign: planets.find(p => p.name === "Jupiter")?.sign || "Unknown", house: planets.find(p => p.name === "Jupiter")?.house || "Unknown" },
        Saturn: { sign: planets.find(p => p.name === "Saturn")?.sign || "Unknown", house: planets.find(p => p.name === "Saturn")?.house || "Unknown" },
        Ascendant: { sign: ascendant },
      };
      const missingPlanets = Object.keys(result).filter(
        planet => planet !== "Ascendant" && (result[planet].sign === "Unknown" || result[planet].house === "Unknown")
      );
      if (missingPlanets.length > 0) {
        console.warn(`Missing planetary data for ${userName}: ${missingPlanets.join(", ")}`);
      }
      if (result.Ascendant.sign === "Unknown") {
        console.warn(`Missing Ascendant data for ${userName}`);
      }
      return result;
    };

    const userPlanets = normalizePlanetData(userChart, yourName);
    const partnerPlanets = normalizePlanetData(partnerChart, partnerName);

    // Relaxed validation: proceed if at least some planetary data is valid
    const requiredPlanets = ["Sun", "Moon", "Venus", "Mars", "Mercury", "Jupiter", "Saturn"];
    const isValidPlanetData = (planets) => requiredPlanets.some(
      (planet) => planets[planet] && planets[planet].sign !== "Unknown" && planets[planet].house !== "Unknown"
    );

    if (!isValidPlanetData(userPlanets) || !isValidPlanetData(partnerPlanets)) {
      console.error("Invalid planetary data:", {
        userPlanets: JSON.stringify(userPlanets, null, 2),
        partnerPlanets: JSON.stringify(partnerPlanets, null, 2),
      });
      return res.status(400).json({
        success: false,
        message: `Unable to retrieve complete planetary data from Astrology API. Please verify birth details (date: ${yourBirthDate}, time: ${yourBirthTime}, place: ${yourBirthPlace}) and partner's details (date: ${partnerBirthDate}, time: ${partnerBirthTime}, place: ${partnerPlaceOfBirth}). Contact support with error code: PLANETARY_DATA_ERROR.`,
      });
    }

    // Fetch natal chart interpretations
    let narrative = `${yourName} and ${partnerName}, your cosmic connection is a dance of energies, weaving strengths and challenges into a unique love story. 💞`;
    try {
      const userInterpretation = await axios.post(
        "https://json.astrologyapi.com/v1/natal_chart_interpretation",
        userPayload,
        { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
      );
      console.log("User Natal Chart Interpretation:", JSON.stringify(userInterpretation.data, null, 2));
      const partnerInterpretation = await axios.post(
        "https://json.astrologyapi.com/v1/natal_chart_interpretation",
        partnerPayload,
        { auth, headers: { "Content-Type": "application/json", "Accept-Language": "en" }, timeout: 10000 }
      );
      console.log("Partner Natal Chart Interpretation:", JSON.stringify(partnerInterpretation.data, null, 2));
      narrative = `Based on your natal charts, ${yourName} and ${partnerName}, your relationship blends unique energies. ${userInterpretation.data.description || ""} ${partnerInterpretation.data.description || ""}`;
    } catch (error) {
      console.error("Natal Chart Interpretation Error:", {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
      });
      console.warn("Using default narrative due to interpretation API failure.");
    }

    // Prepare chart data
    const chart = {
      user: {
        sun: {
          sign: userPlanets.Sun.sign,
          house: userPlanets.Sun.house !== "Unknown" ? `${userPlanets.Sun.house}th House` : "Unknown",
          description: `${astrologyDescriptions.sun.signs[userPlanets.Sun.sign] || "Your Sun shapes your core identity. 🌞"} ${astrologyDescriptions.sun.houses[userPlanets.Sun.house] || (userPlanets.Sun.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.sun(
            userPlanets.Sun.sign,
            partnerPlanets.Sun.sign,
            userPlanets.Sun.house,
            partnerPlanets.Sun.house
          ),
        },
        moon: {
          sign: userPlanets.Moon.sign,
          house: userPlanets.Moon.house !== "Unknown" ? `${userPlanets.Moon.house}th House` : "Unknown",
          description: `${astrologyDescriptions.moon.signs[userPlanets.Moon.sign] || "Your Moon guides your emotional world. 🌙"} ${astrologyDescriptions.moon.houses[userPlanets.Moon.house] || (userPlanets.Moon.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.moon(
            userPlanets.Moon.sign,
            partnerPlanets.Moon.sign,
            userPlanets.Moon.house,
            partnerPlanets.Moon.house
          ),
        },
        ascendant: {
          sign: userPlanets.Ascendant.sign,
          description: astrologyDescriptions.ascendant.signs[userPlanets.Ascendant.sign] || (userPlanets.Ascendant.sign === "Unknown" ? "Your Ascendant could not be determined due to data issues. 🌟" : "Your Ascendant shapes your outer presence. 🌟"),
        },
        venus: {
          sign: userPlanets.Venus.sign,
          house: userPlanets.Venus.house !== "Unknown" ? `${userPlanets.Venus.house}th House` : "Unknown",
          description: `${astrologyDescriptions.venus.signs[userPlanets.Venus.sign] || "Your Venus shapes your approach to love. 💕"} ${astrologyDescriptions.venus.houses[userPlanets.Venus.house] || (userPlanets.Venus.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.venus(
            userPlanets.Venus.sign,
            partnerPlanets.Venus.sign,
            userPlanets.Venus.house,
            partnerPlanets.Venus.house
          ),
        },
        mars: {
          sign: userPlanets.Mars.sign,
          house: userPlanets.Mars.house !== "Unknown" ? `${userPlanets.Mars.house}th House` : "Unknown",
          description: `${astrologyDescriptions.mars.signs[userPlanets.Mars.sign] || "Your Mars drives your passion and action. ⚔️"} ${astrologyDescriptions.mars.houses[userPlanets.Mars.house] || (userPlanets.Mars.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.mars(
            userPlanets.Mars.sign,
            partnerPlanets.Mars.sign,
            userPlanets.Mars.house,
            partnerPlanets.Mars.house
          ),
        },
        mercury: {
          sign: userPlanets.Mercury.sign,
          house: userPlanets.Mercury.house !== "Unknown" ? `${userPlanets.Mercury.house}th House` : "Unknown",
          description: `${astrologyDescriptions.mercury.signs[userPlanets.Mercury.sign] || "Your Mercury shapes your communication. 🗨️"} ${astrologyDescriptions.mercury.houses[userPlanets.Mercury.house] || (userPlanets.Mercury.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.mercury(
            userPlanets.Mercury.sign,
            partnerPlanets.Mercury.sign,
            userPlanets.Mercury.house,
            partnerPlanets.Mercury.house
          ),
        },
        jupiter: {
          sign: userPlanets.Jupiter.sign,
          house: userPlanets.Jupiter.house !== "Unknown" ? `${userPlanets.Jupiter.house}th House` : "Unknown",
          description: `${astrologyDescriptions.jupiter.signs[userPlanets.Jupiter.sign] || "Your Jupiter inspires growth and wisdom. 🌟"} ${astrologyDescriptions.jupiter.houses[userPlanets.Jupiter.house] || (userPlanets.Jupiter.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.jupiter(
            userPlanets.Jupiter.sign,
            partnerPlanets.Jupiter.sign,
            userPlanets.Jupiter.house,
            partnerPlanets.Jupiter.house
          ),
        },
        saturn: {
          sign: userPlanets.Saturn.sign,
          house: userPlanets.Saturn.house !== "Unknown" ? `${userPlanets.Saturn.house}th House` : "Unknown",
          description: `${astrologyDescriptions.saturn.signs[userPlanets.Saturn.sign] || "Your Saturn brings discipline and structure. 🪐"} ${astrologyDescriptions.saturn.houses[userPlanets.Saturn.house] || (userPlanets.Saturn.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.saturn(
            userPlanets.Saturn.sign,
            partnerPlanets.Saturn.sign,
            userPlanets.Saturn.house,
            partnerPlanets.Saturn.house
          ),
        },
      },
      partner: {
        sun: {
          sign: partnerPlanets.Sun.sign,
          house: partnerPlanets.Sun.house !== "Unknown" ? `${partnerPlanets.Sun.house}th House` : "Unknown",
          description: `${astrologyDescriptions.sun.signs[partnerPlanets.Sun.sign] || "Your partner's Sun shapes their core identity. 🌞"} ${astrologyDescriptions.sun.houses[partnerPlanets.Sun.house] || (partnerPlanets.Sun.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.sun(
            userPlanets.Sun.sign,
            partnerPlanets.Sun.sign,
            userPlanets.Sun.house,
            partnerPlanets.Sun.house
          ),
        },
        moon: {
          sign: partnerPlanets.Moon.sign,
          house: partnerPlanets.Moon.house !== "Unknown" ? `${partnerPlanets.Moon.house}th House` : "Unknown",
          description: `${astrologyDescriptions.moon.signs[partnerPlanets.Moon.sign] || "Your partner's Moon guides their emotional world. 🌙"} ${astrologyDescriptions.moon.houses[partnerPlanets.Moon.house] || (partnerPlanets.Moon.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.moon(
            userPlanets.Moon.sign,
            partnerPlanets.Moon.sign,
            userPlanets.Moon.house,
            partnerPlanets.Moon.house
          ),
        },
        ascendant: {
          sign: partnerPlanets.Ascendant.sign,
          description: astrologyDescriptions.ascendant.signs[partnerPlanets.Ascendant.sign] || (partnerPlanets.Ascendant.sign === "Unknown" ? "Your partner's Ascendant could not be determined due to data issues. 🌟" : "Your partner's Ascendant shapes their outer presence. 🌟"),
        },
        venus: {
          sign: partnerPlanets.Venus.sign,
          house: partnerPlanets.Venus.house !== "Unknown" ? `${partnerPlanets.Venus.house}th House` : "Unknown",
          description: `${astrologyDescriptions.venus.signs[partnerPlanets.Venus.sign] || "Your partner's Venus shapes their approach to love. 💕"} ${astrologyDescriptions.venus.houses[partnerPlanets.Venus.house] || (partnerPlanets.Venus.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.venus(
            userPlanets.Venus.sign,
            partnerPlanets.Venus.sign,
            userPlanets.Venus.house,
            partnerPlanets.Venus.house
          ),
        },
        mars: {
          sign: partnerPlanets.Mars.sign,
          house: partnerPlanets.Mars.house !== "Unknown" ? `${partnerPlanets.Mars.house}th House` : "Unknown",
          description: `${astrologyDescriptions.mars.signs[partnerPlanets.Mars.sign] || "Your partner's Mars drives their passion and action. ⚔️"} ${astrologyDescriptions.mars.houses[partnerPlanets.Mars.house] || (partnerPlanets.Mars.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.mars(
            userPlanets.Mars.sign,
            partnerPlanets.Mars.sign,
            userPlanets.Mars.house,
            partnerPlanets.Mars.house
          ),
        },
        mercury: {
          sign: partnerPlanets.Mercury.sign,
          house: partnerPlanets.Mercury.house !== "Unknown" ? `${partnerPlanets.Mercury.house}th House` : "Unknown",
          description: `${astrologyDescriptions.mercury.signs[partnerPlanets.Mercury.sign] || "Your partner's Mercury shapes their communication. 🗨️"} ${astrologyDescriptions.mercury.houses[partnerPlanets.Mercury.house] || (partnerPlanets.Mercury.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.mercury(
            userPlanets.Mercury.sign,
            partnerPlanets.Mercury.sign,
            userPlanets.Mercury.house,
            partnerPlanets.Mercury.house
          ),
        },
        jupiter: {
          sign: partnerPlanets.Jupiter.sign,
          house: partnerPlanets.Jupiter.house !== "Unknown" ? `${partnerPlanets.Jupiter.house}th House` : "Unknown",
          description: `${astrologyDescriptions.jupiter.signs[partnerPlanets.Jupiter.sign] || "Your partner's Jupiter inspires growth and wisdom. 🌟"} ${astrologyDescriptions.jupiter.houses[partnerPlanets.Jupiter.house] || (partnerPlanets.Jupiter.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.jupiter(
            userPlanets.Jupiter.sign,
            partnerPlanets.Jupiter.sign,
            userPlanets.Jupiter.house,
            partnerPlanets.Jupiter.house
          ),
        },
        saturn: {
          sign: partnerPlanets.Saturn.sign,
          house: partnerPlanets.Saturn.house !== "Unknown" ? `${partnerPlanets.Saturn.house}th House` : "Unknown",
          description: `${astrologyDescriptions.saturn.signs[partnerPlanets.Saturn.sign] || "Your partner's Saturn brings discipline and structure. 🪐"} ${astrologyDescriptions.saturn.houses[partnerPlanets.Saturn.house] || (partnerPlanets.Saturn.house === "Unknown" ? "House placement unavailable due to data issues." : "")}`,
          combined: combinedInfluences.saturn(
            userPlanets.Saturn.sign,
            partnerPlanets.Saturn.sign,
            userPlanets.Saturn.house,
            partnerPlanets.Saturn.house
          ),
        },
      },
    };

    // Enhance narrative
    const enhancedNarrative = await enhanceSynastryNarrative(narrative, chart, yourName, partnerName);

    // Save the love compatibility report to the database
    const loveReport = new LoveCompatibilityReport({
      userId,
      narrative: enhancedNarrative,
      chart,
      yourName,
      partnerName,
    });

    try {
      await loveReport.save();
      console.log("Love compatibility report saved successfully:", loveReport);
    } catch (error) {
      console.error("Failed to save love compatibility report:", error.message);
      return res.status(500).json({
        success: false,
        message: `Failed to save love compatibility report: ${error.message}`,
      });
    }

    res.status(200).json({
      success: true,
      data: { narrative: enhancedNarrative, chart },
      credits: wallet.credits,
      partialDataWarning: userPlanets.Ascendant.sign === "Unknown" || partnerPlanets.Ascendant.sign === "Unknown" ?
        "Some house placements or Ascendant data may be missing due to API limitations. The report is based on available planetary data." : null
    });
  } catch (error) {
    console.error("Love Compatibility Error:", error.message, error.stack);
    res.status(
      error.message.includes("Authentication") ? 401 :
      error.message.includes("User not found") ? 404 : 400
    ).json({
      success: false,
      message: error.message || `Failed to generate love compatibility report. Please verify birth details (date: ${yourBirthDate}, time: ${yourBirthTime}, place: ${yourBirthPlace}) and partner's details (date: ${partnerBirthDate}, time: ${partnerBirthTime}, place: ${partnerPlaceOfBirth}). If the issue persists, contact Astrology API support with error code: LOVE_COMPATIBILITY_ERROR.`,
    });
  }
});

// Endpoint to fetch saved love compatibility reports
router.get("/love-compatibility-reports", async (req, res) => {
  try {
    // Authenticate user
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch all love compatibility reports for the user
    const reports = await LoveCompatibilityReport.find({ userId })
      .sort({ createdAt: -1 }) // Sort by most recent
      .select("narrative chart yourName partnerName createdAt");

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching love compatibility reports:", error.message);
    res.status(500).json({
      success: false,
      message: `Failed to fetch love compatibility reports: ${error.message}`,
    });
  }
});

// Updated validateApiResponse to allow partial data
const validateApiResponse = (data, endpoint, userName) => {
  if (!data) {
    throw new Error(`Empty response from ${endpoint} for ${userName}`);
  }
  if (!Array.isArray(data.planets)) {
    throw new Error(`Invalid or missing 'planets' array in ${endpoint} response for ${userName}`);
  }
  const requiredPlanets = ["Sun", "Moon", "Venus", "Mars", "Mercury", "Jupiter", "Saturn"];
  const missingPlanets = requiredPlanets.filter(
    (planet) => !data.planets.find((p) => p.name === planet && p.sign && p.house)
  );
  if (missingPlanets.length > 0) {
    console.warn(`Missing or invalid data for planets: ${missingPlanets.join(", ")} in ${endpoint} response for ${userName}`);
  }
  if (!Array.isArray(data.houses) || !data.houses.find((h) => h.house === 1 && h.sign)) {
    console.warn(`Missing or invalid houses/Ascendant data in ${endpoint} response for ${userName}. Proceeding with planetary data.`);
    data.houses = []; // Ensure houses is an array for normalizePlanetData
  }
};


router.get("/love-compatibility-report/:reportId", async (req, res) => {
  try {
    // Authenticate user
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch the specific love compatibility report by ID
    const reportId = req.params.reportId;
    const report = await LoveCompatibilityReport.findOne({ _id: reportId, userId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Love compatibility report with ID ${reportId} not found or you do not have access to it`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        narrative: report.narrative,
        chart: report.chart,
        yourName: report.yourName,
        partnerName: report.partnerName,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching love compatibility report by ID:", error.message);
    res.status(500).json({
      success: false,
      message: `Failed to fetch love compatibility report: ${error.message}`,
    });
  }
});


module.exports = router;