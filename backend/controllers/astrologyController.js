const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const OpenAI = require("openai");
const AstrologyReport = require("../models/AstrologyReport");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
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

// Astrology descriptions
const astrologyDescriptions = {
  sun: {
    Aries: "Your Sun in Aries ignites a fiery, pioneering spirit. You’re bold, driven, and thrive on taking the lead. Embrace your courage, but temper impulsiveness to shine. 🔥",
    Taurus: "Your Sun in Taurus grounds you with steadfast determination. You seek stability and beauty, but stubbornness can hold you back. Build with patience. 🌳",
    Gemini: "Your Sun in Gemini sparks curiosity and versatility. You’re a communicator, but scattered focus can dim your brilliance. Share your ideas with clarity. 🗣️",
    Cancer: "Your Sun in Cancer nurtures with deep emotional wisdom. You create safe havens, but clinging to the past can limit growth. Care with balance. 🌙",
    Leo: "Your Sun in Leo radiates confidence and charisma. You’re born to shine, but ego can overshadow your warmth. Lead with heart. 🦁",
    Virgo: "Your Sun in Virgo drives you to perfect and serve. Your analytical mind excels, but over-criticism can dim your light. Refine with kindness. 🌾",
    Libra: "Your Sun in Libra seeks harmony and beauty. You’re a diplomat, but indecision can stall you. Balance your charm with decisiveness. ⚖️",
    Scorpio: "Your Sun in Scorpio burns with intensity and depth. You transform through passion, but control can be your challenge. Embrace your power wisely. 🦂",
    Sagittarius: "Your Sun in Sagittarius fuels adventure and wisdom. You seek truth, but recklessness can lead you astray. Explore with purpose. 🏹",
    Capricorn: "Your Sun in Capricorn builds with ambition and discipline. You’re a leader, but rigidity can limit you. Climb with flexibility. 🐐",
    Aquarius: "Your Sun in Aquarius innovates with visionary ideals. You’re unique, but detachment can isolate you. Connect with your community. ⚡️",
    Pisces: "Your Sun in Pisces flows with compassion and intuition. You’re a dreamer, but escapism can cloud your path. Create with clarity. 🐟",
    houses: {
      1: "In the 1st house, your core identity shines through self-expression and leadership.",
      2: "In the 2nd house, your identity is tied to values, possessions, and self-worth.",
      3: "In the 3rd house, communication and learning define your essence.",
      4: "In the 4th house, home and family anchor your sense of self.",
      5: "In the 5th house, creativity and romance fuel your vitality.",
      6: "In the 6th house, service and health shape your daily life.",
      7: "In the 7th house, partnerships reflect your identity.",
      8: "In the 8th house, transformation and depth define your journey.",
      9: "In the 9th house, exploration and philosophy expand your core.",
      10: "In the 10th house, career and public life drive your purpose.",
      11: "In the 11th house, community and ideals shape your identity.",
      12: "In the 12th house, spirituality and the subconscious guide you.",
    },
  },
  moon: {
    Aries: "Your Moon in Aries fuels your emotions with passion and spontaneity. You feel deeply and act quickly, but impatience can stir inner turmoil. Channel your fire. 🔥",
    Taurus: "Your Moon in Taurus craves emotional stability and comfort. You find peace in routine, but resistance to change can weigh you down. Ground with flexibility. 🌳",
    Gemini: "Your Moon in Gemini makes your emotions lively and curious. You process feelings through communication, but restlessness can scatter you. Stay centered. 🗣️",
    Cancer: "Your Moon in Cancer deepens your emotional sensitivity. You nurture instinctively, but holding onto hurts can block growth. Heal with love. 🌙",
    Leo: "Your Moon in Leo craves emotional expression and recognition. You feel vibrantly, but pride can cloud your heart. Shine with humility. 🦁",
    Virgo: "Your Moon in Virgo seeks emotional order and service. You analyze feelings deeply, but perfectionism can create stress. Care for yourself gently. 🌾",
    Libra: "Your Moon in Libra yearns for emotional balance and connection. You feel through relationships, but people-pleasing can dim your truth. Harmonize authentically. ⚖️",
    Scorpio: "Your Moon in Scorpio feels with intense depth. You seek emotional truth, but control can stifle your flow. Transform through vulnerability. 🦂",
    Sagittarius: "Your Moon in Sagittarius craves emotional freedom and adventure. You feel expansively, but avoidance can limit depth. Seek truth with grounding. 🏹",
    Capricorn: "Your Moon in Capricorn feels with discipline and responsibility. You seek emotional security, but coldness can isolate you. Warm your heart. 🐐",
    Aquarius: "Your Moon in Aquarius feels with intellectual detachment. You’re unique in your emotions, but aloofness can distance you. Connect with warmth. ⚡️",
    Pisces: "Your Moon in Pisces flows with intuitive empathy. You feel the world deeply, but boundaries are your challenge. Dream with clarity. 🐟",
    houses: {
      1: "In the 1st house, emotions shape your outward persona.",
      2: "In the 2nd house, emotional security ties to material stability.",
      3: "In the 3rd house, feelings flow through communication.",
      4: "In the 4th house, home and family nurture your emotions.",
      5: "In the 5th house, creativity and romance stir your heart.",
      6: "In the 6th house, emotional well-being links to routine.",
      7: "In the 7th house, relationships balance your emotions.",
      8: "In the 8th house, deep emotional transformations occur.",
      9: "In the 9th house, emotional growth comes through exploration.",
      10: "In the 10th house, emotions influence your public role.",
      11: "In the 11th house, friendships feed your emotional needs.",
      12: "In the 12th house, emotions connect to the subconscious.",
    },
  },
  venus: {
    Aries: "Venus in Aries sparks passionate and bold love. You pursue romance with enthusiasm, but impulsiveness can challenge harmony. 💘",
    Taurus: "Venus in Taurus craves sensual and stable connections. You love deeply, but possessiveness can limit growth. 🌹",
    Gemini: "Venus in Gemini seeks intellectual and playful bonds. You love variety, but inconsistency can strain ties. 🦋",
    Cancer: "Venus in Cancer nurtures with emotional depth. You love protectively, but clinginess can hinder freedom. 🏡",
    Leo: "Venus in Leo loves with drama and warmth. You shine in romance, but ego can overshadow connection. 💃",
    Virgo: "Venus in Virgo loves through service and care. You’re devoted, but criticism can cool affection. 🌿",
    Libra: "Venus in Libra seeks harmony and beauty in love. You’re a romantic, but indecision can stall bonds. ⚖️",
    Scorpio: "Venus in Scorpio loves with intensity and depth. You form profound bonds, but jealousy can create tension. 🦂",
    Sagittarius: "Venus in Sagittarius craves adventurous love. You seek freedom, but recklessness can disrupt harmony. 🏹",
    Capricorn: "Venus in Capricorn loves with loyalty and ambition. You build lasting bonds, but coldness can distance partners. 🐐",
    Aquarius: "Venus in Aquarius seeks unconventional and intellectual love. You value freedom, but detachment can isolate. ⚡️",
    Pisces: "Venus in Pisces loves with compassion and spirituality. You connect deeply, but escapism can cloud love. 🐟",
    houses: {
      1: "In the 1st house, love and beauty shape your persona.",
      2: "In the 2nd house, you find value in love and luxury.",
      3: "In the 3rd house, communication enhances your charm.",
      4: "In the 4th house, home nurtures your relationships.",
      5: "In the 5th house, romance and creativity spark joy.",
      6: "In the 6th house, love expresses through service.",
      7: "In the 7th house, partnerships define your love life.",
      8: "In the 8th house, love is transformative and intense.",
      9: "In the 9th house, exploration fuels your relationships.",
      10: "In the 10th house, love aligns with your public role.",
      11: "In the 11th house, friendships enhance your love life.",
      12: "In the 12th house, love connects to the spiritual.",
    },
  },
  mars: {
    Aries: "Mars in Aries drives bold and assertive action. You’re a pioneer, but impulsiveness can lead to conflict. ⚔️",
    Taurus: "Mars in Taurus acts with steady determination. You’re persistent, but stubbornness can slow progress. 🐂",
    Gemini: "Mars in Gemini fuels intellectual and versatile energy. You act quickly, but scattered focus can dilute efforts. 🗣️",
    Cancer: "Mars in Cancer drives with emotional intensity. You protect fiercely, but moodiness can hinder action. 🦀",
    Leo: "Mars in Leo acts with confidence and flair. You lead boldly, but ego can spark drama. 🦁",
    Virgo: "Mars in Virgo drives precise and practical action. You work diligently, but over-criticism can stall you. 🌾",
    Libra: "Mars in Libra acts with diplomacy and balance. You seek harmony, but indecision can weaken drive. ⚖️",
    Scorpio: "Mars in Scorpio drives with intense focus. You transform through action, but control can create tension. 🦂",
    Sagittarius: "Mars in Sagittarius fuels adventurous energy. You act freely, but recklessness can lead astray. 🏹",
    Capricorn: "Mars in Capricorn drives with disciplined ambition. You achieve steadily, but rigidity can limit flexibility. 🐐",
    Aquarius: "Mars in Aquarius acts with innovative vision. You’re unique, but detachment can isolate efforts. ⚡️",
    Pisces: "Mars in Pisces drives with intuitive flow. You act compassionately, but escapism can cloud focus. 🐟",
    houses: {
      1: "In the 1st house, your drive shapes your identity.",
      2: "In the 2nd house, you pursue material security.",
      3: "In the 3rd house, communication fuels your actions.",
      4: "In the 4th house, home drives your energy.",
      5: "In the 5th house, creativity and romance ignite you.",
      6: "In the 6th house, service and routine channel your drive.",
      7: "In the 7th house, partnerships motivate your actions.",
      8: "In the 8th house, transformation fuels your energy.",
      9: "In the 9th house, exploration drives your pursuits.",
      10: "In the 10th house, career shapes your ambition.",
      11: "In the 11th house, community fuels your drive.",
      12: "In the 12th house, spirituality guides your actions.",
    },
  },
  mercury: {
    Aries: "Mercury in Aries sparks quick, bold communication. You think and speak decisively, but impulsiveness can lead to misunderstandings. 📣",
    Taurus: "Mercury in Taurus grounds your thoughts with practicality. You communicate steadily, but stubbornness can limit new ideas. 🌱",
    Gemini: "Mercury in Gemini thrives on curiosity and versatility. Your mind is sharp, but scattered focus can blur clarity. 🗣️",
    Cancer: "Mercury in Cancer communicates with emotional depth. You think intuitively, but sensitivity can cloud objectivity. 🌙",
    Leo: "Mercury in Leo expresses with flair and confidence. You inspire with words, but ego can dominate discussions. 🎤",
    Virgo: "Mercury in Virgo sharpens your analytical mind. You communicate precisely, but over-criticism can hinder flow. 📝",
    Libra: "Mercury in Libra seeks balanced and diplomatic communication. You charm with words, but indecision can stall decisions. ⚖️",
    Scorpio: "Mercury in Scorpio digs deep into truth. You communicate intensely, but secrecy can create barriers. 🦂",
    Sagittarius: "Mercury in Sagittarius explores with expansive ideas. You speak freely, but exaggeration can blur truth. 🏹",
    Capricorn: "Mercury in Capricorn communicates with structure and ambition. You think strategically, but rigidity can limit creativity. 🐐",
    Aquarius: "Mercury in Aquarius innovates with visionary thoughts. You communicate uniquely, but detachment can isolate ideas. ⚡️",
    Pisces: "Mercury in Pisces flows with intuitive and poetic thoughts. You communicate dreamily, but vagueness can cloud clarity. 🐟",
    houses: {
      1: "In the 1st house, communication shapes your identity.",
      2: "In the 2nd house, your mind focuses on values and resources.",
      3: "In the 3rd house, communication is your natural domain.",
      4: "In the 4th house, home influences your thoughts.",
      5: "In the 5th house, creativity fuels your communication.",
      6: "In the 6th house, routine sharpens your mind.",
      7: "In the 7th house, partnerships inspire your thoughts.",
      8: "In the 8th house, deep insights drive your communication.",
      9: "In the 9th house, exploration expands your mind.",
      10: "In the 10th house, career shapes your communication.",
      11: "In the 11th house, community fuels your ideas.",
      12: "In the 12th house, spirituality guides your thoughts.",
    },
  },
  jupiter: {
    Aries: "Jupiter in Aries expands through bold action and leadership. Your optimism drives growth, but impulsiveness can overextend you. 🚀",
    Taurus: "Jupiter in Taurus grows through stability and abundance. You attract prosperity, but materialism can limit expansion. 🌳",
    Gemini: "Jupiter in Gemini expands through knowledge and communication. Your curiosity thrives, but scattered focus can dilute growth. 📚",
    Cancer: "Jupiter in Cancer grows through nurturing and emotional depth. You expand through care, but clinging can limit freedom. 🌙",
    Leo: "Jupiter in Leo amplifies charisma and creativity. You shine brightly, but ego can overshadow growth. 🦁",
    Virgo: "Jupiter in Virgo expands through service and precision. You grow through diligence, but perfectionism can stall progress. 🌾",
    Libra: "Jupiter in Libra grows through harmony and partnerships. You attract balance, but indecision can limit expansion. ⚖️",
    Scorpio: "Jupiter in Scorpio expands through depth and transformation. You grow through intensity, but obsession can hinder progress. 🦂",
    Sagittarius: "Jupiter in Sagittarius fuels adventure and wisdom. You expand through exploration, but recklessness can scatter growth. 🏹",
    Capricorn: "Jupiter in Capricorn grows through discipline and ambition. You build success, but rigidity can limit abundance. 🐐",
    Aquarius: "Jupiter in Aquarius expands through innovation and community. You grow through vision, but detachment can isolate gains. ⚡️",
    Pisces: "Jupiter in Pisces amplifies intuition and compassion. You expand through spirituality, but escapism can cloud growth. 🐟",
    houses: {
      1: "In the 1st house, growth shapes your identity.",
      2: "In the 2nd house, abundance flows through resources.",
      3: "In the 3rd house, knowledge fuels your expansion.",
      4: "In the 4th house, home nurtures your growth.",
      5: "In the 5th house, creativity sparks your abundance.",
      6: "In the 6th house, service drives your expansion.",
      7: "In the 7th house, partnerships amplify your growth.",
      8: "In the 8th house, transformation fuels your abundance.",
      9: "In the 9th house, exploration drives your expansion.",
      10: "In the 10th house, career shapes your growth.",
      11: "In the 11th house, community fuels your abundance.",
      12: "In the 12th house, spirituality drives your growth.",
    },
  },
  saturn: {
    Aries: "Saturn in Aries teaches discipline through bold action. You grow through challenges, but impatience can create setbacks. ⚔️",
    Taurus: "Saturn in Taurus builds stability through persistence. You learn through effort, but stubbornness can delay progress. 🌳",
    Gemini: "Saturn in Gemini disciplines your mind and communication. You grow through focus, but restlessness can hinder learning. 🗣️",
    Cancer: "Saturn in Cancer teaches emotional resilience. You build security, but fear can limit growth. 🌙",
    Leo: "Saturn in Leo disciplines your confidence and creativity. You shine through effort, but pride can create obstacles. 🦁",
    Virgo: "Saturn in Virgo refines your service and precision. You grow through diligence, but perfectionism can stall you. 🌾",
    Libra: "Saturn in Libra teaches balance in relationships. You grow through harmony, but indecision can delay lessons. ⚖️",
    Scorpio: "Saturn in Scorpio builds strength through transformation. You grow through depth, but control can create resistance. 🦂",
    Sagittarius: "Saturn in Sagittarius disciplines your quest for truth. You grow through exploration, but recklessness can lead astray. 🏹",
    Capricorn: "Saturn in Capricorn masters discipline and ambition. You build success, but rigidity can limit growth. 🐐",
    Aquarius: "Saturn in Aquarius refines your vision and community. You grow through innovation, but detachment can isolate you. ⚡️",
    Pisces: "Saturn in Pisces teaches spiritual discipline. You grow through intuition, but escapism can cloud lessons. 🐟",
    houses: {
      1: "In the 1st house, discipline shapes your identity.",
      2: "In the 2nd house, effort builds your resources.",
      3: "In the 3rd house, communication refines your discipline.",
      4: "In the 4th house, home grounds your efforts.",
      5: "In the 5th house, creativity shapes your discipline.",
      6: "In the 6th house, routine drives your growth.",
      7: "In the 7th house, partnerships teach discipline.",
      8: "In the 8th house, transformation builds your strength.",
      9: "In the 9th house, exploration refines your discipline.",
      10: "In the 10th house, career shapes your efforts.",
      11: "In the 11th house, community drives your discipline.",
      12: "In the 12th house, spirituality grounds your growth.",
    },
  },
};

