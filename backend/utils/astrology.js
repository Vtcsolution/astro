const astrologyDescriptions = {
  sun: {
    signs: {
      Aries: "Your Sun in Aries radiates boldness and initiative. You're a natural leader, driven by passion and courage.",
      Taurus: "Your Sun in Taurus embodies stability and sensuality. You value security and enjoy life's pleasures.",
      Gemini: "Your Sun in Gemini sparkles with curiosity and versatility. Communication is your strength.",
      Cancer: "Your Sun in Cancer nurtures with deep emotional sensitivity. You cherish home and family.",
      Leo: "Your Sun in Leo shines with confidence and charisma. You thrive in the spotlight.",
      Virgo: "Your Sun in Virgo reflects precision and service. You excel in analysis and helping others.",
      Libra: "Your Sun in Libra seeks balance and harmony. You're a diplomat with a love for beauty.",
      Scorpio: "Your Sun in Scorpio exudes intensity and depth. You embrace transformation and truth.",
      Sagittarius: "Your Sun in Sagittarius inspires adventure and optimism. You seek freedom and wisdom.",
      Capricorn: "Your Sun in Capricorn drives ambition and discipline. You build lasting structures.",
      Aquarius: "Your Sun in Aquarius innovates with originality. You champion progress and individuality.",
      Pisces: "Your Sun in Pisces flows with compassion and intuition. You connect deeply with the spiritual.",
    },
    houses: {
      1: "In the 1st house, your Sun shapes a strong personal identity and presence.",
      2: "In the 2nd house, your Sun focuses on values, wealth, and self-worth.",
      3: "In the 3rd house, your Sun excels in communication and learning.",
      4: "In the 4th house, your Sun roots your identity in home and family.",
      5: "In the 5th house, your Sun thrives in creativity and self-expression.",
      6: "In the 6th house, your Sun emphasizes service and daily routines.",
      7: "In the 7th house, your Sun shines through partnerships and relationships.",
      8: "In the 8th house, your Sun delves into transformation and shared resources.",
      9: "In the 9th house, your Sun seeks adventure, philosophy, and higher learning.",
      10: "In the 10th house, your Sun drives career and public reputation.",
      11: "In the 11th house, your Sun connects with community and aspirations.",
      12: "In the 12th house, your Sun explores spirituality and the subconscious.",
    },
  },
  moon: {
    signs: {
      Aries: "Your Moon in Aries fuels quick emotional reactions and independence.",
      Taurus: "Your Moon in Taurus craves comfort and emotional stability.",
      Gemini: "Your Moon in Gemini expresses emotions through communication and curiosity.",
      Cancer: "Your Moon in Cancer is deeply nurturing and emotionally intuitive.",
      Leo: "Your Moon in Leo seeks emotional validation through drama and creativity.",
      Virgo: "Your Moon in Virgo processes emotions analytically, seeking order.",
      Libra: "Your Moon in Libra desires emotional harmony and balance in relationships.",
      Scorpio: "Your Moon in Scorpio feels emotions intensely, seeking depth.",
      Sagittarius: "Your Moon in Sagittarius yearns for emotional freedom and exploration.",
      Capricorn: "Your Moon in Capricorn keeps emotions disciplined and goal-oriented.",
      Aquarius: "Your Moon in Aquarius detaches emotionally, valuing intellectual connection.",
      Pisces: "Your Moon in Pisces is empathetic and spiritually attuned.",
    },
    houses: {
      1: "In the 1st house, your Moon shapes an emotionally expressive persona.",
      2: "In the 2nd house, your Moon ties emotions to security and possessions.",
      3: "In the 3rd house, your Moon thrives on emotional communication.",
      4: "In the 4th house, your Moon feels at home in family and roots.",
      5: "In the 5th house, your Moon expresses emotions through creativity.",
      6: "In the 6th house, your Moon focuses on emotional routines and service.",
      7: "In the 7th house, your Moon seeks emotional fulfillment in partnerships.",
      8: "In the 8th house, your Moon delves into deep emotional transformations.",
      9: "In the 9th house, your Moon craves emotional exploration and wisdom.",
      10: "In the 10th house, your Moon ties emotions to career and reputation.",
      11: "In the 11th house, your Moon connects emotionally with groups.",
      12: "In the 12th house, your Moon is sensitive to the subconscious.",
    },
  },
  // Add similar objects for venus, mars, mercury, jupiter, saturn
  venus: {
    signs: {
      Aries: "Your Venus in Aries loves passionately and impulsively.",
      Taurus: "Your Venus in Taurus cherishes sensual and stable love.",
      Gemini: "Your Venus in Gemini flirts with wit and variety.",
      Cancer: "Your Venus in Cancer seeks emotional security in love.",
      Leo: "Your Venus in Leo loves dramatically and seeks admiration.",
      Virgo: "Your Venus in Virgo loves with care and practicality.",
      Libra: "Your Venus in Libra thrives on harmony and romantic balance.",
      Scorpio: "Your Venus in Scorpio loves intensely and possessively.",
      Sagittarius: "Your Venus in Sagittarius seeks freedom in love.",
      Capricorn: "Your Venus in Capricorn values committed, practical love.",
      Aquarius: "Your Venus in Aquarius loves unconventionally and intellectually.",
      Pisces: "Your Venus in Pisces loves with compassion and dreaminess.",
    },
    houses: {
      1: "In the 1st house, your Venus enhances charm and attractiveness.",
      2: "In the 2nd house, your Venus loves luxury and financial security.",
      3: "In the 3rd house, your Venus expresses love through communication.",
      4: "In the 4th house, your Venus finds love in home and family.",
      5: "In the 5th house, your Venus thrives in romantic creativity.",
      6: "In the 6th house, your Venus loves through service and care.",
      7: "In the 7th house, your Venus shines in partnerships.",
      8: "In the 8th house, your Venus seeks deep, transformative love.",
      9: "In the 9th house, your Venus loves adventure and cultural exploration.",
      10: "In the 10th house, your Venus ties love to status and career.",
      11: "In the 11th house, your Venus loves through friendships and groups.",
      12: "In the 12th house, your Venus loves spiritually and secretly.",
    },
  },
  mars: {
    signs: {
      Aries: "Your Mars in Aries is assertive and action-driven.",
      Taurus: "Your Mars in Taurus pursues goals steadily and sensually.",
      Gemini: "Your Mars in Gemini acts through communication and versatility.",
      Cancer: "Your Mars in Cancer acts protectively and emotionally.",
      Leo: "Your Mars in Leo is bold and seeks recognition.",
      Virgo: "Your Mars in Virgo acts with precision and efficiency.",
      Libra: "Your Mars in Libra seeks balance in action and relationships.",
      Scorpio: "Your Mars in Scorpio is intense and transformative.",
      Sagittarius: "Your Mars in Sagittarius pursues adventure and freedom.",
      Capricorn: "Your Mars in Capricorn is disciplined and ambitious.",
      Aquarius: "Your Mars in Aquarius acts innovatively and independently.",
      Pisces: "Your Mars in Pisces acts intuitively and compassionately.",
    },
    houses: {
      1: "In the 1st house, your Mars drives a bold persona.",
      2: "In the 2nd house, your Mars fights for financial security.",
      3: "In the 3rd house, your Mars energizes communication.",
      4: "In the 4th house, your Mars protects home and family.",
      5: "In the 5th house, your Mars fuels creative pursuits.",
      6: "In the 6th house, your Mars energizes daily routines.",
      7: "In the 7th house, your Mars drives partnership dynamics.",
      8: "In the 8th house, your Mars seeks intense transformations.",
      9: "In the 9th house, your Mars pursues adventure and knowledge.",
      10: "In the 10th house, your Mars drives career ambitions.",
      11: "In the 11th house, your Mars energizes group efforts.",
      12: "In the 12th house, your Mars acts subtly and spiritually.",
    },
  },
  mercury: {
    signs: {
      Aries: "Your Mercury in Aries communicates boldly and quickly.",
      Taurus: "Your Mercury in Taurus communicates steadily and practically.",
      Gemini: "Your Mercury in Gemini is witty and versatile.",
      Cancer: "Your Mercury in Cancer communicates emotionally and intuitively.",
      Leo: "Your Mercury in Leo communicates with flair and confidence.",
      Virgo: "Your Mercury in Virgo is precise and analytical.",
      Libra: "Your Mercury in Libra communicates diplomatically.",
      Scorpio: "Your Mercury in Scorpio probes deeply and intensely.",
      Sagittarius: "Your Mercury in Sagittarius communicates philosophically.",
      Capricorn: "Your Mercury in Capricorn is structured and goal-oriented.",
      Aquarius: "Your Mercury in Aquarius is innovative and intellectual.",
      Pisces: "Your Mercury in Pisces communicates intuitively and poetically.",
    },
    houses: {
      1: "In the 1st house, your Mercury shapes a communicative persona.",
      2: "In the 2nd house, your Mercury focuses on financial communication.",
      3: "In the 3rd house, your Mercury excels in learning and talking.",
      4: "In the 4th house, your Mercury communicates about home.",
      5: "In the 5th house, your Mercury expresses creatively.",
      6: "In the 6th house, your Mercury focuses on work and service.",
      7: "In the 7th house, your Mercury thrives in partnership talks.",
      8: "In the 8th house, your Mercury probes deep issues.",
      9: "In the 9th house, your Mercury explores philosophy and travel.",
      10: "In the 10th house, your Mercury shapes career communication.",
      11: "In the 11th house, your Mercury connects with groups.",
      12: "In the 12th house, your Mercury communicates intuitively.",
    },
  },
  jupiter: {
    signs: {
      Aries: "Your Jupiter in Aries expands through bold initiatives.",
      Taurus: "Your Jupiter in Taurus grows through stability and resources.",
      Gemini: "Your Jupiter in Gemini expands through knowledge and variety.",
      Cancer: "Your Jupiter in Cancer grows through emotional nurturing.",
      Leo: "Your Jupiter in Leo expands through creativity and leadership.",
      Virgo: "Your Jupiter in Virgo grows through service and precision.",
      Libra: "Your Jupiter in Libra expands through harmony and partnerships.",
      Scorpio: "Your Jupiter in Scorpio grows through transformation.",
      Sagittarius: "Your Jupiter in Sagittarius thrives on adventure and wisdom.",
      Capricorn: "Your Jupiter in Capricorn expands through discipline.",
      Aquarius: "Your Jupiter in Aquarius grows through innovation.",
      Pisces: "Your Jupiter in Pisces expands through compassion and spirituality.",
    },
    houses: {
      1: "In the 1st house, your Jupiter enhances optimism and presence.",
      2: "In the 2nd house, your Jupiter grows wealth and values.",
      3: "In the 3rd house, your Jupiter expands communication.",
      4: "In the 4th house, your Jupiter blesses home and family.",
      5: "In the 5th house, your Jupiter fuels creativity and joy.",
      6: "In the 6th house, your Jupiter improves work and health.",
      7: "In the 7th house, your Jupiter enhances partnerships.",
      8: "In the 8th house, your Jupiter transforms shared resources.",
      9: "In the 9th house, your Jupiter seeks wisdom and travel.",
      10: "In the 10th house, your Jupiter boosts career success.",
      11: "In the 11th house, your Jupiter expands social connections.",
      12: "In the 12th house, your Jupiter deepens spirituality.",
    },
  },
  saturn: {
    signs: {
      Aries: "Your Saturn in Aries teaches discipline in action.",
      Taurus: "Your Saturn in Taurus demands stability and patience.",
      Gemini: "Your Saturn in Gemini disciplines communication.",
      Cancer: "Your Saturn in Cancer structures emotional security.",
      Leo: "Your Saturn in Leo teaches humility in self-expression.",
      Virgo: "Your Saturn in Virgo demands precision and service.",
      Libra: "Your Saturn in Libra balances relationships with responsibility.",
      Scorpio: "Your Saturn in Scorpio transforms through discipline.",
      Sagittarius: "Your Saturn in Sagittarius structures exploration.",
      Capricorn: "Your Saturn in Capricorn thrives on ambition and structure.",
      Aquarius: "Your Saturn in Aquarius disciplines innovation.",
      Pisces: "Your Saturn in Pisces structures spiritual growth.",
    },
    houses: {
      1: "In the 1st house, your Saturn shapes a disciplined persona.",
      2: "In the 2nd house, your Saturn structures financial stability.",
      3: "In the 3rd house, your Saturn disciplines communication.",
      4: "In the 4th house, your Saturn stabilizes home life.",
      5: "In the 5th house, your Saturn disciplines creativity.",
      6: "In the 6th house, your Saturn structures work and health.",
      7: "In the 7th house, your Saturn demands commitment in partnerships.",
      8: "In the 8th house, your Saturn disciplines transformation.",
      9: "In the 9th house, your Saturn structures exploration.",
      10: "In the 10th house, your Saturn drives career discipline.",
      11: "In the 11th house, your Saturn structures group efforts.",
      12: "In the 12th house, your Saturn disciplines spirituality.",
    },
  },
  ascendant: {
    signs: {
      Aries: "Your Aries Ascendant projects boldness and energy.",
      Taurus: "Your Taurus Ascendant radiates calm and reliability.",
      Gemini: "Your Gemini Ascendant is curious and communicative.",
      Cancer: "Your Cancer Ascendant is nurturing and sensitive.",
      Leo: "Your Leo Ascendant shines with confidence and charisma.",
      Virgo: "Your Virgo Ascendant is precise and helpful.",
      Libra: "Your Libra Ascendant seeks harmony and charm.",
      Scorpio: "Your Scorpio Ascendant exudes intensity and mystery.",
      Sagittarius: "Your Sagittarius Ascendant is adventurous and optimistic.",
      Capricorn: "Your Capricorn Ascendant projects ambition and discipline.",
      Aquarius: "Your Aquarius Ascendant is innovative and unique.",
      Pisces: "Your Pisces Ascendant is compassionate and dreamy.",
    },
  },
};

