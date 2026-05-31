import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
register.setDefaultLabels({ app: 'safar' });

// Node.js runtime metrics (heap, GC, event loop lag, active handles…)
collectDefaultMetrics({ register });

// ── HTTP counters ──────────────────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests received',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

// ── Infrastructure gauges ──────────────────────────────────────────────────────
export const mongoDbConnected = new Gauge({
  name: 'mongodb_connected',
  help: 'MongoDB connection status — 1 = connected, 0 = disconnected',
  registers: [register],
});

// ── Express middleware ─────────────────────────────────────────────────────────
export const metricsMiddleware = (req, res, next) => {
  // Skip recording the /metrics scrape itself to avoid noise
  if (req.path === '/metrics') return next();

  const start = Date.now();

  res.on('finish', () => {
    // Use the matched route pattern (e.g. /api/camp/:id) when available.
    // Fall back to stripping MongoDB ObjectIds so high-cardinality URLs
    // like /api/camp/66f1a2b3c4d5e6f7a8b9c0d1 don't explode the label set.
    const route = req.route?.path
      ?? req.path.replace(/\/[0-9a-f]{24}/gi, '/:id');

    const labels = { method: req.method, route, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
  });

  next();
};
