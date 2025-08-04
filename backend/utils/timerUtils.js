const ActiveSession = require("../models/ActiveSession");
const Wallet = require("../models/Wallet");

const freeMinutes = 1;

const checkAndUpdateTimer = async (userId, psychicId) => {
  const now = new Date();
  let session = await ActiveSession.findOne({ userId, psychicId });

  if (!session) {
    session = await ActiveSession.create({
      userId,
      psychicId,
      startTime: now,
      freeEndTime: new Date(now.getTime() + freeMinutes * 60000),
      lastChargeTime: now
    });
    return { available: true, isFree: true };
  }

  if (now < session.freeEndTime) {
    return { available: true, isFree: true };
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.credits <= 0) {
    return { available: false, message: "Purchase credits for best results." };
  }

  const minutesToCharge = Math.floor((now - session.lastChargeTime) / 60000);
  if (minutesToCharge >= 1) {
    if (wallet.credits < minutesToCharge) {
      return { available: false, message: "Purchase credits for best results." };
    }
    await Wallet.updateOne(
      { userId },
      { $inc: { credits: -minutesToCharge } }
    );
    session.lastChargeTime = new Date(
      session.lastChargeTime.getTime() + minutesToCharge * 60000
    );
    await session.save();
  }

  return { available: true, isFree: false };
};

module.exports = { checkAndUpdateTimer };