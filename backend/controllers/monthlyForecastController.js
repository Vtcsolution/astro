
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const OpenAI = require("openai");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const MonthlyForecastReport = require("../models/MonthlyForecastReport");
const { getCoordinatesFromCity } = require("../utils/geocode");

// Configure Axios retries
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => error.code === "ECONNABORTED" || error.response?.status >= 500,
});

const auth = {
  username: process.env.ASTROLOGY_API_USER_ID,
  password: process.env.ASTROLOGY_API_KEY,
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const astrologyDescriptions = {
  sun: {
    Aries: "Your Sun in Aries ignites a fiery, pioneering spirit. You’re bold, driven, and ready to lead with courage. 🔥",
    Taurus: "Your Sun in Taurus grounds you with steadfast determination and a love for stability. 🌳",
    Gemini: "Your Sun in Gemini sparks curiosity, adaptability, and a knack for communication. 🗣️",
    Cancer: "Your Sun in Cancer nurtures with deep emotional wisdom and a caring heart. 🌙",
    Leo: "Your Sun in Leo radiates confidence, charisma, and a flair for the dramatic. 🦁",
    Virgo: "Your Sun in Virgo drives you to perfect your craft and serve others with precision. 🌾",
    Libra: "Your Sun in Libra seeks harmony, beauty, and balance in all things. ⚖️",
    Scorpio: "Your Sun in Scorpio burns with intensity, depth, and transformative power. 🦂",
    Sagittarius: "Your Sun in Sagittarius fuels adventure, optimism, and a quest for wisdom. 🏹",
    Capricorn: "Your Sun in Capricorn builds with ambition, discipline, and a focus on long-term goals. 🐐",
    Aquarius: "Your Sun in Aquarius innovates with visionary ideals and a unique perspective. ⚡️",
    Pisces: "Your Sun in Pisces flows with compassion, intuition, and a dreamy spirit. 🐟",
  },
  moon: {
    Aries: "Your Moon in Aries fuels your emotions with passion and quick reactions. 🔥",
    Taurus: "Your Moon in Taurus craves emotional stability and comfort. 🌳",
    Gemini: "Your Moon in Gemini makes your emotions lively, curious, and ever-changing. 🗣️",
    Cancer: "Your Moon in Cancer deepens your emotional sensitivity and nurturing instincts. 🌙",
    Leo: "Your Moon in Leo craves emotional expression and recognition. 🦁",
    Virgo: "Your Moon in Virgo seeks emotional order and practical solutions. 🌾",
    Libra: "Your Moon in Libra yearns for emotional balance and harmonious connections. ⚖️",
    Scorpio: "Your Moon in Scorpio feels with intense depth and transformative energy. 🦂",
    Sagittarius: "Your Moon in Sagittarius craves emotional freedom and exploration. 🏹",
    Capricorn: "Your Moon in Capricorn feels with discipline and a focus on responsibility. 🐐",
    Aquarius: "Your Moon in Aquarius feels with intellectual detachment and innovative ideas. ⚡️",
    Pisces: "Your Moon in Pisces flows with intuitive empathy and spiritual depth. 🐟",
  },
  ascendant: {
    Aries: "Your Aries Ascendant projects a bold, dynamic presence that commands attention. 🔥",
    Taurus: "Your Taurus Ascendant exudes calm reliability and a grounded charm. 🌳",
    Gemini: "Your Gemini Ascendant shines with curiosity and a communicative vibe. 🗣️",
    Cancer: "Your Cancer Ascendant radiates nurturing warmth and emotional depth. 🌙",
    Leo: "Your Leo Ascendant commands attention with charisma and confidence. 🦁",
    Virgo: "Your Virgo Ascendant shows precision, service, and a practical approach. 🌾",
    Libra: "Your Libra Ascendant charms with grace, diplomacy, and elegance. ⚖️",
    Scorpio: "Your Scorpio Ascendant exudes mystery and intense magnetism. 🦂",
    Sagittarius: "Your Sagittarius Ascendant projects optimism and an adventurous spirit. 🏹",
    Capricorn: "Your Capricorn Ascendant shows ambition and a disciplined demeanor. 🐐",
    Aquarius: "Your Aquarius Ascendant radiates uniqueness and forward-thinking energy. ⚡️",
    Pisces: "Your Pisces Ascendant flows with compassion and a dreamy aura. 🐟",
  },
};

async function enhanceNarrativeWithOpenAI(narrative, chart, forecast, firstName, month, year) {
  if (!openai) {
    console.error("OpenAI not initialized: Missing OPENAI_API_KEY");
    return {
      narrative: `Dear ${firstName}, as the stars align for ${monthNames[month - 1]} ${year}, your journey is filled with opportunities to shine. Your ${chart.sun.sign} Sun inspires your core energy, while your ${chart.moon.sign} Moon guides your emotions, and your ${chart.ascendant.sign} Ascendant shapes how others see you. Embrace this month’s cosmic flow with courage and wisdom. 🌟`,
      forecast: {
        overview: forecast.overview || `This month, ${firstName}, the universe invites you to embrace new possibilities. Trust your intuition and stay open to growth.`,
        career: forecast.career || `Your professional path shines bright, ${firstName}. Use your ${chart.sun.sign} strengths to take initiative and pursue new goals. For example, consider leading a project or sharing your ideas in a meeting.`,
        relationships: forecast.relationships || `Deepen your connections, ${firstName}, by showing empathy and openness. Your ${chart.moon.sign} Moon encourages heartfelt conversations. Plan a coffee date or a kind gesture to strengthen bonds.`,
        personalGrowth: forecast.personalGrowth || `This is a time for self-discovery, ${firstName}. Reflect on your dreams through journaling or meditation, guided by your ${chart.ascendant.sign} Ascendant’s unique perspective.`,
        challenges: forecast.challenges || `Obstacles may test your patience, ${firstName}. Stay grounded with your ${chart.sun.sign} resilience. If stress arises, take a walk or breathe deeply to find clarity.`,
      },
    };
  }
  try {
    const prompt = `
      You are an expert astrologer crafting a warm, engaging, and personalized monthly forecast for ${firstName} for ${monthNames[month - 1]} ${year}. Base it on their Sun (${chart.sun.sign}), Moon (${chart.moon.sign}), Ascendant (${chart.ascendant.sign}), and real-time transit data. Use the provided narrative and forecast as a starting point, weaving in how these placements and transits shape the month. Include specific themes: career, relationships, personal growth, and challenges. Highlight strengths to leverage, challenges to navigate, and practical advice with real-life examples. Use a warm, spiritual tone, keeping the narrative under 400 words and each forecast section under 100 words.

      Original Narrative: ${narrative}
      Original Forecast:
      - Career: ${forecast.career || "No career data provided"}
      - Relationships: ${forecast.relationships || "No relationship data provided"}
      - Personal Growth: ${forecast.personalGrowth || "No personal growth data provided"}
      - Challenges: ${forecast.challenges || "No challenges data provided"}

      Astrology Data:
      - Sun: ${chart.sun.sign} - ${chart.sun.description}
      - Moon: ${chart.moon.sign} - ${chart.moon.description}
      - Ascendant: ${chart.ascendant.sign} - ${chart.ascendant.description}

      Return JSON with narrative and forecast fields.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a warm, insightful Astrology Coach." },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });
    console.log("OpenAI Response:", response.choices[0].message.content);
    return JSON.parse(response.choices[0].message.content.trim());
  } catch (error) {
    console.error("OpenAI Error:", error.message, error.response?.data);
    return {
      narrative: `Dear ${firstName}, as the stars align for ${monthNames[month - 1]} ${year}, your journey is filled with opportunities to shine. Your ${chart.sun.sign} Sun inspires your core energy, while your ${chart.moon.sign} Moon guides your emotions, and your ${chart.ascendant.sign} Ascendant shapes how others see you. Embrace this month’s cosmic flow with courage and wisdom. 🌟`,
      forecast: {
        overview: forecast.overview || `This month, ${firstName}, the universe invites you to embrace new possibilities. Trust your intuition and stay open to growth.`,
        career: forecast.career || `Your professional path shines bright, ${firstName}. Use your ${chart.sun.sign} strengths to take initiative and pursue new goals. For example, consider leading a project or sharing your ideas in a meeting.`,
        relationships: forecast.relationships || `Deepen your connections, ${firstName}, by showing empathy and openness. Your ${chart.moon.sign} Moon encourages heartfelt conversations. Plan a coffee date or a kind gesture to strengthen bonds.`,
        personalGrowth: forecast.personalGrowth || `This is a time for self-discovery, ${firstName}. Reflect on your dreams through journaling or meditation, guided by your ${chart.ascendant.sign} Ascendant’s unique perspective.`,
        challenges: forecast.challenges || `Obstacles may test your patience, ${firstName}. Stay grounded with your ${chart.sun.sign} resilience. If stress arises, take a walk or breathe deeply to find clarity.`,
      },
    };
  }
}

async function generateMonthlyForecast(firstName, birthDate, birthTime, birthPlace, month, year) {
  console.log(`Generating monthly forecast for ${firstName}, Birthdate: ${birthDate}, BirthTime: ${birthTime}, BirthPlace: ${birthPlace}, Month: ${month}, Year: ${year}`);
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  let [hour, min] = birthTime.split(":").map(Number);

  // Validate inputs
  const date = new Date(birthYear, birthMonth - 1, birthDay);
  if (isNaN(date) || date.getFullYear() !== birthYear || date.getMonth() + 1 !== birthMonth || date.getDate() !== birthDay) {
    throw new Error("Invalid birth date format. Use YYYY-MM-DD.");
  }
  if (isNaN(hour) || isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
    throw new Error("Invalid birth time format. Use HH:MM.");
  }

  // Normalize birth place
  const normalizedBirthPlace = birthPlace.trim().replace(/\s+/g, ", ");

  // Fetch coordinates
  let latitude, longitude;
  try {
    const coordinates = await getCoordinatesFromCity(normalizedBirthPlace);
    ({ latitude, longitude } = coordinates);
    console.log(`Coordinates for ${normalizedBirthPlace}: ${latitude}, ${longitude}`);
  } catch (error) {
    console.error("Geocoding failed:", error.message);
    if (normalizedBirthPlace.toLowerCase().includes("lahore")) {
      latitude = 31.5656822;
      longitude = 74.3141829;
      console.log(`Using fallback coordinates for Lahore: ${latitude}, ${longitude}`);
    } else {
      throw new Error(`Failed to fetch coordinates for birth place "${normalizedBirthPlace}". Please use a valid city and country (e.g., "Lahore, Pakistan").`);
    }
  }

  // Fetch timezone
  let tzone;
  try {
    const tzRes = await axios.post(
      "https://json.astrologyapi.com/v1/timezone_with_dst",
      { latitude, longitude, date: birthDate },
      { auth }
    );
    tzone = tzRes.data.timezone;
    console.log(`Timezone for ${normalizedBirthPlace}: ${tzone}`);
  } catch (error) {
    console.error("Timezone API Error:", error.message);
    tzone = 5; // Fallback for Lahore, Pakistan
    console.log(`Using fallback timezone: ${tzone}`);
  }

  // Prepare payload for monthly forecast
  const payload = {
    day: Number(birthDay),
    month: Number(birthMonth),
    year: Number(birthYear),
    hour: Number(hour),
    min: Number(min),
    lat: parseFloat(latitude),
    lon: parseFloat(longitude),
    tzone: Number(tzone),
    prediction_month: Number(month),
    prediction_year: Number(year),
  };

  console.log("AstrologyAPI Payload:", JSON.stringify(payload, null, 2));

  let narrative, forecast, chart;
  try {
    console.log("Fetching monthly forecast from AstrologyAPI...");
    const response = await axios.post(
      "https://json.astrologyapi.com/v1/life_forecast_report/tropical",
      payload,
      { auth }
    );
    console.log("AstrologyAPI Response:", JSON.stringify(response.data, null, 2));
    const data = response.data;

    // Extract narrative and forecast with defaults
    narrative = data.prediction || `Dear ${firstName}, as the stars align for ${monthNames[month - 1]} ${year}, your journey is filled with opportunities to shine. Your cosmic path is guided by purpose and growth. 🌟`;
    forecast = {
      overview: data.prediction || `This month, ${firstName}, the universe invites you to embrace new possibilities. Trust your intuition and stay open to growth.`,
      career: data.career || `Your professional path shines bright, ${firstName}. Use your unique strengths to take initiative and pursue new goals. For example, consider leading a project or sharing your ideas in a meeting.`,
      relationships: data.relationships || `Deepen your connections, ${firstName}, by showing empathy and openness. Plan a coffee date or a kind gesture to strengthen bonds.`,
      personalGrowth: data.personalGrowth || `This is a time for self-discovery, ${firstName}. Reflect on your dreams through journaling or meditation to find inner clarity.`,
      challenges: data.challenges || `Obstacles may test your patience, ${firstName}. Stay grounded and take a walk or breathe deeply to find clarity when stress arises.`,
    };

    // Fetch chart data for context
    const planetResponse = await axios.post(
      "https://json.astrologyapi.com/v1/planets/tropical",
      {
        day: Number(birthDay),
        month: Number(birthMonth),
        year: Number(birthYear),
        hour: Number(hour),
        min: Number(min),
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        tzone: Number(tzone),
      },
      { auth }
    );
    const planetData = planetResponse.data;
    const sunData = planetData.find(planet => planet.name.toLowerCase() === "sun") || {};
    const moonData = planetData.find(planet => planet.name.toLowerCase() === "moon") || {};
    const ascendantData = planetData.find(planet => planet.name.toLowerCase() === "ascendant") || {};

    chart = {
      sun: {
        sign: sunData.sign || "Unknown",
        description: astrologyDescriptions.sun[sunData.sign] || "Your Sun sign shapes your core identity with unique energy. 🌞",
      },
      moon: {
        sign: moonData.sign || "Unknown",
        description: astrologyDescriptions.moon[moonData.sign] || "Your Moon sign guides your emotional world with depth. 🌙",
      },
      ascendant: {
        sign: ascendantData.sign || "Unknown",
        description: astrologyDescriptions.ascendant[ascendantData.sign] || "Your Ascendant shapes how others see you with distinct charm. 🌟",
      },
    };
  } catch (error) {
    console.error("AstrologyAPI Error:", error.message, error.response?.status, error.response?.data);
    console.log("Falling back to local calculations...");
    chart = {
      sun: { sign: "Unknown", description: "Your Sun sign shapes your core identity with unique energy. 🌞" },
      moon: { sign: "Unknown", description: "Your Moon sign guides your emotional world with depth. 🌙" },
      ascendant: { sign: "Unknown", description: "Your Ascendant shapes how others see you with distinct charm. 🌟" },
    };
    narrative = `Dear ${firstName}, as the stars align for ${monthNames[month - 1]} ${year}, your journey is filled with opportunities to shine. Your cosmic path is guided by purpose and growth. 🌟`;
    forecast = {
      overview: `This month, ${firstName}, the universe invites you to embrace new possibilities. Trust your intuition and stay open to growth.`,
      career: `Your professional path shines bright, ${firstName}. Use your unique strengths to take initiative and pursue new goals. For example, consider leading a project or sharing your ideas in a meeting.`,
      relationships: `Deepen your connections, ${firstName}, by showing empathy and openness. Plan a coffee date or a kind gesture to strengthen bonds.`,
      personalGrowth: `This is a time for self-discovery, ${firstName}. Reflect on your dreams through journaling or meditation to find inner clarity.`,
      challenges: `Obstacles may test your patience, ${firstName}. Stay grounded and take a walk or breathe deeply to find clarity when stress arises.`,
    };
  }

  // Enhance narrative and forecast with OpenAI
  const { narrative: enhancedNarrative, forecast: enhancedForecast } = await enhanceNarrativeWithOpenAI(
    narrative,
    chart,
    forecast,
    firstName,
    month,
    year
  );

  return { narrative: enhancedNarrative, chart, forecast: enhancedForecast, predictionMonth: month, predictionYear: year };
}

exports.generateMonthlyForecast = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet || wallet.credits < 5) {
      return res.status(400).json({ success: false, message: "Insufficient credits" });
    }

    const nameParts = user.username.trim().split(/\s+/);
    const firstName = nameParts[0];
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(user.username)) {
      return res.status(400).json({ success: false, message: "Invalid name format in user profile" });
    }

    if (!user.dob || !user.birthTime || !user.birthPlace) {
      return res.status(400).json({
        success: false,
        message: "Please update your profile with date of birth, birth time, and birth place",
      });
    }

    if (!user.birthTime.match(/^([01]?\d|2[0-3]):([0-5]?\d)$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid birth time format in profile. Please use HH:MM (24-hour)",
      });
    }

    const birthDate = new Date(user.dob).toISOString().split("T")[0];
    const birthTime = user.birthTime;
    const birthPlace = user.birthPlace;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    wallet.credits -= 5;
    await wallet.save();

    const reportData = await generateMonthlyForecast(firstName, birthDate, birthTime, birthPlace, month, year);

    const report = await MonthlyForecastReport.create({
      userId: user._id,
      narrative: reportData.narrative,
      chart: reportData.chart,
      forecast: reportData.forecast,
      predictionMonth: reportData.predictionMonth,
      predictionYear: reportData.predictionYear,
    });

    console.log("Monthly forecast saved successfully:", report._id);
    res.status(200).json({
      success: true,
      data: report,
      credits: wallet.credits,
    });
  } catch (error) {
    console.error("Monthly Forecast Error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message.includes("coordinates")
        ? `Invalid birth place "${user ? user.birthPlace : "unknown"}". Please use a valid city and country (e.g., "Lahore, Pakistan")`
        : error.message || "Failed to generate monthly forecast. 😔",
    });
  }
};

exports.getMonthlyForecasts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const reports = await MonthlyForecastReport.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Get Monthly Forecasts Error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly forecasts. 😔",
    });
  }
};
