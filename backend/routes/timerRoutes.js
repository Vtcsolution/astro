const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkAndUpdateTimer } = require("../middleware/timerMiddleware");
const ActiveSession = require("../models/ActiveSession");
const Wallet = require("../models/Wallet");
const mongoose = require("mongoose");

const freeMinutes = 1;

router.get("/session-status/:psychicId", protect, async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(psychicId)) {
      return res.status(400).json({ error: "Invalid user or psychic ID" });
    }

    let session = await ActiveSession.findOne({ userId, psychicId });
    const wallet = await Wallet.findOne({ userId });
    const now = new Date();

    if (!session) {
      return res.json({
        isFree: true,
        remainingFreeTime: freeMinutes * 60,
        paidTimer: 0,
        credits: wallet?.credits || 0,
        status: "new",
        freeSessionUsed: false,
      });
    }

    const isFree = !session.freeSessionUsed && session.remainingFreeTime > 0;
    const paidTimer = session.paidSession && session.paidStartTime
      ? Math.max(0, session.initialCredits * 60 - Math.floor((now - session.paidStartTime) / 1000))
      : 0;

    res.json({
      isFree,
      remainingFreeTime: session.remainingFreeTime || 0,
      paidTimer,
      credits: wallet?.credits || 0,
      status: isFree ? "free" : session.paidSession ? "paid" : "stopped",
      freeSessionUsed: session.freeSessionUsed,
    });
  } catch (error) {
    console.error("Session status error:", error);
    res.status(500).json({ error: "Failed to get session status" });
  }
});

router.post("/start-free-session/:psychicId", protect, async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(psychicId)) {
      return res.status(400).json({ error: "Invalid user or psychic ID" });
    }

    let session = await ActiveSession.findOne({ userId, psychicId });
    if (session && session.freeSessionUsed) {
      return res.status(400).json({ error: "Free session already used" });
    }

    const now = new Date();
    if (!session) {
      session = await ActiveSession.create({
        userId,
        psychicId,
        startTime: now,
        freeEndTime: new Date(now.getTime() + freeMinutes * 60 * 1000),
        remainingFreeTime: freeMinutes * 60,
        lastChargeTime: now,
        paidSession: false,
        freeSessionUsed: false,
        isArchived: false,
      });
    } else if (session.remainingFreeTime <= 0) {
      session.freeSessionUsed = true;
      await session.save();
      return res.status(400).json({ error: "Free session already used" });
    }

    const wallet = await Wallet.findOne({ userId });

    res.json({
      success: true,
      isFree: true,
      remainingFreeTime: session.remainingFreeTime,
      paidTimer: 0,
      credits: wallet?.credits || 0,
      status: "free",
      freeSessionUsed: session.freeSessionUsed,
    });

    req.io.to(userId.toString()).emit("sessionUpdate", {
      userId,
      psychicId,
      isFree: true,
      remainingFreeTime: session.remainingFreeTime,
      paidTimer: 0,
      credits: wallet?.credits || 0,
      status: "free",
      freeSessionUsed: session.freeSessionUsed,
    });
  } catch (error) {
    console.error("Start free session error:", error);
    res.status(500).json({ error: "Failed to start free session" });
  }
});

router.post("/start-paid-session/:psychicId", protect, checkAndUpdateTimer, async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(psychicId)) {
      return res.status(400).json({ error: "Invalid user or psychic ID" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.credits < 1) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    let session = await ActiveSession.findOne({ userId, psychicId });
    if (!session) {
      const now = new Date();
      session = await ActiveSession.create({
        userId,
        psychicId,
        startTime: now,
        freeEndTime: new Date(now.getTime() + freeMinutes * 60 * 1000),
        remainingFreeTime: 0,
        lastChargeTime: now,
        paidSession: false,
        freeSessionUsed: true,
        isArchived: false,
      });
    }

    if (session.paidSession) {
      return res.status(400).json({ error: "Paid session already active" });
    }

    // Stop other paid sessions
    const existingPaidSessions = await ActiveSession.find({
      userId,
      paidSession: true,
      psychicId: { $ne: psychicId },
    });
    for (const session of existingPaidSessions) {
      const secondsSinceStart = Math.floor((new Date() - session.paidStartTime) / 1000);
      const creditsToDeduct = Math.ceil(secondsSinceStart / 60);
      wallet.credits = Math.max(0, session.initialCredits - creditsToDeduct);
      await wallet.save();
      session.paidSession = false;
      session.paidStartTime = null;
      session.isArchived = true;
      await session.save();
      req.io.to(userId.toString()).emit("sessionUpdate", {
        userId,
        psychicId: session.psychicId,
        isFree: false,
        remainingFreeTime: 0,
        paidTimer: 0,
        credits: wallet.credits,
        status: "stopped",
        showFeedbackModal: true,
      });
    }

    session.paidSession = true;
    session.paidStartTime = new Date();
    session.initialCredits = wallet.credits;
    session.freeSessionUsed = true;
    session.remainingFreeTime = 0;
    session.isArchived = false;
    await session.save();

    const paidTimer = wallet.credits * 60;

    res.json({
      success: true,
      isFree: false,
      remainingFreeTime: 0,
      paidTimer,
      credits: wallet.credits,
      status: "paid",
      freeSessionUsed: true,
    });

    req.io.to(userId.toString()).emit("sessionUpdate", {
      userId,
      psychicId,
      isFree: false,
      remainingFreeTime: 0,
      paidTimer,
      credits: wallet.credits,
      status: "paid",
      freeSessionUsed: true,
    });
  } catch (error) {
    console.error("Start paid session error:", error);
    res.status(500).json({ error: "Failed to start paid session" });
  }
});

router.post("/stop-session/:psychicId", protect, async (req, res) => {
  try {
    const { psychicId } = req.params;
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(psychicId)) {
      return res.status(400).json({ error: "Invalid user or psychic ID" });
    }

    let session = await ActiveSession.findOne({ userId, psychicId });
    if (!session) {
      return res.status(400).json({ error: "No active session found" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(400).json({ error: "Wallet not found" });
    }

    let remainingTime = 0;
    if (session.paidSession && session.paidStartTime) {
      const secondsSinceStart = Math.floor((new Date() - session.paidStartTime) / 1000);
      const creditsToDeduct = Math.ceil(secondsSinceStart / 60);
      wallet.credits = Math.max(0, session.initialCredits - creditsToDeduct);
      remainingTime = Math.max(0, session.initialCredits * 60 - secondsSinceStart);
      await wallet.save();
    }

    session.paidSession = false;
    session.paidStartTime = null;
    session.isArchived = true;
    await session.save();

    res.json({
      success: true,
      isFree: false,
      remainingFreeTime: session.remainingFreeTime || 0,
      paidTimer: remainingTime,
      credits: wallet.credits,
      status: "stopped",
      showFeedbackModal: true,
      freeSessionUsed: session.freeSessionUsed,
    });

    req.io.to(userId.toString()).emit("sessionUpdate", {
      userId,
      psychicId,
      isFree: false,
      remainingFreeTime: session.remainingFreeTime || 0,
      paidTimer: remainingTime,
      credits: wallet.credits,
      status: "stopped",
      showFeedbackModal: true,
      freeSessionUsed: session.freeSessionUsed,
    });
  } catch (error) {
    console.error("Stop session error:", error);
    res.status(500).json({ error: "Failed to stop session" });
  }
});

module.exports = router;