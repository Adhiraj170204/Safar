import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", (_req, res) => {
  // mongoose readyState: 1 = connected
  if (mongoose.connection.readyState === 1) {
    return res.json({ status: "ready", db: "connected" });
  }
  res.status(503).json({ status: "not ready", db: "disconnected" });
});

export default router;
