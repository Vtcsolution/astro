const { OpenAI } = require("openai");
const axios = require("axios");
const ChatMessage = require("../models/chatMessage");
const AiPsychic = require("../models/aiPsychic");
const AiFormData = require("../models/aiFormData");
const { getCoordinatesFromCity } = require("../utils/geocode");
const { getRequiredFieldsByType } = require("../utils/formLogic");
const Wallet = require("../models/Wallet");
const User = require ("../models/User")
const mongoose  = require ("mongoose");
const ActiveSession = require("../models/ActiveSession");
const { checkAndUpdateTimer } = require("../utils/timerUtils");
const { processEmojis, addContextualEmojis } = require("../utils/emojiUtils");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim()
});

if (!process.env.OPENAI_API_KEY) {
  process.exit(1);
}
const auth = {
  username: process.env.ASTROLOGY_API_USER_ID,
  password: process.env.ASTROLOGY_API_KEY,
};

function getSignFromDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
  
  return null;
}

const parseTime = (timeStr = "") => {
  const [hourStr, minStr] = timeStr.split(":");
  return {
    hour: parseInt(hourStr, 10) || 0,
    min: parseInt(minStr, 10) || 0,
  };
};

const parseDateParts = (dateStr = "") => {
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    return { day: 1, month: 1, year: 2000 };
  }
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
};

const getWesternChartData = async (formData, coords) => {
  const { hour, min } = parseTime(formData.birthTime);

  let timezone = 0;
  try {
    const tzRes = await axios.post(
      "https://json.astrologyapi.com/v1/timezone_with_dst",
      { latitude: coords.latitude, longitude: coords.longitude, date: formData.birthDate },
      { auth }
    );
    timezone = tzRes.data.timezone;
  } catch (err) {
    console.warn("Timezone API fallback used:", err?.response?.data || err.message);
  }

  const payload = {
    day: new Date(formData.birthDate).getDate(),
    month: new Date(formData.birthDate).getMonth() + 1,
    year: new Date(formData.birthDate).getFullYear(),
    hour,
    min,
    lat: coords.latitude,
    lon: coords.longitude,
    tzone: timezone,
  };

  const [chart, personality, planets, houses] = await Promise.all([
    axios.post("https://json.astrologyapi.com/v1/western_chart_data", payload, { auth }),
    axios.post("https://json.astrologyapi.com/v1/personality_report/tropical", payload, { auth }),
    axios.post("https://json.astrologyapi.com/v1/planets/tropical", payload, { auth }),
    axios.post("https://json.astrologyapi.com/v1/house_cusps/tropical", payload, { auth }),
  ]);

  return {
    sunSign: chart.data?.sun?.sign || "Unknown",
    moonSign: chart.data?.moon?.sign || "Unknown",
    ascendant: chart.data?.ascendant?.sign || "Unknown",
    planets: Array.isArray(planets.data) ? planets.data : [],
    houses: typeof houses.data === "object" ? houses.data : {},
    personality: personality.data?.traits || [],
    payload,
    timezone,
  };
};

const checkChatAvailability = async (userId, psychicId) => {
  return await checkAndUpdateTimer(userId, psychicId);
};