const combinedInfluences = {
  sun: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Sun in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Sun in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} create a dynamic interplay of core energies.`;
  },
  moon: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Moon in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Moon in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} shape your emotional compatibility.`;
  },
  venus: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Venus in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Venus in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} define your romantic connection.`;
  },
  mars: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Mars in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Mars in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} drive your passion and conflicts.`;
  },
  mercury: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Mercury in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Mercury in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} shape your communication style.`;
  },
  jupiter: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Jupiter in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Jupiter in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} inspire growth together.`;
  },
  saturn: (userSign, partnerSign, userHouse, partnerHouse) => {
    return `Your Saturn in ${userSign}${userHouse !== "Unknown" ? ` in the ${userHouse}th house` : ""} and your partner's Saturn in ${partnerSign}${partnerHouse !== "Unknown" ? ` in the ${partnerHouse}th house` : ""} bring structure to your relationship.`;
  },
};

const enhanceSynastryNarrative = async (narrative, chart, yourName, partnerName) => {
  // Mock implementation; replace with AI-driven narrative enhancement if needed
  let enhanced = `${narrative}\n\n`;
  enhanced += `${yourName}'s Sun in ${chart.user.sun.sign} and ${partnerName}'s Sun in ${chart.partner.sun.sign} create a unique dynamic. `;
  enhanced += `Your emotional connection is shaped by ${yourName}'s Moon in ${chart.user.moon.sign} and ${partnerName}'s Moon in ${chart.partner.moon.sign}. `;
  enhanced += `Romantically, ${yourName}'s Venus in ${chart.user.venus.sign} blends with ${partnerName}'s Venus in ${chart.partner.venus.sign}.`;
  return enhanced;
};

module.exports = {
  astrologyDescriptions,
  combinedInfluences,
  enhanceSynastryNarrative,
};