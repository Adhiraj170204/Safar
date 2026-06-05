import express from "express"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()

import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { sanitizeRequest } from "./utility/sanitize.js";
import { register, metricsMiddleware, mongoDbConnected } from "./utility/metrics.js";

const isProd = process.env.NODE_ENV === "production";
const isTunnel = process.env.TUNNEL_MODE === "true";

// Trust the first proxy (Nginx) in production and tunnel mode so req.ip
// reflects the real client IP instead of the Docker bridge address.
if (isProd || isTunnel) {
  app.set("trust proxy", 1);
}

const isTunnelOrigin = (origin) =>
  /^https:\/\/[\w-]+(\.[\w-]+)*\.(trycloudflare\.com|ngrok-free\.app|ngrok\.io|ngrok\.app|loca\.lt)$/.test(origin);

// Metrics middleware — record every request before any other processing
app.use(metricsMiddleware);

// /metrics endpoint — accessible only within the Docker network.
// nginx does not proxy this path, so it is never reachable externally.
app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Body parsers must come first — cap request size to prevent payload abuse
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Then cookie parser
app.use(cookieParser());

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser clients (like curl/postman) with no Origin header
    if (!origin) return cb(null, true);

    const envAllowed = (process.env.APP_BASE_URL || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const allowed = new Set([
      "http://localhost:5173", // Vite dev server default
      "http://localhost:3000", // legacy/dev
      ...envAllowed,
    ]);

    if (allowed.has(origin)) return cb(null, true);

    // Dev: allow LAN access (e.g. http://192.168.1.5:5173 from phone on same Wi‑Fi)
    if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }

    // Public tunnel (Cloudflare quick tunnel, ngrok)
    if ((!isProd || isTunnel) && isTunnelOrigin(origin)) {
      return cb(null, true);
    }

    // NOTE: safe to log origin; do not log cookies/tokens.
    console.warn(`[CORS] blocked origin: ${origin}`);
    return cb(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));

if (!isProd) {
  console.log(`[CORS] allowing localhost:5173, localhost:3000${process.env.APP_BASE_URL ? `, ${process.env.APP_BASE_URL}` : ''}`);
}

// Input sanitization (NoSQL-injection + basic XSS) — Express 5 safe
app.use(sanitizeRequest);

// General rate limiter — 500 req / 15 min per IP for normal browsing
const limiter = rateLimit({ windowMs: 15*60*1000, max: 500 });
app.use(limiter);

// Stricter rate limiter for auth routes — tight in production, relaxed in dev
const authLimiter = rateLimit({
  windowMs: 15*60*1000,
  max: isProd ? 10 : 50,
  message: { error: "Too many authentication attempts, please try again later" }
});

import mongoose from "mongoose"
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Safar', {
})
    .then(() => {
        console.log('Mongo Connection Successful')
        mongoDbConnected.set(1);
    })
    .catch((err) => {
        console.log('Mongo Connection Failed')
        console.log(err)
        mongoDbConnected.set(0);
    })

mongoose.connection.on('connected',    () => mongoDbConnected.set(1));
mongoose.connection.on('disconnected', () => mongoDbConnected.set(0));
mongoose.connection.on('error',        () => mongoDbConnected.set(0));

// Import models BEFORE routes to ensure they're registered
import "./models/user.js"
import "./models/camp.js"
import "./models/review.js"

import campRoutes from "./routes/camp.js"
import reviewRoutes from "./routes/review.js"
import userRoutes from "./routes/user.js"
import adminRoutes from "./routes/admin.js"
import healthRoutes from "./routes/health.js"

// Route handlers
app.use('/health', healthRoutes)
app.use('/api/camp', campRoutes)
app.use('/api/camp/:id/review', reviewRoutes)
// Auth limiter applies only to credential endpoints, not the full user router
app.use('/api/user/login', authLimiter)
app.use('/api/user/register', authLimiter)
app.use('/api/user/resend-otp', authLimiter)
app.use('/api/user/request-reset', authLimiter)
app.use('/api/user/reset', authLimiter)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)

// Error handling middleware
app.use((err, _req, res, _next) => {
    const status = err.status || 500
    // Always log full detail server-side
    console.error(err.stack || err.message)
    // Client errors (4xx) carry safe messages; hide 5xx internals in production
    const message =
        status < 500 || !isProd ? (err.message || 'Error') : 'Internal Server Error'
    res.status(status).json({ error: message })
})

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`)
})

const shutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully`)
  server.close(async () => {
    await mongoose.connection.close()
    console.log("MongoDB connection closed")
    process.exit(0)
  })
  // Force exit if shutdown takes too long
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT",  () => shutdown("SIGINT"))