const chatWithPsychic = async (req, res) => {
  try {
    const userId = req.user._id;
    const psychicId = req.params.psychicId;
    const { message } = req.body;

    // Process emojis in user message
    const emojiData = processEmojis(message);
    const emojiContext = emojiData.length > 0
      ? `User included emojis: ${emojiData.map(e => `${e.emoji} (${e.meaning})`).join(", ")}.`
      : "No emojis used by user.";

    const { available, message: availabilityMessage, isFree } = await checkChatAvailability(userId, psychicId);
    if (!available) {
      const chat = await ChatMessage.findOne({ userId, psychicId }) || new ChatMessage({ userId, psychicId, messages: [] });
      const fallbackText = availabilityMessage || "Please purchase credits to continue your reading. 💳";
      chat.messages.push({ 
        sender: "ai", 
        text: fallbackText,
        emojiMetadata: [],
      });
      await chat.save();
 
      return res.status(402).json({ 
        success: false, 
        reply: fallbackText,
        creditRequired: true,
        messages: chat.messages,
      });
    }

    if (!psychicId || !message) {
      return res.status(400).json({ success: false, message: "Psychic ID and message are required. ❗" });
    }
    const psychic = await AiPsychic.findById(psychicId);
    if (!psychic) return res.status(404).json({ success: false, message: "Psychic not found. 🔍" });

    const { type } = psychic;
    let f = {};

    if (type !== "Tarot") {
      const requiredFields = getRequiredFieldsByType(type);
      const form = await AiFormData.findOne({ userId, type });

      if (!form?.formData) {
        return res.status(400).json({ 
          success: false, 
          message: `Please fill the ${type} form first 📝` 
        });
      }

      f = form.formData;
      const missingFields = requiredFields.filter(field => !f[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing fields: ${missingFields.join(", ")} ❓` 
        });
      }
    }

    let chat = await ChatMessage.findOne({ userId, psychicId }) || new ChatMessage({ userId, psychicId, messages: [] });
    chat.messages.push({ sender: "user", text: message, emojiMetadata: emojiData });
    await chat.save(); // Save user message with emoji metadata

    const addTimerMetadata = async (response, userId, psychicId, isFree) => {
      const session = await ActiveSession.findOne({ userId, psychicId });
      const now = new Date();
      
      let minutesToCharge = 0;
      if (!isFree && session) {
        minutesToCharge = Math.floor((now - session.lastChargeTime) / 60000);
      }

      return {
        ...response,
        meta: {
          isFreePeriod: isFree,
          remainingFreeTime: isFree && session 
            ? Math.max(0, session.freeEndTime - now) 
            : 0,
          creditsDeducted: !isFree ? minutesToCharge : 0,
        },
      };
    };

    if (type === "Astrology") {
      const coords = await getCoordinatesFromCity(f.birthPlace);
      const western = await getWesternChartData(f, coords);

      const planetDetails = western.planets.map(p =>
        `- ${p.name}: ${p.sign} (House ${p.house || "N/A"})`
      ).join("\n");

      const houseDetails = Object.entries(western.houses).map(
        ([num, data]) => `- House ${num}: ${data?.sign || "Unknown"}`
      ).join("\n");

      const systemContent = `
You are a professional Western astrologer giving spiritual readings. Use emojis to make responses engaging, similar to WhatsApp style (e.g., 🌟 for hope, ❤️ for love, 😊 for positivity).

${emojiContext}

Client Details:
• Name: ${f.yourName || "N/A"}
• Birth Date & Time: ${f.birthDate} at ${f.birthTime}
• Birth Place: ${f.birthPlace}
• Coordinates: ${coords.latitude}, ${coords.longitude}
• Timezone Used: ${western.timezone}

🌞 Sun Sign: ${western.sunSign}
🌙 Moon Sign: ${western.moonSign}
⬆ Ascendant: ${western.ascendant}

🔭 Planetary Positions:
${planetDetails}

🏠 House Cusps:
${houseDetails}

🧠 Personality Traits:
${western.personality.join("\n")}

Please provide a deep, mystical, and personalized astrology reading.
Focus especially on:
- Sun, Moon, Mars, Venus, and Ascendant
- Interpret their signs and house placements clearly
- Offer life guidance, emotional patterns, and soul purpose from the chart.
- Use emojis to enhance the tone (e.g., 🌟, ❤️, 😊) where appropriate.
- Keep the response warm and engaging, under 300 words.
      `.trim();

      const messagesForAI = [
        { role: "system", content: systemContent },
        ...chat.messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messagesForAI,
        temperature: 0.75,
      });

      let aiText = completion.choices[0].message.content;
      aiText = addContextualEmojis(aiText, type);

      chat.messages.push({ sender: "ai", text: aiText, emojiMetadata: processEmojis(aiText) });
      await chat.save();

      const response = {
        success: true,
        reply: aiText,
        messages: chat.messages,
        source: "AstrologyAPI + GPT-4",
      };
      const responseWithMetadata = await addTimerMetadata(response, userId, psychicId, isFree);
      return res.status(200).json(responseWithMetadata);
    } else if (type === "Love") {
      
      console.log('[Love Psychic] Starting enhanced love reading process...');

      const lowerMessage = message.toLowerCase().trim();
      
      if (lowerMessage.includes('my info') || lowerMessage.includes('my information')) {
        const userInfo = `
Your Information:
• Name: ${f.yourName}
• Birth Date: ${f.yourBirthDate}
• Birth Time: ${f.yourBirthTime}
• Birth Place: ${f.yourBirthPlace}
• Zodiac Sign: ${getSignFromDate(f.yourBirthDate) || 'Unknown'} ♈
        `.trim();
        
        chat.messages.push({ sender: "ai", text: userInfo, emojiMetadata: processEmojis(userInfo) });
        await chat.save();
        return res.status(200).json({
          success: true,
          reply: userInfo,
          messages: chat.messages,
        });
      }
      
      if (lowerMessage.includes('partner info') || lowerMessage.includes('partner name') || 
          lowerMessage.includes('my partner')) {
        if (!f.partnerName) {
          const noPartnerMsg = "You haven't provided partner information yet. 😔";
          chat.messages.push({ sender: "ai", text: noPartnerMsg, emojiMetadata: processEmojis(noPartnerMsg) });
          await chat.save();
          return res.status(200).json({
            success: true,
            reply: noPartnerMsg,
            messages: chat.messages,
          });
        }
        
        const partnerInfo = `
Partner Information:
• Name: ${f.partnerName}
• Birth Date: ${f.partnerBirthDate || 'Not provided'}
• Birth Time: ${f.partnerBirthTime || 'Not provided'}
• Birth Place: ${f.partnerPlaceOfBirth || 'Not provided'}
• Zodiac Sign: ${f.partnerBirthDate ? getSignFromDate(f.partnerBirthDate) || 'Unknown' : 'Not provided'} ♎
        `.trim();
        
        chat.messages.push({ sender: "ai", text: partnerInfo, emojiMetadata: processEmojis(partnerInfo) });
        await chat.save();
        return res.status(200).json({
          success: true,
          reply: partnerInfo,
          messages: chat.messages,
        });
      }

      const requiredFields = ['yourName', 'yourBirthDate', 'yourBirthTime', 'yourBirthPlace'];
      const missingFields = requiredFields.filter(field => !f[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')} ❗`,
        });
      }

      let userCoords, partnerCoords;
      try {
        userCoords = await getCoordinatesFromCity(f.yourBirthPlace);
        console.log(`[Geocode] User coordinates: ${JSON.stringify(userCoords)}`);
        
        if (f.partnerPlaceOfBirth) {
          partnerCoords = await getCoordinatesFromCity(f.partnerPlaceOfBirth);
          console.log(`[Geocode] Partner coordinates: ${JSON.stringify(partnerCoords)}`);
        }
      } catch (geoError) {
        console.warn('[Geocode] Error getting coordinates:', geoError.message);
        userCoords = { latitude: 0, longitude: 0 };
        partnerCoords = { latitude: 0, longitude: 0 };
      }

      const buildPayload = async (dateStr, timeStr, coords) => {
        if (!dateStr || isNaN(new Date(dateStr))) {
          throw new Error('Invalid date format');
        }
        
        const date = new Date(dateStr);
        const [hour = 12, min = 0] = (timeStr || '').split(':').map(Number);
        
        let timezone = 0;
        try {
          const tzRes = await axios.post(
            "https://json.astrologyapi.com/v1/timezone_with_dst",
            { 
              latitude: coords.latitude || 0, 
              longitude: coords.longitude || 0, 
              date: dateStr 
            },
            { auth, timeout: 5000 }
          );
          timezone = tzRes.data.timezone;
        } catch (err) {
          console.warn("Timezone API error, using default:", err.message);
        }

        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          hour: Math.min(23, Math.max(0, hour)),
          min: Math.min(59, Math.max(0, min)),
          lat: coords.latitude || 0,
          lon: coords.longitude || 0,
          tzone: timezone,
        };
      };

      let userPayload, partnerPayload;
      try {
        userPayload = await buildPayload(f.yourBirthDate, f.yourBirthTime, userCoords);
        console.log('[Payload] User payload prepared');
        
        if (f.partnerBirthDate) {
          partnerPayload = await buildPayload(f.partnerBirthDate, f.partnerBirthTime, partnerCoords || userCoords);
          console.log('[Payload] Partner payload prepared');
        }
      } catch (err) {
        console.error('[Payload] Error building payload:', err.message);
        throw new Error('Invalid birth data provided');
      }

      console.log('[API] Fetching essential astrological data...');
      let astrologyData = {
        userChart: null,
        partnerChart: null,
        compatibility: {
          zodiac: null,
          synastry: null,
        },
        planetaryData: {
          user: {},
          partner: {},
        },
        zodiacSigns: {
          user: getSignFromDate(f.yourBirthDate),
          partner: f.partnerBirthDate ? getSignFromDate(f.partnerBirthDate) : null,
        },
      };

      try {
        console.log('[API] Getting user chart and planets');
        const [userChartRes, userPlanetsRes, userPersonalityRes] = await Promise.all([
          axios.post("https://json.astrologyapi.com/v1/western_chart_data", userPayload, { auth }),
          axios.post("https://json.astrologyapi.com/v1/planets/tropical", userPayload, { auth }),
          axios.post("https://json.astrologyapi.com/v1/romantic_personality_report/tropical", userPayload, { auth }),
        ]);
        
        astrologyData.userChart = userChartRes.data;
        astrologyData.planetaryData.user = userPlanetsRes.data.reduce((acc, planet) => {
          const planetName = planet.name.toLowerCase();
          if (['sun', 'moon', 'venus', 'mars', 'ascendant'].includes(planetName)) {
            acc[planetName] = {
              sign: planet.sign,
              house: planet.house,
              degree: planet.normDegree,
              retrograde: planet.retrograde === "true",
            };
          }
          return acc;
        }, {});
        astrologyData.userPersonality = userPersonalityRes.data;
      } catch (err) {
        console.error('[API] Error fetching user data:', err.message);
        throw new Error('Failed to analyze your birth chart');
      }

      if (partnerPayload) {
        try {
          console.log('[API] Getting partner chart and synastry report');
          
          const [partnerChartRes, partnerPlanetsRes] = await Promise.all([
            axios.post("https://json.astrologyapi.com/v1/western_chart_data", partnerPayload, { auth }),
            axios.post("https://json.astrologyapi.com/v1/planets/tropical", partnerPayload, { auth }),
          ]);

          astrologyData.partnerChart = partnerChartRes.data;
          astrologyData.planetaryData.partner = partnerPlanetsRes.data.reduce((acc, planet) => {
            const planetName = planet.name.toLowerCase();
            if (['sun', 'moon', 'venus', 'mars', 'ascendant'].includes(planetName)) {
              acc[planetName] = {
                sign: planet.sign,
                house: planet.house,
                degree: planet.normDegree,
                retrograde: planet.retrograde === "true",
              };
            }
            return acc;
          }, {});

          try {
            const synastryRes = await axios.post(
              "https://json.astrologyapi.com/v1/synastry_horoscope",
              {
                p_day: userPayload.day,
                p_month: userPayload.month,
                p_year: userPayload.year,
                p_hour: userPayload.hour,
                p_min: userPayload.min,
                p_lat: userPayload.lat,
                p_lon: userPayload.lon,
                p_tzone: userPayload.tzone,
                s_day: partnerPayload.day,
                s_month: partnerPayload.month,
                s_year: partnerPayload.year,
                s_hour: partnerPayload.hour,
                s_min: partnerPayload.min,
                s_lat: partnerPayload.lat,
                s_lon: partnerPayload.lon,
                s_tzone: partnerPayload.tzone,
              },
              { 
                auth,
                headers: {
                  "Accept-Language": "en",
                },
              }
            );

            console.log('[API] Raw synastry response:', JSON.stringify(synastryRes.data, null, 2));
            
            if (synastryRes.data && typeof synastryRes.data === 'object') {
              astrologyData.compatibility.synastry = {
                compatibility_score: synastryRes.data.compatibility_score || 0,
                aspects: synastryRes.data.aspects || [],
                aspects_summary: synastryRes.data.aspects_summary || '',
                report: synastryRes.data.report || '',
              };
              
              console.log('[API] Synastry report processed:', {
                score: astrologyData.compatibility.synastry.compatibility_score,
                aspects: astrologyData.compatibility.synastry.aspects.length,
              });
            } else {
              throw new Error('Invalid synastry response structure');
            }
          } catch (synastryErr) {
            console.error('[API] Detailed synastry error:', {
              message: synastryErr.message,
              response: synastryErr.response?.data,
              stack: synastryErr.stack,
            });
            astrologyData.compatibility.zodiac = {
              compatibility_report: generateBasicCompatibility(
                astrologyData.zodiacSigns.user,
                astrologyData.zodiacSigns.partner
              ),
              isFallback: true,
            };
          }
        } catch (err) {
          console.error('[API] Partner data error:', err.message);
          astrologyData.compatibility.zodiac = {
            compatibility_report: generateBasicCompatibility(
              astrologyData.zodiacSigns.user,
              astrologyData.zodiacSigns.partner
            ),
            isFallback: true,
          };
        }
      }

      const systemContent = `
You are Amoura, a professional love psychic. Provide a reading using this astrological data. Use emojis to make responses engaging, similar to WhatsApp style (e.g., ❤️ for love, 😍 for attraction, 🌟 for hope).

${emojiContext}

USER PROFILE:
- Name: ${f.yourName}
- Sun: ${astrologyData.planetaryData.user.sun?.sign || 'Unknown'} (House ${astrologyData.planetaryData.user.sun?.house || 'N/A'}) ☀️
- Moon: ${astrologyData.planetaryData.user.moon?.sign || 'Unknown'} (House ${astrologyData.planetaryData.user.moon?.house || 'N/A'}) 🌙
- Venus: ${astrologyData.planetaryData.user.venus?.sign || 'Unknown'} (House ${astrologyData.planetaryData.user.venus?.house || 'N/A'}) 💖
- Mars: ${astrologyData.planetaryData.user.mars?.sign || 'Unknown'} (House ${astrologyData.planetaryData.user.mars?.house || 'N/A'}) 🔥
- Ascendant: ${astrologyData.planetaryData.user.ascendant?.sign || 'Unknown'} ⬆

${f.partnerName ? `
PARTNER PROFILE:
- Name: ${f.partnerName}
- Sun: ${astrologyData.planetaryData.partner.sun?.sign || 'Unknown'} ☀️
- Moon: ${astrologyData.planetaryData.partner.moon?.sign || 'Unknown'} 🌙
- Venus: ${astrologyData.planetaryData.partner.venus?.sign || 'Unknown'} 💖
- Mars: ${astrologyData.planetaryData.partner.mars?.sign || 'Unknown'} 🔥
- Ascendant: ${astrologyData.planetaryData.partner.ascendant?.sign || 'Unknown'} ⬆

COMPATIBILITY:
${astrologyData.compatibility.synastry ? `
- Synastry Score: ${astrologyData.compatibility.synastry.compatibility_score || 'N/A'} 💞
- Key Aspects: ${astrologyData.compatibility.synastry.aspects?.slice(0, 3).map(a => `${a.planet1} ${a.aspect} ${a.planet2}`).join(', ') || 'None'} 🔗
${astrologyData.compatibility.synastry.report ? `
- Summary: ${astrologyData.compatibility.synastry.report.substring(0, 150)}... 📜
` : ''}
` : astrologyData.compatibility.zodiac ? `
- Basic Compatibility: ${astrologyData.compatibility.zodiac.compatibility_report} 💑
` : 'No compatibility data available 😕'}
` : ''}

ROMANTIC TRAITS:
${astrologyData.userPersonality?.traits?.join(', ') || 'Not available'}

GUIDELINES:
1. Always mention specific planetary positions
2. Highlight Venus-Mars compatibility if partner data exists
3. Keep response under 250 words
4. End with one practical relationship tip
5. Use an empathetic, warm tone with emojis (e.g., ❤️, 😊, 🌟)
6. Include both strengths and challenges
      `.trim();

      const messagesForAI = [
        { role: "system", content: systemContent },
        ...chat.messages.slice(-3).map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text.length > 300 ? msg.text.substring(0, 300) + '...' : msg.text,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messagesForAI,
        temperature: 0.7,
        max_tokens: 350,
      });

      let aiResponse = completion.choices[0].message.content;
      aiResponse = addContextualEmojis(aiResponse, type);
      
      if (astrologyData.compatibility.zodiac?.isFallback) {
        aiResponse += "\n\nNote: This reading uses basic zodiac compatibility as full synastry data wasn't available. 😔";
      }

      chat.messages.push({ 
        sender: "ai", 
        text: aiResponse,
        emojiMetadata: processEmojis(aiResponse),
        metadata: {
          planetaryData: astrologyData.planetaryData,
          compatibility: {
            score: astrologyData.compatibility.synastry?.compatibility_score,
            aspects: astrologyData.compatibility.synastry?.aspects?.length,
            isFallback: !!astrologyData.compatibility.zodiac?.isFallback,
          },
          dataSources: [
            'western_chart_data',
            'planets/tropical',
            astrologyData.compatibility.synastry ? 'synastry_horoscope' : 'zodiac_compatibility',
            'romantic_personality_report',
          ],
        },
      });
      await chat.save();

      const response = {
        success: true,
        reply: aiResponse,
        messages: chat.messages,
        metadata: chat.messages[chat.messages.length - 1].metadata,
      };
      const responseWithMetadata = await addTimerMetadata(response, userId, psychicId, isFree);
      return res.status(200).json(responseWithMetadata);
    } else if (type === "Numerology") {
      console.log('[Numerology] Starting process for:', f.yourName, f.birthDate);

      const nameRegex = /^[a-zA-Z\s]+$/;
      if (!f.yourName || !nameRegex.test(f.yourName.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid name (letters only). ❗',
        });
      }

      if (!f.birthDate || isNaN(new Date(f.birthDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or missing birth date 📅',
        });
      }

      f.yourName = f.yourName.trim().replace(/\s+/g, ' ');

      const numerologyData = calculateManualNumbers(f.yourName, f.birthDate);
      console.log('[ManualCalculation] Numerology data:', numerologyData);

      const lowerMessage = message.toLowerCase().trim();
      if (
        lowerMessage.includes('my info') ||
        lowerMessage.includes('my profile') ||
        lowerMessage.includes('numerology profile')
      ) {
        const profileResponse = `
🔮 Your Numerology Profile:
• Life Path Number: ${numerologyData.lifePath} 🔢
• Soul Urge Number: ${numerologyData.soulUrge} 💖
• Personality Number: ${numerologyData.personality} 😊
• Expression Number: ${numerologyData.expression} 🌟
${numerologyData.karmicLessons?.length ? `• Karmic Lessons: ${numerologyData.karmicLessons.join(', ')} 📝` : ''}
${numerologyData.challenges?.length ? `• Challenges: ${formatChallenges(numerologyData.challenges)} ⚠️` : ''}

You can now ask: "What does my Life Path number mean?" or "Why is my Soul Urge number 6?"
Chat with Numara for deeper readings — first minute free! 🎉
        `.trim();

        chat.messages.push({ sender: "ai", text: profileResponse, emojiMetadata: processEmojis(profileResponse) });
        await chat.save();

        return res.status(200).json({
          success: true,
          reply: profileResponse,
          messages: chat.messages,
          numerologyData: {
            ...numerologyData,
            source: 'ManualCalculation',
          },
        });
      }

      const systemPrompt = `
You are Numara, a professional numerologist. Analyze the user's numerology profile and respond to their question using ONLY the information below. Use emojis to make responses engaging, similar to WhatsApp style (e.g., 🔢 for numbers, 🌟 for insights, 😊 for positivity).

${emojiContext}

Client Name: ${f.yourName}
Birth Date: ${f.birthDate}

🔢 Core Numbers:
- Life Path: ${numerologyData.lifePath} 🔢
- Soul Urge: ${numerologyData.soulUrge} 💖
- Personality: ${numerologyData.personality} 😊
- Expression: ${numerologyData.expression} 🌟
${numerologyData.karmicLessons?.length ? `- Karmic Lessons: ${numerologyData.karmicLessons.join(', ')} 📝` : ''}
${numerologyData.challenges?.length ? `- Challenges: ${formatChallenges(numerologyData.challenges)} ⚠️` : ''}

💬 User's Message: "${message}"

Respond clearly, professionally, and in a helpful tone. Avoid repeating the profile unless asked. Keep it under 350 words. Use emojis to enhance the response (e.g., 🔢, 🌟, 😊).
      `.trim();

      const messagesForAI = [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messagesForAI,
        temperature: 0.6,
        max_tokens: 400,
      });

      let aiText = completion.choices[0].message.content;
      aiText = addContextualEmojis(aiText, type);

      chat.messages.push({ sender: "ai", text: aiText, emojiMetadata: processEmojis(aiText), metadata: { numerologyData } });
      await chat.save();

      const response = {
        success: true,
        reply: aiText,
        messages: chat.messages,
        numerologyData: {
          ...numerologyData,
          source: 'ManualCalculation + GPT-4',
        },
      };
      const responseWithMetadata = await addTimerMetadata(response, userId, psychicId, isFree);
      return res.status(200).json(responseWithMetadata);
    } else if (type === "Tarot") {
      console.log('[Tarot] Starting Tarot reading...');
      
      const tarotSystemPrompt = `
You are Mystara, a deeply intuitive Tarot reader. The user is seeking guidance through the Tarot. Use emojis to make responses engaging, similar to WhatsApp style (e.g., 🔮 for intuition, 🃏 for cards, ✨ for magic).

${emojiContext}

Respond with a spiritual and empowering message. You may pull imaginary cards like The Lovers, The Tower, The Star, etc., and interpret them for the user. Guide them with insight and compassion. Use emojis to enhance the tone (e.g., 🔮, 🃏, ✨).
      `.trim();

      const messagesForAI = [
        { role: "system", content: tarotSystemPrompt },
        ...chat.messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messagesForAI,
        temperature: 0.8,
      });

      let aiText = completion.choices[0].message.content;
      aiText = addContextualEmojis(aiText, type);

      chat.messages.push({ sender: "ai", text: aiText, emojiMetadata: processEmojis(aiText) });
      await chat.save();

      const response = {
        success: true,
        reply: aiText,
        messages: chat.messages,
        source: "GPT-4 Tarot",
      };
      const responseWithMetadata = await addTimerMetadata(response, userId, psychicId, isFree);
      return res.status(200).json(responseWithMetadata);
    }
  } catch (err) {
    console.error("Chat Error:", err?.response?.data || err.message || err);
    const fallbackText = `We're sorry, something went wrong. Please try again later! 😔`;
    let chat = await ChatMessage.findOne({ userId, psychicId }) || new ChatMessage({ userId, psychicId, messages: [] });
    chat.messages.push({ sender: "ai", text: fallbackText, emojiMetadata: processEmojis(fallbackText) });
    await chat.save();
    res.status(500).json({ success: false, message: fallbackText, error: err.message });
  }
};