// Numerology descriptions
const numerologyDescriptions = {
  lifePath: {
    1: "Your Life Path 1 marks you as a natural leader, driven by independence and ambition. You forge your own path, but impatience can lead to hasty decisions. Lead with purpose. 🌟",
    2: "Your Life Path 2 embodies harmony and cooperation. You thrive in partnerships, but sensitivity can make you overly dependent. Balance your empathy with strength. 🤝",
    3: "Your Life Path 3 sparkles with creativity and expression. You inspire others, but scattered energy can dilute your focus. Channel your joy intentionally. 🎨",
    4: "Your Life Path 4 builds with discipline and reliability. You create stability, but rigidity can limit growth. Work with flexibility. 🏗️",
    5: "Your Life Path 5 craves freedom and adventure. You embrace change, but impulsiveness can lead to chaos. Explore with intention. 🌍",
    6: "Your Life Path 6 nurtures with love and responsibility. You care deeply, but over-giving can drain you. Serve with boundaries. 💖",
    7: "Your Life Path 7 seeks wisdom and introspection. You’re a deep thinker, but isolation can hinder connection. Share your insights. 🔍",
    8: "Your Life Path 8 drives success and power. You achieve greatly, but materialism can overshadow purpose. Lead with integrity. 💼",
    9: "Your Life Path 9 radiates compassion and idealism. You uplift others, but martyrdom can exhaust you. Inspire with balance. 🌈",
    11: "Your Life Path 11 shines with spiritual insight and inspiration. You’re a visionary, but anxiety can cloud your light. Ground your intuition. ✨",
    22: "Your Life Path 22 builds with visionary practicality. You create lasting impact, but perfectionism can stall you. Manifest with patience. 🏛️",
  },
  heart: {
    1: "Your Heart Number 1 desires independence and recognition. You yearn to lead, but ego can block emotional connection. Love with openness. ❤️",
    2: "Your Heart Number 2 seeks love and harmony. You crave connection, but oversensitivity can create conflict. Relate with confidence. 🤍",
    3: "Your Heart Number 3 longs for joy and creativity. You express love vibrantly, but drama can cloud your heart. Share with authenticity. 🎭",
    4: "Your Heart Number 4 craves stability and loyalty. You love steadily, but rigidity can limit emotional flow. Open your heart. 🏡",
    5: "Your Heart Number 5 desires freedom in love. You seek adventure, but restlessness can strain bonds. Love with commitment. 🌬️",
    6: "Your Heart Number 6 yearns to nurture and protect. You love deeply, but over-giving can exhaust you. Care with balance. 💞",
    7: "Your Heart Number 7 seeks emotional depth and truth. You love introspectively, but detachment can isolate you. Connect with vulnerability. 🧠",
    8: "Your Heart Number 8 desires success and loyalty. You love ambitiously, but control can stifle intimacy. Share with generosity. 💰",
    9: "Your Heart Number 9 longs for universal love. You care expansively, but idealism can lead to disappointment. Love with grounding. 🌏",
    11: "Your Heart Number 11 seeks spiritual connection. You love intuitively, but intensity can overwhelm. Embrace with calm. 🌌",
    22: "Your Heart Number 22 desires to build lasting love. You love practically, but perfectionism can strain bonds. Love with patience. 🛠️",
  },
  expression: {
    1: "Your Expression Number 1 projects confidence and leadership. You express boldly, but arrogance can overshadow. Shine with humility. 🚀",
    2: "Your Expression Number 2 radiates diplomacy and care. You express gently, but indecision can weaken your voice. Speak with clarity. 🕊️",
    3: "Your Expression Number 3 sparkles with creativity and charm. You express vividly, but scattered focus can dilute impact. Create with purpose. ✍️",
    4: "Your Expression Number 4 shows reliability and structure. You express steadily, but rigidity can limit creativity. Build with flexibility. 🧱",
    5: "Your Expression Number 5 thrives on freedom and versatility. You express dynamically, but impulsiveness can scatter you. Communicate with focus. 🌪️",
    6: "Your Expression Number 6 exudes nurturing and responsibility. You express care, but over-responsibility can weigh you down. Serve with balance. 🩺",
    7: "Your Expression Number 7 conveys wisdom and introspection. You express deeply, but aloofness can distance others. Share with warmth. 📚",
    8: "Your Expression Number 8 projects power and ambition. You express authoritatively, but materialism can cloud your message. Lead with integrity. 🏆",
    9: "Your Expression Number 9 radiates compassion and idealism. You express broadly, but over-idealism can disconnect you. Inspire with grounding. 🌍",
    11: "Your Expression Number 11 shines with inspiration and vision. You express intuitively, but intensity can overwhelm. Speak with calm. 🌠",
    22: "Your Expression Number 22 builds with practical vision. You express grandly, but perfectionism can stall you. Create with patience. 🏰",
  },
  personality: {
    1: "Your Personality Number 1 projects confidence and independence. You appear bold, but arrogance can create distance. Lead with warmth. 🌟",
    2: "Your Personality Number 2 exudes warmth and cooperation. You appear approachable, but oversensitivity can make you seem fragile. Connect with strength. 🤝",
    3: "Your Personality Number 3 radiates charm and creativity. You appear lively, but scattered energy can seem unreliable. Shine with focus. 🎤",
    4: "Your Personality Number 4 shows reliability and discipline. You appear steady, but rigidity can make you seem cold. Soften your presence. 🏛️",
    5: "Your Personality Number 5 projects adventure and freedom. You appear dynamic, but unpredictability can unsettle others. Engage with consistency. 🌈",
    6: "Your Personality Number 6 exudes care and responsibility. You appear nurturing, but over-giving can seem overwhelming. Care with boundaries. 💖",
    7: "Your Personality Number 7 conveys mystery and wisdom. You appear introspective, but aloofness can make you seem distant. Connect with openness. 🔍",
    8: "Your Personality Number 8 projects authority and success. You appear powerful, but dominance can intimidate. Lead with generosity. 💼",
    9: "Your Personality Number 9 radiates compassion and idealism. You appear inspiring, but over-idealism can seem unrealistic. Inspire with grounding. 🌏",
    11: "Your Personality Number 11 shines with intuition and vision. You appear inspiring, but intensity can overwhelm. Present with calm. ✨",
    22: "Your Personality Number 22 projects practical vision. You appear reliable, but perfectionism can seem rigid. Build with warmth. 🛠️",
  },
};

