// Express 5-safe request sanitization.
//
// Replaces the deprecated `express-mongo-sanitize` and `xss-clean` packages,
// both of which reassign `req.query` — illegal in Express 5 where `req.query`
// is a read-only getter. This middleware mutates objects in place instead.
//
// - Removes keys containing `$` or `.` to block NoSQL operator injection.
// - Strips angle brackets from string values to mitigate stored XSS
//   (credential fields are left untouched so passwords are never altered).

const FORBIDDEN_KEY = /^\$|\./;
const PRESERVE_KEYS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
]);

function sanitizeValue(value) {
  if (typeof value === "string") {
    return value.replace(/[<>]/g, "");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEY.test(key)) {
      delete obj[key];
      continue;
    }
    if (PRESERVE_KEYS.has(key)) continue; // never mangle credential values
    obj[key] = sanitizeValue(obj[key]);
  }
  return obj;
}

export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === "object") sanitizeObject(req.body);
  if (req.params && typeof req.params === "object") sanitizeObject(req.params);
  // req.query is a read-only getter in Express 5 — mutate its contents in place.
  if (req.query && typeof req.query === "object") sanitizeObject(req.query);
  next();
}