function generateBasicCompatibility(sign1, sign2) {
  if (!sign1 || !sign2) return 'Insufficient data for compatibility analysis';
  
  const compatibilityMap = {
    'Aries': { good: ['Leo', 'Sagittarius', 'Gemini'], challenging: ['Cancer', 'Capricorn'] },
    'Taurus': { good: ['Virgo', 'Capricorn', 'Cancer'], challenging: ['Leo', 'Aquarius'] },
    'Gemini': { good: ['Libra', 'Aquarius', 'Aries'], challenging: ['Virgo', 'Pisces'] },
    'Cancer': { good: ['Scorpio', 'Pisces', 'Taurus'], challenging: ['Aries', 'Libra'] },
    'Leo': { good: ['Aries', 'Sagittarius', 'Gemini'], challenging: ['Taurus', 'Scorpio'] },
    'Virgo': { good: ['Taurus', 'Capricorn', 'Cancer'], challenging: ['Gemini', 'Sagittarius'] },
    'Libra': { good: ['Gemini', 'Aquarius', 'Leo'], challenging: ['Cancer', 'Capricorn'] },
    'Scorpio': { good: ['Cancer', 'Pisces', 'Virgo'], challenging: ['Leo', 'Aquarius'] },
    'Sagittarius': { good: ['Aries', 'Leo', 'Aquarius'], challenging: ['Virgo', 'Pisces'] },
    'Capricorn': { good: ['Taurus', 'Virgo', 'Pisces'], challenging: ['Aries', 'Libra'] },
    'Aquarius': { good: ['Gemini', 'Libra', 'Sagittarius'], challenging: ['Taurus', 'Scorpio'] },
    'Pisces': { good: ['Cancer', 'Scorpio', 'Taurus'], challenging: ['Gemini', 'Sagittarius'] }
  };
  
  const compatibility = compatibilityMap[sign1] || {};
  const relationship = compatibility.good?.includes(sign2) ? 'good' :
                      compatibility.challenging?.includes(sign2) ? 'challenging' : 'neutral';
  
  return `${sign1} and ${sign2} typically have ${relationship} compatibility.`;
}