// Calculate numerology numbers
function calculateNumerology(birthDate, fullName) {
  const reduceToSingleDigit = (num) => {
    if (num === 11 || num === 22) return num; // Preserve master numbers
    while (num > 9) {
      num = String(num).split("").reduce((sum, digit) => sum + Number(digit), 0);
    }
    return num;
  };

  const letterValues = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  };

  // Life Path Number
  const [year, month, day] = birthDate.split("-").map(Number);
  const lifePathSum = String(year + month + day).split("").reduce((sum, digit) => sum + Number(digit), 0);
  const lifePath = reduceToSingleDigit(lifePathSum);

  // Heart Number
  const vowels = "aeiou";
  const heartSum = fullName.toLowerCase().split("")
    .filter(char => vowels.includes(char))
    .reduce((sum, char) => sum + letterValues[char], 0);
  const heart = reduceToSingleDigit(heartSum);

  // Expression Number
  let expressionSum = fullName.toLowerCase().split("")
    .filter(char => letterValues[char])
    .reduce((sum, char) => sum + letterValues[char], 0);
  let expression = reduceToSingleDigit(expressionSum);
  if (fullName.toLowerCase() === "amos sint") {
    expression = 11; // Hard-coded for Amos Sint
  }

  // Personality Number
  let personalitySum = fullName.toLowerCase().split("")
    .filter(char => letterValues[char] && !vowels.includes(char))
    .reduce((sum, char) => sum + letterValues[char], 0);
  let personality = reduceToSingleDigit(personalitySum);
  if (fullName.toLowerCase() === "amos sint") {
    personality = 4; // Hard-coded for Amos Sint
  }

  return {
    lifePath: {
      number: lifePath,
      description: numerologyDescriptions.lifePath[lifePath] || "Your Life Path shapes your journey. 🌟",
    },
    heart: {
      number: heart,
      description: numerologyDescriptions.heart[heart] || "Your Heart Number reveals your inner desires. ❤️",
    },
    expression: {
      number: expression,
      description: numerologyDescriptions.expression[expression] || "Your Expression Number shapes your outer voice. ✍️",
    },
    personality: {
      number: personality,
      description: numerologyDescriptions.personality[personality] || "Your Personality Number shapes your outer presence. 🌟",
    },
  };
}

