const schedule = require("node-schedule");
const ActiveSession = require("../models/ActiveSession");
const Wallet = require("../models/Wallet");

const startCreditDeductionJob = (io) => {
  schedule.scheduleJob("*/1 * * * * *", async () => {
    try {
      const now = new Date();
      const sessions = await ActiveSession.find({
        paidSession: true,
        paidStartTime: { $exists: true },
        isArchived: false,
      });

      for (const session of sessions) {
        const wallet = await Wallet.findOne({ userId: session.userId });
        if (!wallet) {
          console.error(`Wallet not found for user ${session.userId}`);
          continue;
        }

        const secondsSinceStart = Math.floor((now - session.paidStartTime) / 1000);
        const minutesElapsed = Math.floor(secondsSinceStart / 60);
        const secondsIntoCurrentMinute = secondsSinceStart % 60;
        let expectedCredits = session.initialCredits - minutesElapsed;

        // Deduct credit at the start of each minute (e.g., at 3:59, 2:59, etc.)
        if (secondsIntoCurrentMinute === 1 && secondsSinceStart >= 1) {
          if (wallet.credits > expectedCredits) {
            wallet.credits = Math.max(0, expectedCredits);
            session.lastChargeTime = now;
            await wallet.save();
            await session.save();
            io.to(session.userId.toString()).emit("creditsUpdate", {
              userId: session.userId,
              credits: wallet.credits,
            });
            console.log(`Deducted 1 credit for user ${session.userId}, new credits: ${wallet.credits}, secondsSinceStart: ${secondsSinceStart}`);
          }
        }

        const remainingTime = Math.max(0, session.initialCredits * 60 - secondsSinceStart);

        // Emit session update every second for real-time timer sync
        io.to(session.userId.toString()).emit("sessionUpdate", {
          userId: session.userId,
          psychicId: session.psychicId,
          isFree: false,
          remainingFreeTime: 0,
          paidTimer: remainingTime,
          credits: wallet.credits,
          status: remainingTime <= 0 ? "insufficient_credits" : "paid",
          showFeedbackModal: remainingTime <= 0,
          freeSessionUsed: session.freeSessionUsed,
        });

        // Terminate session if time runs out
        if (remainingTime <= 0) {
          session.paidSession = false;
          session.paidStartTime = null;
          session.isArchived = true;
          await wallet.save();
          await session.save();
          console.log(`Session terminated for user ${session.userId}, credits: ${wallet.credits}, remainingTime: ${remainingTime}`);
        }
      }
    } catch (error) {
      console.error("Credit deduction job error:", error);
    }
  });
};

const startFreeSessionTimerJob = (io) => {
  schedule.scheduleJob("*/1 * * * * *", async () => {
    try {
      const now = new Date();
      const sessions = await ActiveSession.find({
        freeSessionUsed: false,
        isArchived: false,
      });

      for (const session of sessions) {
        const remainingFreeTime = Math.max(0, Math.floor((session.freeEndTime - now) / 1000));
        session.remainingFreeTime = remainingFreeTime;
        if (remainingFreeTime <= 0) {
          session.freeSessionUsed = true;
          session.isArchived = true;
        }
        await session.save();

        io.to(session.userId.toString()).emit("sessionUpdate", {
          userId: session.userId,
          psychicId: session.psychicId,
          isFree: remainingFreeTime > 0,
          remainingFreeTime,
          paidTimer: 0,
          credits: (await Wallet.findOne({ userId: session.userId }))?.credits || 0,
          status: remainingFreeTime > 0 ? "free" : "stopped",
          freeSessionUsed: session.freeSessionUsed,
          showFeedbackModal: remainingFreeTime <= 0,
        });

        if (remainingFreeTime <= 0) {
          console.log(`Free session ended for user ${session.userId}, psychic ${session.psychicId}`);
        }
      }
    } catch (error) {
      console.error("Free session timer job error:", error);
    }
  });
};

module.exports = { startCreditDeductionJob, startFreeSessionTimerJob };