function formatChallenges(challenges) {
  if (!challenges) return '';
  if (typeof challenges === 'object') {
    return Object.entries(challenges)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  return challenges.toString();
}

function calculateManualNumbers(name, birthDate) {
  return {
    lifePath: calculateLifePathNumber(birthDate),
    soulUrge: calculateSoulUrgeNumber(name),
    personality: calculatePersonalityNumber(name),
    expression: calculateExpressionNumber(name),
    challenges: calculateChallengeNumbers(birthDate),
    karmicLessons: calculateKarmicLessons(name)
  };
}

function calculateLifePathNumber(birthDate) {
  const date = new Date(birthDate);
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  day = reduceToSingleDigit(day);
  month = reduceToSingleDigit(month);
  year = reduceToSingleDigit(year);

  return reduceToSingleDigit(day + month + year);
}

function calculateExpressionNumber(name) {
  const letterValues = {
    'a': 1, 'j': 1, 's': 1,
    'b': 2, 'k': 2, 't': 2,
    'c': 3, 'l': 3, 'u': 3,
    'd': 4, 'm': 4, 'v': 4,
    'e': 5, 'n': 5, 'w': 5,
    'f': 6, 'o': 6, 'x': 6,
    'g': 7, 'p': 7, 'y': 7,
    'h': 8, 'q': 8, 'z': 8,
    'i': 9, 'r': 9
  };

  let sum = 0;
  name.toLowerCase().split('').forEach(char => {
    if (letterValues[char]) sum += letterValues[char];
  });

  return reduceToSingleDigit(sum);
}

function calculateSoulUrgeNumber(name) {
  const vowelValues = { 'a': 1, 'e': 5, 'i': 9, 'o': 6, 'u': 3 };
  let sum = 0;
  
  name.toLowerCase().split('').forEach(char => {
    if (vowelValues[char]) sum += vowelValues[char];
  });

  return reduceToSingleDigit(sum);
}

function calculatePersonalityNumber(name) {
  const consonantValues = {
    'b': 2, 'c': 3, 'd': 4, 'f': 6, 'g': 7, 
    'h': 8, 'j': 1, 'k': 2, 'l': 3, 'm': 4,
    'n': 5, 'p': 7, 'q': 8, 'r': 9, 's': 1,
    't': 2, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8
  };
  
  let sum = 0;
  name.toLowerCase().split('').forEach(char => {
    if (consonantValues[char]) sum += consonantValues[char];
  });

  return reduceToSingleDigit(sum);
}

function calculateChallengeNumbers(birthDate) {
  const date = new Date(birthDate);
  const day = reduceToSingleDigit(date.getDate());
  const month = reduceToSingleDigit(date.getMonth() + 1);
  const year = reduceToSingleDigit(date.getFullYear());
  
  return {
    firstChallenge: Math.abs(month - day),
    secondChallenge: Math.abs(day - year),
    thirdChallenge: Math.abs(month - year),
    fourthChallenge: Math.abs(month - day - year)
  };
}

function calculateKarmicLessons(name) {
  const allNumbers = [1,2,3,4,5,6,7,8,9];
  const presentNumbers = new Set();
  
  name.toLowerCase().split('').forEach(char => {
    if (char.match(/[a-z]/)) {
      const num = char.charCodeAt(0) - 96;
      presentNumbers.add(reduceToSingleDigit(num));
    }
  });

  return allNumbers.filter(num => !presentNumbers.has(num));
}

function reduceToSingleDigit(num) {
  if (num === 11 || num === 22) return num;
  
  while (num > 9) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  
  return num;
}


const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { psychicId } = req.params;

    // ✅ 1. Find psychic and its type
    const psychic = await AiPsychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({ success: false, message: "Psychic not found" });
    }

    const { type } = psychic;

    // ✅ 2. Get required fields for that type
    const requiredFields = getRequiredFieldsByType(type);