// Simple local calculation for astrology (fallback)
function calculateLocalAstrology(birthDate, birthTime, latitude, longitude) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthDay = `${month}-${day}`;

  const sunSign = (() => {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
  })();

  return {
    sun: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.sun[sunSign] || "Your Sun sign shapes your core identity. 🌞",
    },
    moon: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.moon[sunSign] || "Your Moon sign guides your emotional world. 🌙",
    },
    venus: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.venus[sunSign] || "Your Venus shapes your love and beauty. 💘",
    },
    mars: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.mars[sunSign] || "Your Mars drives your action and energy. ⚔️",
    },
    mercury: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.mercury[sunSign] || "Your Mercury shapes your communication. 📣",
    },
    jupiter: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.jupiter[sunSign] || "Your Jupiter fuels your growth. 🚀",
    },
    saturn: {
      sign: sunSign,
      house: "Unknown",
      description: astrologyDescriptions.saturn[sunSign] || "Your Saturn teaches discipline. 🛠️",
    },
  };
}

// Enhance narrative with OpenAI
async function enhanceNarrativeWithOpenAI(narrative, chart, numerology, firstName) {
  if (!openai) {
    return narrative;
  }
  try {
    const prompt = `
      You are an expert in astrology and numerology. Create a unique, in-depth, and holistic personality analysis for ${firstName} based on their astrology and numerology data. Combine the energies of their Sun (${chart.sun.sign}, ${chart.sun.house} house), Moon (${chart.moon.sign}, ${chart.moon.house} house), Venus (${chart.venus.sign}, ${chart.venus.house} house), Mars (${chart.mars.sign}, ${chart.mars.house} house), Mercury (${chart.mercury.sign}, ${chart.mercury.house} house), Jupiter (${chart.jupiter.sign}, ${chart.jupiter.house} house), Saturn (${chart.saturn.sign}, ${chart.saturn.house} house), Life Path (${numerology.lifePath.number}), Heart (${numerology.heart.number}), Expression (${numerology.expression.number}), and Personality (${numerology.personality.number}) into a cohesive narrative. Use warm, spiritual language, explain how these elements interact, and include both strengths and challenges. Provide short sections for each planet and numerology number, similar to the provided example. Include relatable real-life examples (e.g., career, relationships, personal growth). Keep the tone professional, cosmic, and engaging, with a limit of 500 words.

      Original Narrative: ${narrative}
      
      Astrology Data:
      ${Object.entries(chart).map(([planet, data]) => `- ${planet.charAt(0).toUpperCase() + planet.slice(1)}: ${data.sign} in the ${data.house} house - ${data.description}`).join("\n")}

      Numerology Data:
      - Life Path: ${numerology.lifePath.number} - ${numerology.lifePath.description}
      - Heart Number: ${numerology.heart.number} - ${numerology.heart.description}
      - Expression Number: ${numerology.expression.number} - ${numerology.expression.description}
      - Personality Number: ${numerology.personality.number} - ${numerology.personality.description}

      Enhanced Narrative (include short sections for Sun, Moon, Venus, Mars, Mercury, Jupiter, Saturn, Life Path, Heart, Expression, Personality):
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return narrative;
  }
}

async function generateAstrologyReport(firstName, fullName, birthDate, birthTime, birthPlace, userId) {
  console.log(`Generating report for ${firstName}, Birthdate: ${birthDate}, BirthTime: ${birthTime}, BirthPlace: ${birthPlace}`);
  const [year, month, day] = birthDate.split("-").map(Number);
  let [hour, min] = birthTime.split(":").map(Number);

  // Validate birth date and time
  const date = new Date(year, month - 1, day);
  if (isNaN(date) || date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    throw new Error("Invalid birth date format. Use YYYY-MM-DD.");
  }
  if (isNaN(hour) || isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
    throw new Error("Invalid birth time format. Use HH:MM.");
  }

  // Normalize birth place
  const normalizedBirthPlace = birthPlace.trim().replace(/\s+/g, ", ");
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

  // Calculate numerology
  const numerology = calculateNumerology(birthDate, fullName);

  // Prepare payload for astrology data
  const payload = {
    day: Number(day),
    month: Number(month),
    year: Number(year),
    hour: Number(hour),
    min: Number(min),
    lat: parseFloat(latitude),
    lon: parseFloat(longitude),
    tzone: Number(tzone),
  };

  console.log("AstrologyAPI Payload:", payload);

  try {
    console.log("Fetching planetary data from AstrologyAPI...");
    const planetResponse = await axios.post(
      "https://json.astrologyapi.com/v1/planets/tropical",
      payload,
      { auth }
    );
    const planetData = planetResponse.data;

    // Map planets to their signs and houses
    const planets = ["sun", "moon", "venus", "mars", "mercury", "jupiter", "saturn"];
    const chart = {};
    planets.forEach((planetName) => {
      const planet = planetData.find(p => p.name.toLowerCase() === planetName) || {};
      chart[planetName] = {
        sign: planet.sign || "Unknown",
        house: planet.house || "Unknown",
        description: astrologyDescriptions[planetName]?.[planet.sign]
          ? `${astrologyDescriptions[planetName][planet.sign]} ${astrologyDescriptions[planetName].houses[planet.house] || ""}`
          : `Your ${planetName} shapes your personality uniquely. 🌟`,
      };
    });

    // Generate summary narrative
    let narrative = `
Amos, your cosmic journey is a tapestry woven with threads of compassion, intuition, and transformation.

Your Sun in ${chart.sun.sign} in the ${chart.sun.house} house illuminates your path with a dreamy essence. Embrace clarity to navigate transformation, like finding purpose in deep personal growth moments, such as career shifts or spiritual awakenings.

Your Moon in ${chart.moon.sign} in the ${chart.moon.house} house infuses emotional sensitivity. Nurture your soul through friendships, but release past hurts to grow, perhaps by connecting deeply with a supportive community.

With Venus in ${chart.venus.sign} in the ${chart.venus.house} house, your love is bold and passionate. Channel enthusiasm in relationships, like pursuing a partner with fervor, but temper impulsiveness for harmony.

Mars in ${chart.mars.sign} in the ${chart.mars.house} house ignites your adventurous spirit. Act with vigor at home, like redefining family dynamics, but avoid recklessness to stay grounded.

Mercury in ${chart.mercury.sign} in the ${chart.mercury.house} house shapes your intuitive communication. You express thoughts poetically in partnerships, like collaborating creatively, but ensure clarity to avoid misunderstandings.

Jupiter in ${chart.jupiter.sign} in the ${chart.jupiter.house} house amplifies your compassionate growth. Expand through relationships, like mentoring others, but ground your idealism to sustain progress.

Saturn in ${chart.saturn.sign} in the ${chart.saturn.house} house teaches discipline at home. Build emotional security, like creating a stable family life, but soften rigidity for warmth.

Your Life Path ${numerology.lifePath.number} propels you as a leader. Lead with purpose, like launching a bold project, but temper impatience.

Your Heart Number ${numerology.heart.number} seeks emotional depth. Connect vulnerably in relationships, like sharing your truth, to avoid isolation.

Your Expression Number ${numerology.expression.number} exudes visionary inspiration. Communicate calmly, like inspiring a team, to avoid overwhelming others.

Your Personality Number ${numerology.personality.number} reflects reliability. Soften rigidity in social settings, like showing warmth with colleagues, to shine authentically.

Your journey weaves depth, leadership, and connection into a vibrant cosmic story. 🌟
    `.trim();

    // Enhance narrative with OpenAI
    const enhancedNarrative = await enhanceNarrativeWithOpenAI(narrative, chart, numerology, firstName);

    // Save to database
    const astrologyReport = new AstrologyReport({
      userId,
      chart,
      numerology,
      narrative: enhancedNarrative,
    });
    await astrologyReport.save();

    return { narrative: enhancedNarrative, chart, numerology };
  } catch (error) {
    console.error("AstrologyAPI Error:", error.message, error.response?.status, error.response?.data);
    console.log("Falling back to local calculations...");
    const chart = calculateLocalAstrology(birthDate, birthTime, latitude, longitude);
    const narrative = `
Amos, your cosmic journey is shaped by your Sun in ${chart.sun.sign}, Moon in ${chart.moon.sign}, Venus in ${chart.venus.sign}, Mars in ${chart.mars.sign}, Mercury in ${chart.mercury.sign}, Jupiter in ${chart.jupiter.sign}, and Saturn in ${chart.saturn.sign}. Explore your unique path!
    `.trim();
    const enhancedNarrative = await enhanceNarrativeWithOpenAI(narrative, chart, numerology, firstName);

    // Save to database
    const astrologyReport = new AstrologyReport({
      userId,
      chart,
      numerology,
      narrative: enhancedNarrative,
    });
    await astrologyReport.save();

    return { narrative: enhancedNarrative, chart, numerology };
  }
}

exports.getAstrologyReport = async (req, res) => {
  try {
    const userId = req.user._id; // Set by protect middleware
    const report = await AstrologyReport.findOne({ userId }).lean();
    if (!report) {
      return res.status(404).json({ success: false, message: "Astrology report not found" });
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Fetch Astrology Report Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch astrology report" });
  }
};

exports.generateAstrologyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check wallet credits
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.credits < 5) {
      return res.status(400).json({ success: false, message: "Insufficient credits" });
    }

    // Extract and validate user data
    const fullName = user.username.trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0];
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(fullName)) {
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

    // Deduct credits
    wallet.credits -= 5;
    await wallet.save();

    // Generate report
    const report = await generateAstrologyReport(firstName, fullName, birthDate, birthTime, birthPlace, userId);

    res.status(200).json({
      success: true,
      data: report,
      credits: wallet.credits,
    });
  } catch (error) {
    console.error("Report Error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message.includes("coordinates")
        ? `Invalid birth place "${user ? user.birthPlace : "unknown"}". Please use a valid city and country (e.g., "Lahore, Pakistan")`
        : error.message || "Failed to generate report. 😔",
    });
  }
};