let form = null;
let f = {};

if (type !== "Tarot") {
  const requiredFields = getRequiredFieldsByType(type);
  form = await AiFormData.findOne({ userId, type });

  if (!form?.formData) {
    return res.status(400).json({ 
      success: false, 
      message: `Please fill the ${type} form first`  // Fixed indentation here
    });
  }

  f = form.formData;
  const missingFields = requiredFields.filter(field => !f[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Missing fields: ${missingFields.join(", ")}` 
    });
  }
}

    // ✅ 3. If form is required, fetch it by userId and type
    let formData = null;
    if (requiredFields.length > 0) {
      const form = await AiFormData.findOne({ userId, type });
      if (form?.formData) {
        formData = {};
        requiredFields.forEach((field) => {
          formData[field] = form.formData[field] || "N/A";
        });
      }
    }

    // ✅ 4. Get chat history
    const chat = await ChatMessage.findOne({ userId, psychicId });

    return res.status(200).json({
      success: true,
      messages: chat?.messages.map(msg => ({
        ...msg.toObject(),
        id: msg._id,
        createdAt: msg.createdAt || new Date(),
      })) || [],
      formData: formData || null, // include form data if present
      psychicType: type,
    });

  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



// controllers/chatController.js
const getAllUserChats = async (req, res) => {
  try {
    const chats = await ChatMessage.find()
      .populate("userId", "username image")       // Populate user fields
      .populate("psychicId", "name image")        // Populate advisor fields
      .sort({ createdAt: -1 });

    const formatted = chats.map(chat => ({
      id: chat._id,
      user: chat.userId,
      advisor: chat.psychicId,
      credits: Math.floor(Math.random() * 200 + 20), // Dummy credits for now
      createdAt: chat.createdAt
    }));

    res.status(200).json({ success: true, chats: formatted });
  } catch (error) {
    console.error("❌ getAllUserChats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
};
const getChatMessagesById = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const chat = await ChatMessage.findById(chatId)
      .populate("userId", "username image")
      .populate("psychicId", "name image");

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        user: {
          id: chat.userId._id,
          username: chat.userId.username,
          image: chat.userId.image,
        },
        advisor: {
          id: chat.psychicId._id,
          name: chat.psychicId.name,
          image: chat.psychicId.image,
        },
        messages: chat.messages.map(msg => ({
          id: msg._id,
          sender: msg.sender, // 'user' or 'ai'
          text: msg.text,
          timestamp: msg.timestamp,
        })),
      },
    });
  } catch (error) {
    console.error("❌ getChatMessagesById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserChatDetails = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    const psychicId = req.query.psychicId; // Optional: filter by psychicId

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    // If psychicId is provided, validate it
    if (psychicId && !mongoose.Types.ObjectId.isValid(psychicId)) {
      return res.status(400).json({ success: false, error: "Invalid psychic ID" });
    }

    // Find user
    const user = await User.findById(userId).select("username");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Build query for sessions
    const sessionQuery = { userId, isArchived: false };
    if (psychicId) {
      sessionQuery.psychicId = psychicId;
    }

    // Fetch sessions
    const sessions = await ActiveSession.find(sessionQuery)
      .populate("psychicId", "name")
      .lean();

    // Group sessions by psychicId to calculate totals
    const chatDetails = [];
    const psychicMap = {};

    for (const session of sessions) {
      const psychicIdStr = session.psychicId._id.toString();
      if (!psychicMap[psychicIdStr]) {
        psychicMap[psychicIdStr] = {
          psychicName: session.psychicId.name,
          totalCreditsUsed: 0,
          totalSessions: 0,
        };
      }
      psychicMap[psychicIdStr].totalSessions += 1;
      if (session.paidSession && session.initialCredits) {
        psychicMap[psychicIdStr].totalCreditsUsed += session.initialCredits;
      }
    }

    // Convert map to array
    for (const psychicId in psychicMap) {
      chatDetails.push({
        username: user.username,
        psychicName: psychicMap[psychicId].psychicName,
        totalCreditsUsed: psychicMap[psychicId].totalCreditsUsed,
        totalSessions: psychicMap[psychicId].totalSessions,
      });
    }

    // If no sessions found
    if (chatDetails.length === 0) {
      return res.json({ success: true, data: [] });
    }

    res.json({
      success: true,
      data: chatDetails,
    });
  } catch (error) {
    console.error("Error fetching user chat details:", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
      psychicId: req.query.psychicId,
    });
    res.status(500).json({ success: false, error: "Failed to fetch chat details" });
  }
};

module.exports = {
  chatWithPsychic,
  getAllUserChats,
  getChatHistory,
  getUserChatDetails,
  getChatMessagesById
};
